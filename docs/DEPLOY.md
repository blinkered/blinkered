# Deploying

Blinkered is a static site once built: two HTML pages, one bundle, and a word list per language. So
the container is nginx serving files, nothing at runtime is Node, and there is no database and
no server-side state yet. That will change when accounts arrive; until then this is about as
simple as a deployment gets.

## The short version

```
git push                                   # CI builds and pushes ghcr.io/blinkered/blinkered
kubectl -n blinkered-prod set image deployment/blinkered \
  web=ghcr.io/blinkered/blinkered:sha-<short>
```

A routine deploy is that second command alone. **`kubectl apply -f deploy/k8s/` resets the image
to `:latest`**, because that is what the manifest says, so use it only when a manifest actually
changed, and follow it with `set image` to get back to a pinned digest.

## Where the image comes from

**CI, not a laptop.** `.github/workflows/release.yml` builds on every push to `main` and on
every `v*` tag, and pushes to GHCR at `ghcr.io/blinkered/blinkered`.

That is not fussiness about repeatability. A GitHub runner is amd64, which is what a Rancher
cluster almost certainly runs; a build on an Apple Silicon machine produces an **arm64** image,
which will be pulled successfully and then fail to start with `exec format error`. If you do
build locally, `deploy/release.sh` forces `--platform linux/amd64` for exactly this reason, and
it will be slow because it is emulating.

Tags the workflow pushes:

| tag            | means                                         |
| -------------- | --------------------------------------------- |
| `latest`       | the tip of `main`                             |
| `main`         | the same thing, named after the branch        |
| `sha-abc1234`  | one commit, and the tag to name in a rollback |
| `1.2.3`, `1.2` | from a `v1.2.3` git tag                       |

Deploy a `sha-` tag rather than `latest`. `latest` moves under you, so a pod restarting two
weeks later comes up on different code than its neighbors.

## Letting the cluster pull it

Nothing to do: the GHCR package is public, so the nodes pull anonymously and there is no pull
secret. Verified by fetching the manifest with an anonymous token, which returns 200.

If it is ever made private again, add a secret and reference it:

```
kubectl create secret docker-registry ghcr -n blinkered-prod \
  --docker-server=ghcr.io --docker-username=<user> --docker-password=<read:packages token>
```

```yaml
imagePullSecrets:
  - name: ghcr
```

The secret has to live in the same namespace as the deployment, and a token with an expiry stops
_new_ pulls the day it lapses while running pods keep serving, so it presents as a scheduling
problem rather than an auth one.

## The manifests

`deploy/k8s/` holds four files, plain YAML, no Helm. Everything is namespaced `blinkered-prod`
explicitly, so an apply cannot land somewhere else by inheriting a context's default namespace.

- **deployment.yaml** — two replicas, tiny requests (10m CPU, 32Mi), `/healthz` for both probes.
  Runs as uid 101 with a read-only root filesystem, no capabilities and no privilege escalation,
  which is why there are `emptyDir` mounts at `/var/cache/nginx` and `/tmp`: nginx needs
  somewhere to write and is not allowed to write anywhere else.
- **service.yaml** — ClusterIP, port 80 to the container's 8080.
- **middleware.yaml** — two Traefik middlewares: the www redirect and response compression.
- **ingress.yaml** — both hostnames, class `public`, with both middlewares attached.

The container listens on **8080**, not 80, because it runs unprivileged and cannot bind a
privileged port.

### This cluster runs Traefik, not nginx

Worth stating plainly because the first version of these manifests assumed otherwise and every
annotation in them did nothing. `tl-prod` has two ingress classes, `private` (the default) and
`public`, both `traefik.io/ingress-controller`. Use **`public`** for anything meant to be
reachable from outside.

There is also **no cert-manager**. Certificates come from Traefik's own ACME resolver, keyed on
the Host rules in the ingress, which is why adding `www` to the rules was enough to get it a
certificate without anyone asking for one. The `cert-manager.io/cluster-issuer` annotation was
inert, and `spec.tls[].secretName` is vestigial — no such secret exists and TLS works anyway.

### One canonical hostname

`www.playblinkered.com` 301s to the apex, via the `www-to-apex` middleware.

Not tidiness: a guest's scores live in `localStorage`, which is scoped per origin, so serving
the game on both hostnames means somebody who arrives on `www` one day and the apex the next
finds an empty leaderboard. Their scores are not lost, they are on the other origin, which is
worse than lost because it looks like a bug.

**Both hostnames need a rule.** This is the opposite of the nginx controller, where the `www`
rule must be left out because the annotation generates that server block itself. Traefik only
routes hosts it has a rule for, so without one, `www` never reaches the middleware and 404s —
which is exactly what it did before this was fixed.

**Middleware references are `<namespace>-<name>@kubernetescrd`**, comma-separated with no
spaces. Traefik happens to trim a space, but a reference it cannot resolve takes the whole
router out of service rather than failing quietly, so it is not a thing to be relaxed about.

