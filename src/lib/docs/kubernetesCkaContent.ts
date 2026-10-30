/**
 * The Certified Kubernetes Administrator Cluster Yard's picture, as DATA (R103, R130).
 *
 * One small cluster stood up and operated: the control plane and nodes, the
 * workloads scheduled onto them, the Services, NetworkPolicy and volumes that
 * make them a system, the recovery that makes the cluster survivable, and the
 * records lane. Each part arrives in the week the course first touches it; the
 * week's process is that week's thread walked across the same boxes. Plain data,
 * drawn by `ArchDiagram`.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The cluster — a control plane, workloads scheduled, exposed and persisted',
    howToRead:
      'Left: the kind cluster, its nodes and RBAC. Middle: the workloads — Deployments, probes and scheduling. Right: the Services, NetworkPolicy and volumes. Bottom: the fault worked, the etcd backup and the recovery. Lane: the records issued at handover.',
    footer: 'Everything runs on a laptop: a kind cluster in Docker, kubectl and helm. No paid cloud.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'plane', label: 'The control plane', note: 'kind · nodes · RBAC', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'workloads', label: 'Deploy and schedule', note: 'Deployments · probes', x: 220, y: 40, w: 500, h: 340, tone: 2 },
    { id: 'platform', label: 'Expose and persist', note: 'Services · policy · volumes', x: 740, y: 40, w: 200, h: 340, tone: 3 },
    { id: 'proof', label: 'Make it survivable', note: 'fault · etcd backup · recovery', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms issued at handover', note: '1–7 · the cluster documented', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'kind', label: 'kind cluster', sub: 'nodes Ready', kind: 'server', zone: 'plane', x: 110, y: 110, arrives: 0, records: 'cka_setup', role: 'cluster', purpose: 'A whole cluster in Docker, the ground everything runs on' },
    { id: 'controlplane', label: 'Control plane', sub: 'apiserver · etcd', kind: 'control', zone: 'plane', x: 110, y: 200, arrives: 1, records: 'cka_cluster', role: 'cluster', purpose: 'The API server, scheduler, controller manager and etcd' },
    { id: 'rbac', label: 'RBAC', sub: 'role · binding', kind: 'identity', zone: 'plane', x: 110, y: 290, arrives: 1, records: 'cka_cluster', role: 'records', purpose: 'Who can do what, proved on both the grant and the denial' },
    { id: 'deploy', label: 'Deployment', sub: 'replicas · probes', kind: 'app', zone: 'workloads', x: 320, y: 110, arrives: 2, records: 'cka_workloads', role: 'workloads', purpose: 'The app as replicas behind liveness and readiness probes' },
    { id: 'resources', label: 'Requests & limits', sub: 'scheduler fair', kind: 'monitor', zone: 'workloads', x: 480, y: 110, arrives: 2, records: 'cka_workloads', role: 'workloads', purpose: 'What the scheduler reserves and the kubelet caps' },
    { id: 'schedule', label: 'Scheduling', sub: 'taints · tolerations', kind: 'control', zone: 'workloads', x: 630, y: 110, arrives: 2, records: 'cka_workloads', role: 'net', purpose: 'Steering which pod lands on which node' },
    { id: 'namespace', label: 'Namespace', sub: 'team isolation', kind: 'server', zone: 'workloads', x: 320, y: 200, arrives: 1, records: 'cka_cluster', role: 'cluster', purpose: 'Where the team works, isolated from the rest of the cluster' },
    { id: 'app_run', label: 'Running app', sub: 'Ready', kind: 'app', zone: 'workloads', x: 480, y: 200, arrives: 2, records: 'cka_workloads', role: 'workloads', purpose: 'The app pods serving behind their probes' },
    { id: 'pvc', label: 'Volume (PVC)', sub: 'Bound', kind: 'data', zone: 'workloads', x: 630, y: 200, arrives: 3, records: 'cka_network', role: 'records', purpose: 'The claim the data lives on, across pod recreates' },
    { id: 'service', label: 'Service', sub: 'stable DNS', kind: 'switch', zone: 'platform', x: 840, y: 110, arrives: 3, records: 'cka_network', role: 'net', purpose: 'A stable name and address over moving pods' },
    { id: 'ingress', label: 'Ingress', sub: 'host route', kind: 'endpoint', zone: 'platform', x: 840, y: 200, arrives: 3, records: 'cka_network', role: 'net', purpose: 'The route that reaches the app by host name' },
    { id: 'netpol', label: 'NetworkPolicy', sub: 'default deny', kind: 'control', zone: 'platform', x: 840, y: 290, arrives: 3, records: 'cka_network', role: 'net', purpose: 'The cluster flipped from open to closed, one door opened on purpose' },
    { id: 'fault', label: 'Broken pod', sub: 'one change per row', kind: 'ticket', zone: 'proof', x: 320, y: 455, arrives: 4, records: 'cka_troubleshoot', role: 'records', purpose: 'A pod that will not start, worked to Running, failures kept' },
    { id: 'etcd', label: 'etcd snapshot', sub: 'verified', kind: 'backup', zone: 'proof', x: 480, y: 455, arrives: 4, records: 'cka_backup', role: 'cluster', purpose: 'The one backup that rebuilds a cluster from nothing' },
    { id: 'recovery', label: 'Recovery', sub: 'restore · rebuild', kind: 'control', zone: 'proof', x: 640, y: 455, arrives: 4, records: 'cka_backup', role: 'cluster', purpose: 'The decision for when a node or the state is lost' },
    { id: 'custody', label: 'Custody', sub: 'every artifact hashed', kind: 'backup', zone: 'proof', x: 800, y: 455, arrives: 4, records: 'cka_handover', role: 'records', purpose: 'A hash for every artifact the course produced' },
    { id: 'r_setup', label: '1 Setup & access', sub: '', kind: 'record', zone: 'records', x: 85, y: 538, arrives: 0, records: 'cka_setup', role: 'records', purpose: 'Records the tools, the cluster and the team' },
    { id: 'r_cluster', label: '2 Architecture & access', sub: '', kind: 'record', zone: 'records', x: 230, y: 538, arrives: 1, records: 'cka_cluster', role: 'cluster', purpose: 'Records the control plane, the nodes and RBAC' },
    { id: 'r_workloads', label: '3 Workloads & scheduling', sub: '', kind: 'record', zone: 'records', x: 375, y: 538, arrives: 2, records: 'cka_workloads', role: 'workloads', purpose: 'Records the Deployment, probes and scheduling' },
    { id: 'r_net', label: '4 Services & storage', sub: '', kind: 'record', zone: 'records', x: 520, y: 538, arrives: 3, records: 'cka_network', role: 'net', purpose: 'Records the Services, NetworkPolicy and volumes' },
    { id: 'r_trouble', label: '5 Troubleshooting log', sub: '', kind: 'record', zone: 'records', x: 665, y: 538, arrives: 4, records: 'cka_troubleshoot', role: 'records', purpose: 'Records the broken pod worked one change per row' },
    { id: 'r_backup', label: '6 Backup & recovery', sub: '', kind: 'record', zone: 'records', x: 810, y: 538, arrives: 4, records: 'cka_backup', role: 'cluster', purpose: 'Records the etcd snapshot and the recovery decision' },
    { id: 'r_handover', label: '7 Handover', sub: '', kind: 'record', zone: 'records', x: 85, y: 572, arrives: 4, records: 'cka_handover', role: 'records', purpose: 'The capstone: the cluster as it is, with custody for every artifact' },
    { id: 'r_portfolio', label: '8 Portfolio', sub: '', kind: 'record', zone: 'records', x: 230, y: 572, arrives: 4, records: 'cka_portfolio', role: 'records', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'kind', to: 'controlplane', label: 'runs' },
    { from: 'controlplane', to: 'deploy', label: 'schedules' },
    { from: 'deploy', to: 'app_run', label: 'rolls out' },
    { from: 'service', to: 'app_run', label: 'selects' },
    { from: 'app_run', to: 'pvc', label: 'persists', kind: 'backup' },
    { from: 'netpol', to: 'app_run', label: 'fences' },
    { from: 'controlplane', to: 'etcd', label: 'state', kind: 'backup' },
    { from: 'recovery', to: 'custody', label: 'survivable', kind: 'admin' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Set up: tools, a cluster, the folder', steps: [
      { from: 'kind', to: 'controlplane', label: 'cluster up, node Ready' },
    ] },
    1: { title: 'Week 1: read the plane, namespace, RBAC', steps: [
      { from: 'controlplane', to: 'namespace', label: 'components healthy' },
      { from: 'rbac', to: 'namespace', label: 'access locked down' },
    ] },
    2: { title: 'Week 2: deploy, resource, schedule', steps: [
      { from: 'deploy', to: 'app_run', label: 'rolled out behind probes' },
      { from: 'resources', to: 'app_run', label: 'requests and limits set' },
      { from: 'schedule', to: 'app_run', label: 'steered to a node' },
    ] },
    3: { title: 'Week 3: expose, fence, persist', steps: [
      { from: 'service', to: 'app_run', label: 'stable name' },
      { from: 'netpol', to: 'app_run', label: 'default-deny, one allow' },
      { from: 'app_run', to: 'pvc', label: 'data survives recreate' },
    ] },
    4: { title: 'Week 4: troubleshoot, back up, hand over', steps: [
      { from: 'fault', to: 'app_run', label: 'worked to Running' },
      { from: 'controlplane', to: 'etcd', label: 'snapshot taken, verified' },
      { from: 'recovery', to: 'custody', label: 'every artifact hashed' },
      { from: 'custody', to: 'r_handover', label: 'handed over' },
    ] },
  },
  captions: {
    0: 'The tools installed, a kind cluster up with a Ready node, and the folder ready.',
    1: 'New: the control plane read component by component, a team namespace, and RBAC proved on grant and denial.',
    2: 'New: the Deployment behind probes, requests and limits set, and a pod steered to a chosen node.',
    3: 'New: a Service and Ingress, a default-deny NetworkPolicy with one allow, and data on a persistent volume.',
    4: 'New: a broken pod worked to Running, a verified etcd snapshot, the recovery decided, and the cluster handed over and deleted.',
  },
});
