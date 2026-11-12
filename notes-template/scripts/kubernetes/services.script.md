---
id: kubernetes-services
title: Services
topic: Kubernetes
source: notes/kubernetes/services.md
source_hash: 1d9b0e484d8a44867433c5288dd277abcbe55ea9
model: claude-opus-5
skill_version: 2
status: draft
---
Let's revise Services.

By the end of this session, you should be able to explain why a Service exists, what endpoints are, the types a Service can be, how it is found by DNS, and why an Ingress is a different thing altogether.

Start with why you need one.

Pods come and go, and each new pod gets a new IP address.

So nothing should ever hold onto a pod's IP.

A Service is a stable name and address sitting in front of a set of pods.

A Service picks those pods with a label selector rather than by name, so any pod carrying the labels is in.

Next, endpoints.

The set of healthy pods behind a Service is called its endpoints.

A pod joins the endpoints only once its readiness probe passes, and it leaves as soon as that probe fails.

That is exactly how a rolling update keeps serving traffic: the old pods stay in the endpoints until the new ones are ready.

Now the types.

ClusterIP is the default, and it's reachable only from inside the cluster, which is what you want for one service talking to another.

NodePort opens the same port on every node.

NodePort is mostly a building block and is rarely used directly.

LoadBalancer asks the cloud for an external load balancer pointing at the Service.

And ExternalName does no proxying at all.

ExternalName is just a DNS alias to a name outside the cluster.

That brings us to DNS.

Every Service gets a DNS name inside the cluster.

Within a namespace, the short form is simply the Service name.

Across namespaces it is the Service name, then the namespace.

So reaching another team's service means naming its namespace too.

Last, and this one catches people out: an Ingress is not a Service.

A Service of type LoadBalancer gives you one load balancer per Service, which gets expensive quickly.

An Ingress sits in front and routes by hostname and path to several Services behind a single entry point.

But an Ingress needs an ingress controller running in the cluster.

Without a controller, the Ingress object does nothing at all.

To recap.

Pods are not addressable, so a Service gives a stable address and selects its pods by label.

Its endpoints are the healthy pods, governed by the readiness probe, which is what makes rolling updates seamless.

The types are ClusterIP inside the cluster, NodePort on every node, LoadBalancer from the cloud, and ExternalName as a DNS alias.

Services are found by DNS, with the namespace added when you reach across.

And an Ingress routes to several Services through one entry point, but only if a controller is running.

That's your revision on Services.