## The word lists, and who compresses them

They are the payload: 122MB of text across fifty-one languages. Hungarian alone is 17.2MB, and
Arabic, Russian and Turkish are 8.5 to 9MB each. Only the chosen language is ever fetched, when
it is chosen, so nobody downloads all of it. The manifest at `/words/manifest.json` is 3KB and is
all the app needs to know what exists.

**Traefik compresses them, not nginx**, and finding that out was worth the trouble. The build
writes a `.gz` beside every text file and nginx serves it with `gzip_static`, which works
perfectly when you talk to the pod directly. Through the ingress it did nothing: Traefik does not
forward the client's `Accept-Encoding`, so nginx saw no gzip request and served the plain file.

The evidence, because this is invisible unless measured: at the edge, `en.txt` arrived as
1,736,592 bytes carrying the _uncompressed_ file's ETag, byte-identical to what the pod returns
when asked for `identity`. Straight to the pod with `Accept-Encoding: gzip` it is 470,459 bytes
with `Content-Encoding: gzip`.

So the `compress` middleware does it at the ingress instead. Measured at the edge afterwards:

|     | plain  | gzip   |      |
| --- | ------ | ------ | ---- |
| en  | 1.66MB | 0.48MB | 3.5x |
| ru  | 8.08MB | 1.35MB | 6.0x |
| sv  | 4.37MB | 1.26MB | 3.5x |

The build-time `.gz` files are not wasted. They are what serves when there is no Traefik in
front, which is the case locally and would be the case behind any proxy that does forward the
header. Belt and braces, and the belt costs nothing.

## Caching

| path            | header                          | why                                                    |
| --------------- | ------------------------------- | ------------------------------------------------------ |
| `/assets/`      | `max-age=31536000, immutable`   | Vite fingerprints the filename                         |
| `/words/`       | `max-age=3600, must-revalidate` | no hash in the name, so revalidate; ETag does the rest |
| everything else | `no-cache`                      | the two HTML entry points must not go stale            |

A stale word list is caught by the app rather than being served as gibberish: the file's first
line has to parse as a Blinkered header, and anything else is refused with a clear message.

## Cloudflare in front, and the one rule it needed

playblinkered.com is proxied by Cloudflare. Two certificates, Cloudflare's at the edge and
Traefik's ACME one at the origin, which is the ordinary arrangement and needs nothing from the
manifests. The apex ingress and the www redirect are untouched by it.

**Turning it on cached nothing.** Cloudflare decides what is cacheable from a list of file
extensions before it looks at what the origin asked for, and `.txt` and `.json` are not on that
list. Measured at the edge before the rule existed:

| path                     | origin `cache-control`                  | `cf-cache-status` |
| ------------------------ | --------------------------------------- | ----------------- |
| `/words/en.txt`          | `public, max-age=3600, must-revalidate` | `DYNAMIC`         |
| `/words/manifest.json`   | `public, max-age=3600, must-revalidate` | `DYNAMIC`         |
| `/assets/main-<hash>.js` | `public, max-age=31536000, immutable`   | `MISS`            |

`DYNAMIC` is Cloudflare declining to cache at all, however loudly the origin asks. `MISS` on the
JS is the opposite: cacheable, merely cold. So the payload the proxy was wanted for — 53MB of
word lists at the time, with Russian at 8.1MB — was still reaching the pod on every request.

One Cache Rule fixes it:

- **If** URI Path _starts with_ `/words/`
- **Then** cache eligibility: eligible for cache
- **Edge TTL:** _use cache-control header if present, bypass cache if not_

**That first Edge TTL option, not the second one beside it.** They are identical wherever the
header is present, which for `/words/` is every successful response. They differ only where it is
absent, and under `/words/` an absent header means an error. The second option would let
Cloudflare cache a 404 on its own schedule, which is how a missing word list starts looking like
a parse failure again. Verified afterwards: `/words/zz.txt` returns 404 with `BYPASS`.

The TTL is left respecting the origin rather than overridden, because these filenames carry no
hash. An hour at the edge is the whole win; anything longer would serve a stale list worldwide
after a `pnpm dictionary build` and would want a purge step in `deploy/release.sh` to be honest.

**Reading the result takes two requests at the same edge.** The colo is the suffix on `cf-ray`,
and consecutive requests do not necessarily share one: a run that went MIA, CDG, CDG read `HIT`,
`MISS`, `HIT`, which is three caches behaving correctly rather than one behaving strangely. Judge
it by `age` climbing on repeat requests to the same colo.

## The images, and the two nginx configs

The Dockerfile builds three things from one source tree: `serve` is nginx and the built site,
`api` is Node and the Hono server, and `build` is the shared stage both come from. The API image
is assembled with `pnpm deploy`, which resolves the workspace links into a self-contained
directory of production dependencies; copying the tree wholesale would carry the 122MB of word
lists and the whole toolchain into an image that needs none of it.

