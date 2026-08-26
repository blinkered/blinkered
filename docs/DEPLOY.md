# Deploying

Blinkered is a static site once built: two HTML pages, one bundle, and sixteen word lists. So
the container is nginx serving files, nothing at runtime is Node, and there is no database and
no server-side state yet. That will change when accounts arrive; until then this is about as
simple as a deployment gets.

## The short version

```
git push                          # CI builds and pushes ghcr.io/blinkered/blinkered
kubectl apply -f deploy/k8s/      # once, or after editing a manifest
kubectl set image deployment/blinkered web=ghcr.io/blinkered/blinkered:sha-<short>
```

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
weeks later comes up on different code than its neighbours.

## Letting the cluster pull it

A GHCR package is **private** by default, even from a public repository. Two ways:

**Make the package public** (simplest, and this is a game whose source is already public). On
GitHub: the package page, Package settings, Change visibility, Public. Then nothing else is
needed.

**Or give the cluster a pull secret.** Use a personal access token with `read:packages`:

```
kubectl create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<token-with-read:packages>
```

and add it to `deploy/k8s/deployment.yaml`, under `spec.template.spec`:

```yaml
imagePullSecrets:
  - name: ghcr
```

## The manifests

`deploy/k8s/` holds three files, plain YAML, no Helm. Rancher will take them as they are, from
`kubectl apply` or pasted into the Import YAML box.

- **deployment.yaml** — two replicas, tiny requests (10m CPU, 32Mi), `/healthz` for both
  probes. Runs as uid 101 with a read-only root filesystem, no capabilities and no privilege
  escalation, which is why there are `emptyDir` mounts at `/var/cache/nginx` and `/tmp`: nginx
  needs somewhere to write and is not allowed to write anywhere else.
- **service.yaml** — ClusterIP, port 80 to the container's 8080.
- **ingress.yaml** — `playblinkered.com`, `ingressClassName: nginx`, cert-manager annotation
  for TLS. **Edit the host**, and drop the `tls` block and the annotation if TLS is terminated
  ahead of the cluster.

The container listens on **8080**, not 80, because it runs unprivileged and cannot bind a
privileged port.

## Two things about the word lists

They are the payload: 35MB of text across sixteen languages, and Russian alone is 8.3MB.

**They are pre-compressed at build time**, not at request time. The build writes a `.gz` beside
every text file and nginx serves it with `gzip_static`. Russian goes out as 1.2MB instead of
8.3MB, and no CPU is spent compressing the same 8MB over and over. Verified: the same URL
returns 8,471,431 bytes without `Accept-Encoding: gzip` and 1,262,232 with it.

**Only one language is fetched per session**, when it is chosen, so nobody downloads 35MB. The
manifest at `/words/manifest.json` is 3KB and is all the app needs to know what exists.

If an ingress sits in front of this, check its buffer limits. The two annotations in
`ingress.yaml` turn off body-size limits and response buffering for the nginx ingress
controller, because a truncated word list is a broken game rather than a slow one. A different
controller will want its own equivalent.

## Caching

| path            | header                          | why                                                    |
| --------------- | ------------------------------- | ------------------------------------------------------ |
| `/assets/`      | `max-age=31536000, immutable`   | Vite fingerprints the filename                         |
| `/words/`       | `max-age=3600, must-revalidate` | no hash in the name, so revalidate; ETag does the rest |
| everything else | `no-cache`                      | the two HTML entry points must not go stale            |

A stale word list is caught by the app rather than being served as gibberish: the file's first
line has to parse as a Blinkered header, and anything else is refused with a clear message.

## Checking a deployment

```
kubectl rollout status deployment/blinkered
kubectl port-forward deployment/blinkered 8099:8080
```

Then, against `http://localhost:8099`:

| check                     | expect                 |
| ------------------------- | ---------------------- |
| `/healthz`                | `ok`                   |
| `/`                       | 200, `text/html`       |
| `/how-to-play.html`       | 200, the rules page    |
| `/words/manifest.json`    | 200, sixteen languages |
| `/words/ru.txt` with gzip | ~1.2MB, not 8.3MB      |
| `/nope`                   | **404**, not the app   |

That last one is deliberate. There is no client-side router, so an unknown path is an error and
should say so. A server that answers every path with `index.html` is what once made a missing
word list look like a parse failure.

## What is not here yet

No accounts, no server, no database, so nothing to back up and no secrets to manage beyond a
possible pull secret. Scores live in the player's own browser. When PLAN.md phase 4 lands this
page grows a Postgres and a real backend; until then a rollback is one `kubectl set image`.
