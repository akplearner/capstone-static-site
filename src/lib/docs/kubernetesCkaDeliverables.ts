import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the Certified Kubernetes Administrator Cluster Yard produces (CKA).
 *
 * A four-person team stands up and operates one small cluster and documents it
 * the way a platform team would. Seven forms, one job each, in work order:
 *
 *   1 Cluster Setup & Access Register     the tools, the cluster, the team     W0
 *   2 Cluster Architecture & Access       control plane, nodes, RBAC           W1
 *   3 Workloads & Scheduling Record       Deployments, probes, scheduling      W2
 *   4 Services, Networking & Storage      Services, NetworkPolicy, volumes     W3
 *   5 Cluster Troubleshooting Log         a broken pod, one row a try          W4
 *   6 Backup & Recovery Record            etcd snapshot ← the recovery choice  W4
 *   7 Handover & As-Built                 the cluster as it is  ← capstone     W4
 *
 * FORM 6 CARRIES THE DECISION the course is about: how the cluster is recovered
 * when a node or the state is lost. Form 5 is the method: it keeps the theories
 * that were wrong, because a log with none is not believed.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'kubernetes-cka'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });
const YN = ['Yes', 'No'];

/** The one decision of the cluster: how it is recovered when a node or the state is lost. */
const RECOVERY_DECISION: DecisionBlock = {
  id: 'recovery',
  title: 'The recovery decision',
  subject: 'component',
  prompt: 'A control-plane node is lost. How does the team bring the cluster back?',
  options: [
    { id: 'restore', label: 'Restore from the etcd snapshot', help: 'Rebuilds the exact state at snapshot time; anything since the snapshot is lost.' },
    { id: 'rebuild', label: 'Rebuild and re-apply the manifests', help: 'A fresh cluster from the manifests in git; no snapshot needed, but cluster-only state is lost.' },
    { id: 'failover', label: 'Fail over to a second control-plane node', help: 'No downtime, but needs a multi-node control plane running already.' },
  ],
  questions: [
    { field: 'recovery_why', label: 'Why that, for this cluster', type: 'area', required: true, placeholder: 'Single-node kind cluster with all manifests in git: rebuild and re-apply is faster and simpler than a snapshot restore here.' },
    { field: 'recovery_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'Failover: there is no second control-plane node on a kind single-node cluster.' },
    { field: 'recovery_risk', label: 'The risk accepted', type: 'text', placeholder: 'Any state written directly to the cluster but not in git is lost on a rebuild; the etcd snapshot is the backstop.' },
  ],
};

const KUBERNETES_CKA_FORMS: DeliverableDef[] = [
  // 1 — Cluster Setup & Access Register ──────────────────────────────────────────
  {
    id: 'cka_setup',
    courseId: 'kubernetes-cka',
    num: 1,
    file: '01_Cluster_Setup_and_Access_Register.md',
    title: 'Cluster Setup & Access Register',
    owner: 'records',
    shared: true,
    folder: '00_Setup',
    standard: 'Tooling & cluster bootstrap · CKA domain 2 · CIS Kubernetes Benchmark 1 · NIST SP 800-53 CM-6',
    weeks: [0],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['cka_cluster'],
    purpose:
      'What the cluster runs on: the kubectl, kind and helm versions, the cluster name and context, and who leads which record. Written first, so a version mismatch is caught before any workload.',
    howTo:
      'Record the tool versions, that the cluster came up with a Ready node, the context name, the cluster name and the four focuses.',
    buildSteps: [
      'The kubectl, kind and helm versions.',
      'That the cluster node reports Ready.',
      'The context and cluster name.',
      'The folder path.',
      'Who leads which focus.',
    ],
    meaning: 'A good setup record lets anyone reproduce the cluster and proves the node was Ready before real work began.',
    useIt: 'The architecture record builds on it; the handover closes the cluster against it.',
    pitfalls: [
      'A kubectl client with no cluster — the context is wrong.',
      'No record of the kind and helm versions.',
      'A node that never reached Ready.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The tools and cluster',
        fields: [
          { field: 'kubectl', label: 'kubectl version', type: 'text', required: true, placeholder: 'v1.31.0' },
          { field: 'kind', label: 'kind version', type: 'text', required: true, placeholder: 'v0.24.0' },
          { field: 'helm', label: 'helm version', type: 'text', required: true, placeholder: 'v3.16.1' },
          { field: 'node_ready', label: 'The node reports Ready', type: 'select', required: true, options: YN },
          { field: 'context', label: 'kubectl context', type: 'text', required: true, placeholder: 'kind-cka' },
        ],
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'cluster', label: 'Cluster name', type: 'text', required: true, placeholder: 'cka-t1' },
          { field: 'folder', label: 'Folder path', type: 'text', required: true, placeholder: 'cka-t1/' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Control Plane: Sam · Workloads: Jo · Networking: Alex · Operations: Priya' },
        ],
      },
    ],
    dod: [
      { label: 'The three tools report versions', when: { fields: ['kubectl', 'kind', 'helm'] } },
      { label: 'The node reached Ready and the context is recorded', when: { all: [{ field: 'node_ready', equals: 'Yes' }, { fields: ['context'] }] } },
      { label: 'The team has a cluster name and four focuses', when: { fields: ['cluster', 'focus'] } },
    ],
  },

  // 2 — Cluster Architecture & Access Record ──────────────────────────────────────
  {
    id: 'cka_cluster',
    courseId: 'kubernetes-cka',
    num: 2,
    file: '02_Cluster_Architecture_and_Access_Record.md',
    title: 'Cluster Architecture & Access Record',
    owner: 'cluster',
    shared: true,
    folder: '01_Build',
    standard: 'Cluster architecture & RBAC · CKA domain 2 · CIS Kubernetes Benchmark 1,5 · NIST SP 800-53 AC-6',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['cka_workloads'],
    purpose:
      'How the cluster is built and who can do what: the control-plane components and their health, the node conditions, the namespace the team works in, and the RBAC that locks access down.',
    howTo:
      'Record each control-plane component and its state, the node conditions, the namespace, and the role, binding and the proof of both the grant and the denial.',
    buildSteps: [
      'The control-plane components and their state.',
      'The node conditions, all healthy.',
      'The team namespace.',
      'The role, the binding, and the proven grant and denial.',
    ],
    meaning: 'A cluster you can read component by component is a cluster you can diagnose; RBAC proved on both the grant and the denial is access you can trust.',
    useIt: 'The workloads record deploys into this namespace; the handover names the RBAC.',
    pitfalls: [
      'A component listed but never checked Running.',
      'An RBAC grant with the denial never tested.',
      'Working in the default namespace.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'components',
          label: 'The control plane',
          columns: [
            c('component', 'Component', 'text', { placeholder: 'kube-apiserver' }),
            c('state', 'State', 'select', { options: ['Running', 'Pending', 'Failed'] }),
          ],
          seed: [{ component: 'kube-apiserver', state: 'Running' }],
        },
      },
      {
        kind: 'fields',
        title: 'Nodes and namespace',
        fields: [
          { field: 'node_conditions', label: 'Node conditions (Ready / pressures)', type: 'text', required: true, placeholder: 'Ready True; Memory/Disk/PID Pressure False' },
          { field: 'namespace', label: 'Team namespace', type: 'text', required: true, placeholder: 'yard' },
        ],
      },
      {
        kind: 'fields',
        title: 'RBAC',
        fields: [
          { field: 'role', label: 'Role and what it grants', type: 'text', required: true, placeholder: 'pod-reader: get, list on pods' },
          { field: 'binding', label: 'Binding and subject', type: 'text', required: true, placeholder: 'reader-binding → serviceaccount yard:reader' },
          { field: 'grant_proved', label: 'The grant is proved (can-i → yes)', type: 'select', required: true, options: YN },
          { field: 'denial_proved', label: 'A denial is proved (can-i → no)', type: 'select', required: true, options: YN },
        ],
      },
    ],
    dod: [
      { label: 'Every control-plane component is recorded Running', when: { group: 'components', atLeast: 3, every: { column: 'state', equals: 'Running' } } },
      { label: 'The node is healthy and the team has a namespace', when: { fields: ['node_conditions', 'namespace'] } },
      { label: 'RBAC is proved on both the grant and the denial', when: { all: [{ field: 'grant_proved', equals: 'Yes' }, { field: 'denial_proved', equals: 'Yes' }] } },
    ],
  },

  // 3 — Workloads & Scheduling Record ─────────────────────────────────────────────
  {
    id: 'cka_workloads',
    courseId: 'kubernetes-cka',
    num: 3,
    file: '03_Workloads_and_Scheduling_Record.md',
    title: 'Workloads & Scheduling Record',
    owner: 'workloads',
    shared: true,
    folder: '02_Deploy',
    standard: 'Workloads & scheduling · CKA domain 4 · NIST SP 800-53 CP-10',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['cka_network'],
    purpose:
      'How the app runs and where: the Deployment and its probes, the resource requests and limits, the scaled replica count, and the taint and toleration that steer a pod to a chosen node.',
    howTo:
      'Record the Deployment, the probes, the requests and limits per pod, the scaled count, and the node a tolerated pod landed on.',
    buildSteps: [
      'The Deployment, its replicas and its probes.',
      'The CPU and memory requests and limits.',
      'The scaled replica count.',
      'The taint, the toleration and the node the pod landed on.',
    ],
    meaning: 'Probes make a rollout safe, requests and limits make scheduling fair, and taints and tolerations put the right pod on the right node.',
    useIt: 'The networking record exposes these workloads; the handover says how to scale them.',
    pitfalls: [
      'A Deployment with no readiness probe.',
      'Pods with no request, so the scheduler guesses.',
      'A toleration whose key does not match the taint.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The deployment',
        fields: [
          { field: 'replicas', label: 'Replicas running', type: 'text', required: true, placeholder: '4/4' },
          { field: 'liveness', label: 'Liveness probe', type: 'text', required: true, placeholder: 'httpGet /healthz :3000' },
          { field: 'readiness', label: 'Readiness probe', type: 'text', required: true, placeholder: 'httpGet /ready :3000' },
          { field: 'requests', label: 'Requests and limits per pod', type: 'text', required: true, placeholder: 'req 100m/64Mi, limit 200m/128Mi' },
        ],
      },
      {
        kind: 'fields',
        title: 'Scheduling',
        fields: [
          { field: 'scaled', label: 'Scaled replica count reached', type: 'text', required: true, placeholder: '4/4' },
          { field: 'taint', label: 'Taint applied', type: 'text', required: true, placeholder: 'tier=app:NoSchedule' },
          { field: 'landed_on', label: 'The tolerated pod landed on', type: 'text', required: true, placeholder: 'cka-control-plane' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Workload changes — each with a rollback',
          help: 'Every change to the running workload, and how to undo it.',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'kubectl set image deploy/app app=app:1.1.0' }),
            c('reason', 'Reason', 'text', { placeholder: 'Ship the new feature' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'kubectl rollout undo deploy/app' }),
          ],
          seed: [{ change: 'Initial apply', reason: 'Baseline', rollback: 'kubectl delete -f deploy.yaml' }],
        },
      },
    ],
    dod: [
      { label: 'The Deployment runs with liveness and readiness probes', when: { fields: ['replicas', 'liveness', 'readiness'] } },
      { label: 'Requests and limits are recorded', when: { fields: ['requests'] } },
      { label: 'A taint and toleration steered a pod to a chosen node', when: { fields: ['taint', 'landed_on'] } },
      { label: 'Every workload change has a rollback', when: { group: 'changes', atLeast: 1, every: { filled: ['change', 'rollback'] } } },
    ],
  },

  // 4 — Services, Networking & Storage Record ─────────────────────────────────────
  {
    id: 'cka_network',
    courseId: 'kubernetes-cka',
    num: 4,
    file: '04_Services_Networking_and_Storage_Record.md',
    title: 'Services, Networking & Storage Record',
    owner: 'net',
    shared: true,
    folder: '03_Connect',
    standard: 'Services, networking & storage · CKA domains 3,5 · CIS Kubernetes Benchmark 5 · NIST SP 800-53 SC-7',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['cka_backup'],
    purpose:
      'How the app is reached and how its data is kept: the Service and its DNS, the Ingress route, the default-deny NetworkPolicy and its one allow rule, and the PersistentVolumeClaim the data survives on.',
    howTo:
      'Record the Service and its cluster DNS, the Ingress host, the NetworkPolicy deny and allow proofs, and the claim that kept data across a pod recreate.',
    buildSteps: [
      'The Service, its type and cluster DNS name.',
      'The Ingress host and route.',
      'The default-deny policy, and the one allow proved both ways.',
      'The PersistentVolumeClaim, Bound, data surviving a recreate.',
    ],
    meaning: 'A Service is a stable name over moving pods, a NetworkPolicy is default-deny made real, and a claim is where data outlives any one pod.',
    useIt: 'The troubleshooting log works a fault in this network; the handover lists the volumes to back up.',
    pitfalls: [
      'A Service with no endpoints because the selector is wrong.',
      'A NetworkPolicy that blocks nothing (no enforcing CNI).',
      'Data in the pod, lost on the first recreate.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Services and ingress',
        fields: [
          { field: 'service', label: 'Service name and type', type: 'text', required: true, placeholder: 'app (ClusterIP)' },
          { field: 'dns', label: 'Resolves by DNS name', type: 'text', required: true, placeholder: 'app.yard.svc.cluster.local' },
          { field: 'ingress', label: 'Ingress host → service', type: 'text', required: true, placeholder: 'app.local → app:80' },
          { field: 'pod_cidr', label: 'Pod/Service network CIDR', type: 'text', required: true, placeholder: '10.244.0.0/16' },
        ],
      },
      {
        kind: 'fields',
        title: 'NetworkPolicy and storage',
        fields: [
          { field: 'deny_proved', label: 'Default-deny proved (disallowed pod blocked)', type: 'select', required: true, options: YN },
          { field: 'allow_proved', label: 'Allow rule proved (allowed pod through)', type: 'select', required: true, options: YN },
          { field: 'pvc', label: 'PersistentVolumeClaim', type: 'text', required: true, placeholder: 'data (Bound)' },
          { field: 'survived', label: 'Data survived a pod recreate', type: 'select', required: true, options: YN },
        ],
      },
    ],
    dod: [
      { label: 'The Service resolves by name and an Ingress routes to it', when: { fields: ['service', 'dns', 'ingress'] } },
      { label: 'The NetworkPolicy is proved on both the deny and the allow', when: { all: [{ field: 'deny_proved', equals: 'Yes' }, { field: 'allow_proved', equals: 'Yes' }] } },
      { label: 'Data survives a recreate on a bound claim', when: { all: [{ fields: ['pvc'] }, { field: 'survived', equals: 'Yes' }] } },
    ],
  },

  // 5 — Cluster Troubleshooting Log ───────────────────────────────────────────────
  {
    id: 'cka_troubleshoot',
    courseId: 'kubernetes-cka',
    num: 5,
    file: '05_Cluster_Troubleshooting_Log.md',
    title: 'Cluster Troubleshooting Log',
    owner: 'records',
    shared: true,
    folder: '04_Handover',
    standard: 'Fault diagnosis · read before you change · one change per row · NIST SP 800-53 IR-4',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['cka_backup'],
    purpose:
      'A broken pod worked the method way: read it first, the symptom and the event before any theory, one theory and one change per row, the failed theories kept, and the fix proved by the pod reaching Running.',
    howTo:
      'Describe the pod and read its events before any theory. Change one thing per row and record the result. Keep the rows that did not work. End with the pod Running and Ready.',
    buildSteps: [
      'The pod status and the event that explains it.',
      'One theory per row, one change, the result.',
      'At least one theory that was wrong, kept.',
      'The proof: the pod Running and Ready.',
    ],
    meaning: 'A log with no failed theories is a log nobody believes. The failures are the proof the team read the cluster and worked the fault, not guessed.',
    useIt: 'The fix feeds the backup and handover; the method carries to every fault after it.',
    pitfalls: [
      'Writing "the pod is broken" instead of the exact status and event.',
      'Changing three things at once.',
      'Deleting the theories that failed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The fault',
        fields: [
          { field: 'status', label: 'The exact pod status', type: 'text', required: true, placeholder: 'broken 0/1 ImagePullBackOff' },
          { field: 'event', label: 'The event that explains it', type: 'area', required: true, placeholder: 'Failed to pull image "app:typo": not found' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'attempts',
          label: 'The attempts — one change per row',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'The image tag is wrong' }),
            c('change', 'The one change', 'text', { placeholder: 'Set image to app:1.0.0' }),
            c('result', 'Result', 'select', { options: ['Fixed it', 'No change — theory wrong', 'Partly — new symptom'] }),
          ],
          seed: [{ theory: 'Wrong image tag', change: 'image app:1.0.0', result: 'Fixed it' }],
        },
      },
      {
        kind: 'fields',
        title: 'The proof',
        fields: [{ field: 'proof', label: 'The pod Running and Ready', type: 'text', required: true, placeholder: 'app-xxxx 1/1 Running' }],
      },
    ],
    dod: [
      { label: 'The exact status and the event are written', when: { fields: ['status', 'event'] } },
      { label: 'Every attempt is a row, and at least one theory was wrong', when: { group: 'attempts', atLeast: 2, some: { column: 'result', equals: 'No change — theory wrong' } } },
      { label: 'The fix is proved with the pod Running and Ready', when: { fields: ['proof'] } },
    ],
  },

  // 6 — Backup & Recovery Record ← the decision ───────────────────────────────────
  {
    id: 'cka_backup',
    courseId: 'kubernetes-cka',
    num: 6,
    file: '06_Backup_and_Recovery_Record.md',
    title: 'Backup & Recovery Record',
    owner: 'cluster',
    shared: true,
    folder: '04_Handover',
    standard: 'Backup & disaster recovery · CKA domain 2 · CIS Kubernetes Benchmark 2 · NIST SP 800-53 CP-9,CP-10',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['cka_handover'],
    purpose:
      'How the cluster is backed up and brought back: the etcd snapshot and its verified status, the restore procedure, and the recovery decision for when a node or the state is lost.',
    howTo:
      'Record the snapshot, its verified key count and size, the restore steps, and the recovery decision with its rejected option.',
    buildSteps: [
      'The etcd snapshot and its verified status.',
      'The restore procedure, step by step.',
      'The recovery decision.',
    ],
    meaning: 'etcd holds the whole cluster state; a verified snapshot is the one backup that rebuilds a cluster from nothing. The recovery decision is how the team uses it under pressure.',
    useIt: 'The handover names the backup and the recovery path; the decision governs the drill.',
    pitfalls: [
      'A snapshot taken but never verified.',
      'A restore procedure never written down.',
      'A recovery decision with no rejected option.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The backup',
        fields: [
          { field: 'snapshot', label: 'Snapshot taken (path)', type: 'text', required: true, placeholder: '/tmp/snap.db' },
          { field: 'verified', label: 'Snapshot status verified', type: 'select', required: true, options: YN },
          { field: 'keys', label: 'Total keys / size', type: 'text', required: true, placeholder: '1204 keys, 4.1 MB' },
          { field: 'restore', label: 'Restore procedure', type: 'area', required: true, placeholder: 'etcdctl snapshot restore; point the apiserver at the new data dir; restart the control plane.' },
        ],
      },
      { kind: 'decision', block: RECOVERY_DECISION },
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date', type: 'date', required: true },
          { field: 'signoff', label: 'Reviewed by (Control Plane focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'A verified snapshot and a restore procedure are recorded', when: { all: [{ fields: ['snapshot'] }, { field: 'verified', equals: 'Yes' }, { fields: ['restore'] }] } },
      decisionDod(RECOVERY_DECISION),
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },

  // 7 — Handover & As-Built ← capstone ────────────────────────────────────────────
  {
    id: 'cka_handover',
    courseId: 'kubernetes-cka',
    num: 7,
    file: '07_Handover_and_As_Built.md',
    title: 'Handover & As-Built',
    owner: 'records',
    shared: true,
    capstone: true,
    folder: '04_Handover',
    standard: 'Operational handover & chain of custody · NIST SP 800-53 PL-2 · CM-8',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The cluster as it really is, handed to whoever runs it next: the workloads, the Services and Ingress, the volumes, the RBAC, how to operate and recover it, the known limits, and a custody row with a hash for every artifact.',
    howTo:
      'Describe the cluster by reference to the other records. Say how to operate and recover it. List the known limits. Hash every artifact into the custody log.',
    buildSteps: [
      'The cluster now: the workloads, Services, Ingress, volumes and RBAC.',
      'How to operate and recover it.',
      'Known limits: what it cannot do and what to watch.',
      'The custody log: every manifest, snapshot and output, hashed.',
    ],
    meaning: 'The as-built is the document the next team reads before touching the cluster. Written honestly, it saves them the month you just spent.',
    useIt: 'It is the capstone: reviewed by the Workloads focus, approved by the Operations focus, and issued with the cluster.',
    pitfalls: [
      'Describing the plan rather than the cluster as built.',
      'A kubeconfig or a token in the document.',
      'No recovery steps.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The cluster now',
        fields: [
          { field: 'cluster', label: 'Cluster name and workloads', type: 'text', required: true, placeholder: 'cka-t1 · app Deployment (4 replicas), db' },
          { field: 'exposure', label: 'Services, Ingress and volumes', type: 'area', required: true, placeholder: 'Service app (ClusterIP); Ingress app.local; PVC data (Bound); NetworkPolicy default-deny' },
          { field: 'operate', label: 'How to operate and recover', type: 'area', required: true, placeholder: 'kubectl apply -f manifests/; scale deploy/app; restore from /tmp/snap.db per the backup record.' },
        ],
      },
      {
        kind: 'fields',
        title: 'Known limits',
        fields: [{ field: 'limits', label: 'What it cannot do, and what to watch', type: 'area', required: true, placeholder: 'Single-node kind cluster — no real HA; NetworkPolicy enforced only with a CNI that supports it; back up etcd before any host rebuild.' }],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-2/deploy.yaml', description: 'The app Deployment manifest', collected_by: 'Workloads', datetime: '2026-10-26 10:10', location: 'cka-t1/week-2/', sha256: '5c4b…', transferred_to: 'Records', transferred_at: '2026-10-26 10:30', notes: 'for the workloads record' },
        ],
      }),
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date issued', type: 'date', required: true },
          { field: 'signoff', label: 'Issued by (Operations focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The cluster is described as built, with how to operate it', when: { fields: ['cluster', 'exposure', 'operate'] } },
      { label: 'The known limits and recovery are recorded', when: { fields: ['limits'] } },
      { label: 'Every artifact is hashed into the custody log', when: everyEvidenceHashed('evidence') },
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const KUBERNETES_CKA_DELIVERABLES: DeliverableDef[] = KUBERNETES_CKA_FORMS;
