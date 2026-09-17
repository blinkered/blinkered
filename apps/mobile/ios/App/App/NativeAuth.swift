import AuthenticationServices
import Capacitor
import Foundation
import UIKit

/**
 * The two sign-in sheets a WebView cannot show, and nothing else.
 *
 * This plugin fetches nothing, stores nothing and decides nothing. `signInWithApple` shows
 * Apple's sheet and returns the identity token it produces; `signInWithBrowser` runs a browser
 * outside the app and returns the URL it ended at. Every other part of signing in --- the nonce,
 * the hashing, the token exchange, where the API lives, what to keep --- is in
 * `apps/web/src/nativeAuth.ts`, where the tests are and where `api.ts` already knows the answers.
 *
 * That split is the design rather than an accident of taste. Swift that talks to the API needs a
 * second copy of the origin, the bearer header and the token store, and it is the copy nobody
 * runs in a test. Here, the only thing that cannot be written in TypeScript is the part that is
 * genuinely iOS: a system authorization request, and a browser session out of process.
 *
 * Why out of process at all: Google refuses OAuth in an embedded WebView (`disallowed_useragent`)
 * and `WKAppBoundDomains` refuses to navigate this WebView off our own domains. See docs/IOS.md.
 */
@objc(NativeAuth)
public class NativeAuth: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAuth"
    public let jsName = "NativeAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signInWithApple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInWithBrowser", returnType: CAPPluginReturnPromise)
    ]

    /// Held for the life of a request, because `ASAuthorizationController` does not retain its own
    /// delegate and a released one is a sheet that opens and never answers.
    private var appleRequest: AppleRequest?
    /// Same reason: a session that goes out of scope closes itself.
    private var browserSession: ASWebAuthenticationSession?
    /// Where the sheet is anchored. `CAPPlugin` has the bridge's view controller; the window is
    /// what `ASWebAuthenticationSession` asks for.
    private lazy var anchor = PresentationAnchor()

    /**
     * Sign in with Apple, through the system rather than through a browser.
     *
     * `nonceHash` is passed straight to Apple and comes back inside the signed token. It is
     * already a hash when it arrives here --- the server issued the nonce and the web layer
     * hashed it --- so this method has no crypto in it and no opinion about what a nonce is.
     *
     * Only the identity token is returned. The authorization code is of no use to us: the server
     * verifies the token's signature against Apple's public keys and its audience against this
     * app's bundle identifier, and a code would mean a second exchange with nothing to add.
     */
    @objc func signInWithApple(_ call: CAPPluginCall) {
        guard let nonceHash = call.getString("nonceHash"), !nonceHash.isEmpty else {
            call.reject("a nonce is required")
            return
        }

        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = nonceHash

        let controller = ASAuthorizationController(authorizationRequests: [request])
        let pending = AppleRequest(call: call) { [weak self] in
            // Let go once it has answered, so a second sign-in is not held up by the first.
            self?.appleRequest = nil
        }
        appleRequest = pending
        controller.delegate = pending
        controller.presentationContextProvider = anchor
        DispatchQueue.main.async {
            controller.performRequests()
        }
    }

    /**
     * A web handshake in a browser the app does not own.
     *
     * `ASWebAuthenticationSession` is Safari: a real user agent with its own cookie store, which
     * is what makes Google willing to serve it and what puts the navigation outside the reach of
     * app-bound domains. It ends when the browser is sent to a URL whose scheme is `scheme`, and
     * that URL is handed back unread --- what is in it is a question about our own API.
     *
     * Not ephemeral. A shared session means somebody already signed in to Google in Safari is one
     * tap from being signed in here, which is the whole reason to use a real browser.
     */
    @objc func signInWithBrowser(_ call: CAPPluginCall) {
        guard let start = call.getString("url"), let url = URL(string: start) else {
            call.reject("a url is required")
            return
        }
        guard let scheme = call.getString("scheme"), !scheme.isEmpty else {
            call.reject("a callback scheme is required")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: scheme
            ) { [weak self] callback, error in
                self?.browserSession = nil
                if let callback {
                    call.resolve(["url": callback.absoluteString])
                    return
                }
                // `canceledLogin` is somebody closing the sheet. The word matters: the web layer
                // reads "cancel" out of the message and says nothing to the player about it.
                if let error = error as? ASWebAuthenticationSessionError,
                   error.code == .canceledLogin {
                    call.reject("cancelled")
                    return
                }
                call.reject(error?.localizedDescription ?? "the browser session failed")
            }
            session.presentationContextProvider = self.anchor
            self.browserSession = session
            session.start()
        }
    }
}

/**
 * One Apple authorization request, and the delegate it needs to stay alive for.
 *
 * A class of its own rather than conformances on the plugin, so that two sign-ins in a row cannot
 * share state, and so `done` can drop the reference the moment either callback fires.
 */
private final class AppleRequest: NSObject, ASAuthorizationControllerDelegate {
    private let call: CAPPluginCall
    private let done: () -> Void

    init(call: CAPPluginCall, done: @escaping () -> Void) {
        self.call = call
        self.done = done
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        defer { done() }
        guard
            let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
            let data = credential.identityToken,
            let token = String(data: data, encoding: .utf8)
        else {
            call.reject("apple returned no identity token")
            return
        }
        call.resolve(["identityToken": token])
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        defer { done() }
        // `.canceled` is the common ending, not a fault: somebody looked at the sheet and
        // changed their mind. Reported in a word the web layer recognises.
        if let failure = error as? ASAuthorizationError, failure.code == .canceled {
            call.reject("cancelled")
            return
        }
        call.reject(error.localizedDescription)
    }
}

/**
 * Which window the sheets belong to.
 *
 * `UIApplication.shared.windows` is deprecated and wrong under multiple scenes; the first key
 * window of the first active scene is the app's only window in practice, and is the one the
 * WebView is in.
 */
private final class PresentationAnchor: NSObject, ASWebAuthenticationPresentationContextProviding,
    ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        window()
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        window()
    }

    private func window() -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let found = scenes.flatMap(\.windows).first(where: \.isKeyWindow) ?? scenes.first?.windows.first
        return found ?? ASPresentationAnchor()
    }
}
