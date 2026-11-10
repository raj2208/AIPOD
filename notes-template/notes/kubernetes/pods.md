# Pods

Sample note. Replace it with your own.

## What a pod is
- Smallest thing Kubernetes schedules. One or more containers that always run together on the same node.
- Containers in a pod share a network namespace (same IP, same localhost) and can share volumes.
- Usually one container per pod. A second container is a sidecar: a helper such as a log shipper or a proxy.

## Pods are disposable
- A pod is never repaired. If it dies, a new one is created with a new name and a new IP.
- So never point anything at a pod's IP. Point at a Service, which keeps a stable address in front of whichever pods are healthy.
- You rarely create pods by hand. A Deployment creates a ReplicaSet, and the ReplicaSet keeps the right number of pods alive.

## Lifecycle
- Phases: Pending, Running, Succeeded, Failed.
- Pending usually means the scheduler cannot place it: not enough CPU or memory, or no node matches its constraints.
- `kubectl describe pod` shows the events that explain why. Read the events before anything else.

## Probes
- Liveness probe: is it still alive? If it fails, the kubelet restarts the container.
- Readiness probe: can it take traffic yet? If it fails, the pod is removed from the Service's endpoints but is not restarted.
- Getting these the wrong way round is a classic mistake: a slow starter with only a liveness probe restarts forever.

## Resources
- Request = what the scheduler reserves. Limit = the ceiling the container may use.
- Exceed a memory limit and the container is killed (OOMKilled). Exceed a CPU limit and it is throttled instead.
