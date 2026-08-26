#!/bin/sh
# Builds, pushes and rolls out one image, from here rather than from CI.
#
# The normal path is .github/workflows/release.yml: push to main, GitHub builds it on an amd64
# runner and pushes it to GHCR. This exists for when you want an image now, and it forces
# --platform because a build on an Apple Silicon machine defaults to arm64, which will not run
# on the cluster. Cross-building under emulation is slow; that is the price of not waiting.
#
#   ./deploy/release.sh                 build and push :<git sha> and :latest
#   IMAGE=... ./deploy/release.sh       somewhere other than GHCR
#   ./deploy/release.sh --deploy        also apply the manifests and wait for the rollout
set -eu

IMAGE="${IMAGE:-ghcr.io/blinkered/blinkered}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"
# Rancher clusters are amd64 unless someone went out of their way, and this is built on a Mac.
PLATFORM="${PLATFORM:-linux/amd64}"

echo "building ${IMAGE}:${TAG} for ${PLATFORM}"
docker buildx build \
  --platform "${PLATFORM}" \
  --tag "${IMAGE}:${TAG}" \
  --tag "${IMAGE}:latest" \
  --push \
  .

if [ "${1:-}" = "--deploy" ]; then
  kubectl apply -f deploy/k8s/
  kubectl set image deployment/blinkered "web=${IMAGE}:${TAG}"
  kubectl rollout status deployment/blinkered --timeout=120s
fi

echo "done: ${IMAGE}:${TAG}"
