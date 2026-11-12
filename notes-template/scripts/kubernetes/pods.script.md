---
id: kubernetes-pods
title: Pods
topic: Kubernetes
source: notes/kubernetes/pods.md
source_hash: ecc5a341e378ae927a171b82f393d231ec192954
model: claude-opus-5
skill_version: 2
status: draft
---
Let's revise pods.

By the end of this session, you should be able to explain what a pod is, why pods are disposable, how one moves through its lifecycle, what each kind of probe does, and how requests and limits differ.

Start with what a pod actually is.

A pod is the smallest thing Kubernetes schedules: one or more containers that always run together on the same node.

The containers inside a pod share a network namespace.

That means they share an IP address and can reach each other on localhost.

They can share volumes too.

Usually there's just one container per pod.

When there's a second one, it's called a sidecar, a helper such as a log shipper or a proxy.

Next, and this is the idea everything else follows from: pods are disposable.

A pod is never repaired.

If a pod dies, a new one is created in its place, with a new name and a new IP address.

So you should never point anything at a pod's IP address.

You point at a Service instead, which keeps a stable address in front of whichever pods are currently healthy.

And you rarely create pods by hand.

A Deployment creates a ReplicaSet, and the ReplicaSet is what keeps the right number of pods alive.

Now the lifecycle.

The phases are Pending, Running, Succeeded, and Failed.

Pending usually means the scheduler cannot place the pod.

Either there isn't enough CPU or memory anywhere, or no node matches its constraints.

To find out which, run kubectl describe pod, which shows the events that explain why.

Read the events before anything else.

That brings us to probes.

A liveness probe asks: is it still alive?

If a liveness probe fails, the kubelet restarts the container.

A readiness probe asks something different: can it take traffic yet?

If a readiness probe fails, the pod is removed from the Service's endpoints, but it is not restarted.

Getting these the wrong way round is a classic mistake.

A slow starter with only a liveness probe will restart forever.

Last, resources.

A request is what the scheduler reserves for the container.

A limit is the ceiling the container may use.

The two limits behave differently when you cross them.

Exceed a memory limit and the container is killed, which you'll see reported as OOMKilled.

Exceed a CPU limit and it is throttled instead.

To recap.

A pod is the smallest unit Kubernetes schedules, containers in it share an IP and can share volumes, and usually there's one container plus perhaps a sidecar.

Pods are disposable, so you address a Service, not a pod, and you let a Deployment and its ReplicaSet manage them.

The phases are Pending, Running, Succeeded and Failed, and describe pod tells you why something is stuck.

Liveness restarts, readiness takes a pod out of service.

And requests reserve, limits cap, with memory killing the container and CPU throttling it.

That's your revision on pods.
