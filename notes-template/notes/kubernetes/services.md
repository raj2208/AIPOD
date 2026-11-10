# Services

Sample note. Replace it with your own.

## Why a Service
- Pods come and go, and each new one gets a new IP. Nothing should hold a pod's IP.
- A Service is a stable name and address in front of a set of pods.
- It picks its pods with a label selector, not by name. Any pod carrying the labels is in.

## Endpoints
- The set of healthy pods behind a Service is its endpoints.
- A pod joins the endpoints only once its readiness probe passes, and leaves as soon as it fails.
- That is how a rolling update keeps serving: old pods stay in the endpoints until new ones are ready.

## Types
- ClusterIP: the default. Reachable only inside the cluster. Use it for one service talking to another.
- NodePort: opens the same port on every node. Mostly a building block, rarely used directly.
- LoadBalancer: asks the cloud for an external load balancer pointing at the Service.
- ExternalName: no proxying at all, just a DNS alias to a name outside the cluster.

## DNS
- Every Service gets a DNS name inside the cluster.
- Short form within a namespace is the Service name. Across namespaces it is the Service name, then the namespace.
- So reaching another team's service means naming its namespace too.

## Ingress is not a Service
- A Service of type LoadBalancer gives you one load balancer per Service, which gets expensive.
- An Ingress sits in front and routes by hostname and path to several Services behind one entry point.
- An Ingress needs an ingress controller running in the cluster. Without one, the Ingress object does nothing.
