#!/usr/bin/env bash
#
# Deploy Blinkered to an environment.
#
#   deploy/deploy.sh dev [sha-abc1234]
#   deploy/deploy.sh prod [sha-abc1234]
#
# Exists because one flag is easy to get wrong and the failure is silent for eight minutes.
#
# **`--wait=legacy` is the whole reason this file is a file.** Helm 4 changed what a bare `--wait`
# means: it now selects the `watcher` strategy, where Helm 3 polled. Helm deletes the pre-upgrade
# hook Job before creating it -- even when there is no such Job -- and then waits for that
# deletion to be observed. The watcher waits for an event that has already gone by, or that will
# never come, so it sits until the timeout and never creates the Job at all.
#
# The symptom is worth recognising, because it does not look like what it is: the release sits in
# `pending-upgrade`, **there is no migrate Job in the namespace**, and the Deployments are
# untouched. That reads like a slow migration and is the opposite -- nothing has started.
#
# `legacy` polls, sees the object is absent, and moves on. The upgrade that hung for eight minutes
# finishes in thirteen seconds.
#
# One red herring recorded so nobody chases it twice: Helm prints
# `INTERNAL_ERROR; received from peer` watch warnings throughout, which look like the cause and
# are not. `kubectl get jobs --watch` through the same Rancher proxy survives indefinitely, with
# and without HTTP/2. It was measured.
set -euo pipefail

environment=${1:-}
case "$environment" in
  dev) context=tl-dev; namespace=blinkered-dev ;;
  prod) context=tl-prod; namespace=blinkered-prod ;;
  *) echo "usage: $(basename "$0") dev|prod [image-tag]" >&2; exit 64 ;;
esac

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
values="$root/deploy/helm/blinkered/values-$environment.yaml"
tag=${2:-$(awk '/^  tag: /{print $2}' "$values")}

if [ -z "$tag" ]; then
  echo "no image tag: pass one, or set image.tag in $(basename "$values")" >&2
  exit 65
fi

# Both images or neither. A tag that exists for one and not the other is an ImagePullBackOff with
# no useful message, and GHCR does not always inherit the repository's visibility.
for image in blinkered blinkered-api; do
  if ! docker manifest inspect "ghcr.io/blinkered/$image:$tag" >/dev/null 2>&1; then
    echo "ghcr.io/blinkered/$image:$tag is not pullable -- has the Release workflow finished?" >&2
    exit 69
  fi
done

echo "==> $environment ($context/$namespace) to $tag"
helm --kube-context "$context" -n "$namespace" upgrade --install blinkered \
  "$root/deploy/helm/blinkered" \
  -f "$values" \
  --set "image.tag=$tag" \
  --wait=legacy \
  --timeout 10m

echo "==> rolled:"
kubectl --context "$context" -n "$namespace" get deploy \
  -o jsonpath='{range .items[*]}    {.metadata.name}  {.spec.template.spec.containers[0].image}{"\n"}{end}'
# The whole log, not a tail of it. The Job now names every migration it applies, so three lines
# was the summary and nothing above it -- which is the half you want on the deploy that did
# something. It is a handful of lines even on a first install.
echo "==> migrations:"
kubectl --context "$context" -n "$namespace" logs job/blinkered-migrate 2>&1 | sed 's/^/    /'