`deploy/nginx.shared.conf` holds everything the two environments have in common and is included
by both, so they cannot drift. The wrappers differ in exactly one thing:

- **`nginx.conf`**, production, serves files and nothing else. Traefik terminates TLS,
  compresses, and routes `/v1` to the API before nginx is involved.
- **`nginx.local.conf`**, used by `docker compose`, proxies `/v1` to the API container, because
  there is no Traefik there to do it.

Proxying rather than publishing the API on a second port is what puts the whole application on
one origin locally, as it is in production. The session is meant to be an ordinary same-origin
cookie, and a local setup split across two ports would need CORS to work at all, which would mean
developing against a different security model than the one that ships.

**The `/v1` prefix is not stripped.** Traefik forwards the path as it stands, so the app owns the
prefix and the local proxy does the same. That is why the API answers both `/healthz`, which is
the kubelet's and is reached on the pod, and `/v1/healthz`, which is reached the way a browser
reaches everything else and so proves the routing rather than the process.

## The Helm chart

`deploy/helm/blinkered` is what the plain YAML in `deploy/k8s/` becomes once there is more than
one thing to deploy. Three components that scale independently, because they are under different
pressure:

| component | kind        | scaled by               | why separately                                       |
| --------- | ----------- | ----------------------- | ---------------------------------------------------- |
| web       | Deployment  | `web.replicaCount`      | nginx serving files, bounded by connections          |
| api       | Deployment  | `api.replicaCount`      | Node, talks to a database, and is the one under load |
| postgres  | StatefulSet | `postgres.replicaCount` | mostly should not be scaled at all                   |

```
helm upgrade --install blinkered deploy/helm/blinkered \
  -n blinkered-prod --create-namespace \
  --set image.tag=sha-<short> --set api.image.tag=sha-<short>
```

### The database is one interface with two implementations

`postgres.enabled: true` runs the StatefulSet. `postgres.enabled: false` with
`postgres.existingSecret` pointed at a secret you made yourself uses a managed database instead,
and **nothing else in the chart changes**. The secret carries seven keys either way:

```
host   port   tls-enabled   username   password   db   schema
```

`db` and `schema` are both there because Postgres distinguishes them, and because they are made
by different things. The **database** has to exist before anything can connect at all, so initdb
creates it when the chart owns Postgres and the provider's console creates it when it does not.
The **schema** inside it is created by the migrations, in both arrangements. Letting initdb make
the schema as well would have been one line, and would have meant the chart's database arriving
in a state a managed one does not, which is the exact divergence this secret exists to prevent.

The API reads all seven as environment variables and never learns which arrangement it is in.
That is the point of doing it this way rather than with a `DATABASE_URL` in one case and discrete
settings in the other: there is one code path, so there is no configuration that only ever runs
in production.

When the chart owns the database it writes that secret itself, pointed at its own StatefulSet.
The password is generated on first install and **preserved across upgrades** by looking up the
secret already in the cluster, so an upgrade does not roll the password and lock the API out of
its own data. One consequence worth knowing: `helm template` and `--dry-run` cannot do that
lookup, so a rendered manifest shows a different password than the cluster holds. That is the
mechanism working.

### Migrating off `deploy/k8s/`

Not automatic, because the names change: the live Deployment is `blinkered` and the chart's is
`blinkered-web`. Helm will not adopt a resource it did not create, so installing the chart brings
up a second set of pods alongside the current ones rather than taking them over.

The order that does not drop traffic: install the chart with `ingress.enabled=false`, check the
pods are healthy, then delete the old Ingress, then upgrade with the ingress on, then delete the
old Deployment and Service. `deploy/k8s/` stays in the repo until that has been done once.

## Checking a deployment

```
kubectl rollout status deployment/blinkered
kubectl port-forward deployment/blinkered 8099:8080
```

Then, against `http://localhost:8099`:

| check                     | expect               |
| ------------------------- | -------------------- |
| `/healthz`                | `ok`                 |
| `/`                       | 200, `text/html`     |
| `/how-to-play.html`       | 200, the rules page  |
| `/words/manifest.json`    | 200, every language  |
| `/words/ru.txt` with gzip | ~1.2MB, not 8.3MB    |
| `/nope`                   | **404**, not the app |

That last one is deliberate. There is no client-side router, so an unknown path is an error and
should say so. A server that answers every path with `index.html` is what once made a missing
word list look like a parse failure.

At the edge rather than at the pod, two more, both of which need the same request twice:

| check                               | expect                                 |
| ----------------------------------- | -------------------------------------- |
| `/words/en.txt`, same `cf-ray` colo | `cf-cache-status: HIT`, `age` climbing |
| `/words/zz.txt`                     | `404` and `BYPASS`, never `HIT`        |

## What is not here yet

No accounts, no server, no database, so nothing to back up and no secrets to manage beyond a
possible pull secret. Scores live in the player's own browser. When PLAN.md phase 4 lands this
page grows a Postgres and a real backend; until then a rollback is one `kubectl set image`.
