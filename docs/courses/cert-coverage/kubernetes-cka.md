# Certified Kubernetes Administrator — the Cluster Yard — certification and cost sheet

**CNCF Certified Kubernetes Administrator (CKA)** · Administrator · exam fee $445 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

**Certified Kubernetes Administrator (CKA)**

## Exam coverage — 100% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Troubleshooting | 30% | Work a broken pod, one change per row; Hand the cluster over |
| Cluster Architecture, Installation and Configuration | 25% | Read the control plane and nodes; Create and use a namespace; Lock access down with RBAC; Back up and restore the cluster state |
| Services and Networking | 20% | Expose it with a Service and Ingress; Fence it with a NetworkPolicy |
| Workloads and Scheduling | 15% | Deploy the app with probes; Set requests, limits and scale; Steer where pods schedule |
| Storage | 10% | Persist data on a volume |

## Cost

Exam $445 · one-off $0 · monthly ceiling $0 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| kind, kubectl and helm | software | $0 | Free; a whole cluster runs in Docker on the student machine, no paid cloud needed. |
| A local kind cluster | software | $0 | Runs locally; the cluster is deleted at the end so nothing lingers. |

