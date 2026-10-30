# Certified Kubernetes Administrator — the Cluster Yard — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Set up the cluster

> The tools installed, a kind cluster up with a Ready node, and the folder ready.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| kind cluster | A whole cluster in Docker, the ground everything runs on | Cluster Setup & Access Register |
| 1 Setup & access | Records the tools, the cluster and the team | Cluster Setup & Access Register |

**Process — Set up: tools, a cluster, the folder:** kind → controlplane (cluster up, node Ready).

## Week 1 — Read and lock the cluster

> New: the control plane read component by component, a team namespace, and RBAC proved on grant and denial.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Control plane | The API server, scheduler, controller manager and etcd | Cluster Architecture & Access Record |
| RBAC | Who can do what, proved on both the grant and the denial | Cluster Architecture & Access Record |
| Namespace | Where the team works, isolated from the rest of the cluster | Cluster Architecture & Access Record |
| 2 Architecture & access | Records the control plane, the nodes and RBAC | Cluster Architecture & Access Record |

**Process — Week 1: read the plane, namespace, RBAC:** controlplane → namespace (components healthy); rbac → namespace (access locked down).

## Week 2 — Deploy and schedule

> New: the Deployment behind probes, requests and limits set, and a pod steered to a chosen node.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Deployment | The app as replicas behind liveness and readiness probes | Workloads & Scheduling Record |
| Requests & limits | What the scheduler reserves and the kubelet caps | Workloads & Scheduling Record |
| Scheduling | Steering which pod lands on which node | Workloads & Scheduling Record |
| Running app | The app pods serving behind their probes | Workloads & Scheduling Record |
| 3 Workloads & scheduling | Records the Deployment, probes and scheduling | Workloads & Scheduling Record |

**Process — Week 2: deploy, resource, schedule:** deploy → app_run (rolled out behind probes); resources → app_run (requests and limits set); schedule → app_run (steered to a node).

## Week 3 — Expose and persist

> New: a Service and Ingress, a default-deny NetworkPolicy with one allow, and data on a persistent volume.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Volume (PVC) | The claim the data lives on, across pod recreates | Services, Networking & Storage Record |
| Service | A stable name and address over moving pods | Services, Networking & Storage Record |
| Ingress | The route that reaches the app by host name | Services, Networking & Storage Record |
| NetworkPolicy | The cluster flipped from open to closed, one door opened on purpose | Services, Networking & Storage Record |
| 4 Services & storage | Records the Services, NetworkPolicy and volumes | Services, Networking & Storage Record |

**Process — Week 3: expose, fence, persist:** service → app_run (stable name); netpol → app_run (default-deny, one allow); app_run → pvc (data survives recreate).

## Week 4 — Recover and hand over

> New: a broken pod worked to Running, a verified etcd snapshot, the recovery decided, and the cluster handed over and deleted.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Broken pod | A pod that will not start, worked to Running, failures kept | Cluster Troubleshooting Log |
| etcd snapshot | The one backup that rebuilds a cluster from nothing | Backup & Recovery Record |
| Recovery | The decision for when a node or the state is lost | Backup & Recovery Record |
| Custody | A hash for every artifact the course produced | Handover & As-Built |
| 5 Troubleshooting log | Records the broken pod worked one change per row | Cluster Troubleshooting Log |
| 6 Backup & recovery | Records the etcd snapshot and the recovery decision | Backup & Recovery Record |
| 7 Handover | The capstone: the cluster as it is, with custody for every artifact | Handover & As-Built |
| 8 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: troubleshoot, back up, hand over:** fault → app_run (worked to Running); controlplane → etcd (snapshot taken, verified); recovery → custody (every artifact hashed); custody → r_handover (handed over).

## Week 5 — Local LLM serving: Serve a model locally

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — AI agents and MCP: An agent with tools

Nothing new is built this week; the process is drawn over the picture.

## Week 7 — AI agents and MCP: Expose a tool over MCP

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Control Plane (Cluster Lead) | Leads the cluster record: the control plane, the nodes, RBAC and the etcd backup. | Cluster Architecture & Access Record, Backup & Recovery Record | Cluster Setup & Access Register, Workloads & Scheduling Record | Cluster Troubleshooting Log, Handover & As-Built, Portfolio | Workloads (Scheduling Lead), Operations (Records Lead) | Workloads (Scheduling Lead), Operations (Records Lead) |
| Workloads (Scheduling Lead) | Leads the workload record: Deployments, probes, resources and scheduling. | Workloads & Scheduling Record | Services, Networking & Storage Record, Handover & As-Built, Portfolio | Cluster Setup & Access Register, Cluster Architecture & Access Record, Backup & Recovery Record | Control Plane (Cluster Lead), Networking & Storage (Platform Lead) | Control Plane (Cluster Lead), Networking & Storage (Platform Lead), Operations (Records Lead) |
| Networking & Storage (Platform Lead) | Leads the network and storage record: Services, Ingress, NetworkPolicy and volumes. | Services, Networking & Storage Record | Cluster Troubleshooting Log | Workloads & Scheduling Record | Workloads (Scheduling Lead), Operations (Records Lead) | Workloads (Scheduling Lead), Operations (Records Lead) |
| Operations (Records Lead) | Leads the records that outlive the cluster: troubleshooting, the runbook, custody and handover. | Cluster Setup & Access Register, Cluster Troubleshooting Log, Handover & As-Built, Portfolio | Cluster Architecture & Access Record, Backup & Recovery Record | Services, Networking & Storage Record | Control Plane (Cluster Lead), Workloads (Scheduling Lead), Networking & Storage (Platform Lead) | Control Plane (Cluster Lead), Networking & Storage (Platform Lead) |

