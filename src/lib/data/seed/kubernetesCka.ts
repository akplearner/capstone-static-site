import type { Course, RoleDef, Step, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';
import { withAiExtensions } from '../../docs/aiExtension';
import { withModules } from '../modules';

/**
 * Certified Kubernetes Administrator — the Cluster Yard (CKA).
 *
 * A four-person team stands up and operates one small Kubernetes cluster the way
 * a platform team would: bootstrap it with `kind` on a laptop, read its control
 * plane and nodes, lock access down with RBAC, deploy and schedule workloads
 * with probes and resource limits, expose them with Services and an Ingress,
 * fence them with a NetworkPolicy, persist data on a PersistentVolume, back up
 * etcd, work a broken pod the method way, and hand it over with custody.
 *
 * EVERYTHING RUNS ON A LAPTOP. `kind` (Kubernetes-in-Docker), `kubectl` and
 * `helm` are free; the cluster is a local multi-node kind cluster. Every proof
 * step runs a real command and pastes the output back; nothing is a slide.
 *
 * THE RULE THE COURSE TEACHES: read the cluster before you change it. Every fix
 * starts with `kubectl describe` and the events, and the Week 4 broken pod is
 * worked one theory and one change per row, exactly as A+ works a dead PC.
 *
 * ONE SHARED CLUSTER, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`).
 * Everyone runs every command on the team's cluster; the focus decides which
 * record a member leads and reviews. Week 0 is preparation (`setup: true`),
 * never graded.
 */

const ROLES: RoleDef[] = [
  {
    id: 'cluster',
    name: 'Control Plane (Cluster Lead)',
    mission: 'Leads the cluster record: the control plane, the nodes, RBAC and the etcd backup.',
    color: '#2563eb',
    icon: 'Server',
  },
  {
    id: 'workloads',
    name: 'Workloads (Scheduling Lead)',
    mission: 'Leads the workload record: Deployments, probes, resources and scheduling.',
    color: '#15803d',
    icon: 'Boxes',
  },
  {
    id: 'net',
    name: 'Networking & Storage (Platform Lead)',
    mission: 'Leads the network and storage record: Services, Ingress, NetworkPolicy and volumes.',
    color: '#b45309',
    icon: 'Network',
  },
  {
    id: 'records',
    name: 'Operations (Records Lead)',
    mission: 'Leads the records that outlive the cluster: troubleshooting, the runbook, custody and handover.',
    color: '#7c3aed',
    icon: 'ClipboardList',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Set up the cluster',
    theme: 'kind, kubectl and helm, proven',
    objective: 'Install kubectl, kind and helm, bring up a local cluster, pick your focus and make the cluster folder.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'install-the-tools', label: 'Install kubectl, kind and helm', tasks: ['cka-w0-install'] },
      { id: 'bring-up-a-cluster', label: 'Bring up a local cluster', tasks: ['cka-w0-cluster'] },
      { id: 'know-the-team', label: 'Know your team, focus and folder', tasks: ['cka-w0-orient'] },
    ],
    milestone: 'kubectl, kind and helm report their versions, a local kind cluster answers kubectl get nodes with Ready, and the cluster folder names the team and the four focuses.',
  },
  {
    number: 1,
    title: 'Read and lock the cluster',
    theme: 'Control plane, nodes, RBAC',
    objective: 'Read the control plane and the nodes, create a namespace, and lock access down with a role and a binding.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Build',
    difficulty: 2,
    objectives: [
      { id: 'read-the-control-plane', label: 'Read the control plane and nodes', tasks: ['cka-w1-cluster'] },
      { id: 'namespace-the-work', label: 'Create and use a namespace', tasks: ['cka-w1-components'] },
      { id: 'lock-access-with-rbac', label: 'Lock access down with RBAC', tasks: ['cka-w1-rbac'] },
    ],
    milestone: 'Every control-plane component and node reports healthy, the team works in its own namespace, and a role gives one service account exactly the access it needs and no more.',
  },
  {
    number: 2,
    title: 'Deploy and schedule',
    theme: 'Deployments, probes, resources, scheduling',
    objective: 'Deploy the app, give it probes and resource limits, scale it, and steer where its pods are scheduled.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Deploy',
    difficulty: 3,
    objectives: [
      { id: 'deploy-the-app', label: 'Deploy the app with probes', tasks: ['cka-w2-deploy'] },
      { id: 'set-resources', label: 'Set requests, limits and scale', tasks: ['cka-w2-resources'] },
      { id: 'steer-scheduling', label: 'Steer where pods schedule', tasks: ['cka-w2-schedule'] },
    ],
    milestone: 'The Deployment runs its replicas behind liveness and readiness probes, each pod has a request and a limit, it scales on command, and a taint and a toleration put a pod on the node you chose.',
  },
  {
    number: 3,
    title: 'Expose and persist',
    theme: 'Services, Ingress, NetworkPolicy, volumes',
    objective: 'Expose the app with a Service and an Ingress, fence it with a NetworkPolicy, and persist data on a volume.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Connect',
    difficulty: 3,
    objectives: [
      { id: 'expose-the-app', label: 'Expose it with a Service and Ingress', tasks: ['cka-w3-services'] },
      { id: 'fence-with-networkpolicy', label: 'Fence it with a NetworkPolicy', tasks: ['cka-w3-networkpolicy'] },
      { id: 'persist-on-a-volume', label: 'Persist data on a volume', tasks: ['cka-w3-storage'] },
    ],
    milestone: 'The app answers through a Service and an Ingress by name, a default-deny NetworkPolicy lets only the allowed pod reach it, and a PersistentVolumeClaim keeps the data across a pod recreate.',
  },
  {
    number: 4,
    title: 'Recover and hand over',
    theme: 'Troubleshoot, back up etcd, hand over',
    objective: 'Work a broken pod the method way, back up and restore etcd, and hand the cluster over with custody.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Hand over',
    difficulty: 4,
    objectives: [
      { id: 'work-a-broken-pod', label: 'Work a broken pod, one change per row', tasks: ['cka-w4-troubleshoot'] },
      { id: 'back-up-etcd', label: 'Back up and restore the cluster state', tasks: ['cka-w4-backup'] },
      { id: 'hand-it-over', label: 'Hand the cluster over', tasks: ['cka-w4-handover'] },
    ],
    milestone: 'A broken pod is fixed with the failed theories kept, an etcd snapshot is taken and proved restorable, and the handover record hashes every artifact.',
  },
];

/** A form or desk step: no command, a described outcome. `whatItMeans` required. */
const note = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  outcome: string,
  extra: Partial<Step> & { whatItMeans: string }
): Step => ({
  id,
  title,
  description: outcome.length > 110 ? `${outcome.slice(0, 107).trimEnd()}…` : outcome,
  where,
  instruction,
  expectedOutput: outcome,
  outputKind: 'result',
  frameworks: ['CIS'],
  ...extra,
});

/** A command step with pasted output and what proves it worked. */
const run = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  commands: NonNullable<Step['commands']>,
  verify: string[],
  whatItMeans: string,
  extra: Partial<Step> = {}
): Step => ({
  id,
  title,
  description: title,
  where,
  instruction,
  commands,
  verify,
  outputKind: 'console',
  expectedOutput: commands.map((cmd) => cmd.sample).filter(Boolean).join('\n'),
  whatItMeans,
  frameworks: ['CIS'],
  ...extra,
});

const LAB = 'Your own machine — a terminal';

const TASKS: Task[] = [
  // ── Week 0 — Set up the cluster ─────────────────────────────────────────────
  {
    id: 'cka-w0-install',
    role: 'cluster',
    shared: true,
    week: 0,
    title: 'Install kubectl, kind and helm',
    objective: 'Install the three tools the course runs on and confirm each reports its version.',
    frameworks: ['CIS'],
    deliverables: ['01_Cluster_Setup_and_Access_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['kubectl', 'kind', 'helm', 'Client vs cluster'],
    tools: ['kubectl', 'kind', 'Helm'],
    definitionOfDone: [
      'kubectl, kind and helm each report a version',
      'Docker is running (kind needs it)',
      'The versions are recorded in the register',
    ],
    steps: [
      run(
        'cka-w0-install-s1',
        'Install the tools and read their versions',
        LAB,
        'Install kubectl, kind and helm from their official docs, then confirm all three are on the path.',
        [
          { cmd: 'kubectl version --client -o yaml | grep gitVersion; kind version; helm version --short', explain: 'Prints the kubectl client version, the kind version and the helm version.', sample: '  gitVersion: v1.31.0\nkind v0.24.0 go1.22.5 linux/amd64\nv3.16.1+g5a5449d' },
        ],
        ['kind v'],
        'kind runs a whole cluster in Docker containers, kubectl talks to it, and helm installs packaged apps onto it. All three on the path is the start line.',
        {
          usesForm: 'Cluster Setup & Access Register',
          producesDeliverable: '01_Cluster_Setup_and_Access_Register.md',
          outputHighlights: [{ text: 'kind v', label: 'kind is installed and ready to make a cluster.' }],
          fixes: [
            { symptom: 'kind says it cannot reach Docker?', fix: 'Start Docker (or Docker Desktop); kind builds its nodes as Docker containers, so the daemon must be running.' },
            { symptom: 'kubectl is not found?', fix: 'Install it from the official Kubernetes docs for your operating system, then open a new terminal.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'cka-w0-cluster',
    role: 'workloads',
    shared: true,
    week: 0,
    title: 'Bring up a local cluster',
    objective: 'Create a kind cluster and confirm its node is Ready, so the cluster is proven before any real work.',
    frameworks: ['CIS'],
    deliverables: ['01_Cluster_Setup_and_Access_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['kind create cluster', 'Nodes', 'kubeconfig context'],
    tools: ['kubectl', 'kind'],
    definitionOfDone: [
      'A kind cluster is created',
      'kubectl get nodes shows the node Ready',
      'The context is recorded',
    ],
    steps: [
      run(
        'cka-w0-cluster-s1',
        'Create the cluster and read its nodes',
        LAB,
        'Create a kind cluster named cka, then list its nodes and confirm they report Ready.',
        [
          { cmd: 'kind create cluster --name cka && kubectl get nodes', explain: 'Builds a single-node cluster and lists it; STATUS must read Ready.', sample: 'NAME                STATUS   ROLES           AGE   VERSION\ncka-control-plane   Ready    control-plane   40s   v1.31.0' },
        ],
        ['Ready'],
        'A node that reports Ready means the kubelet, the container runtime and the control plane are all talking. Everything else runs on top of this.',
        {
          usesForm: 'Cluster Setup & Access Register',
          outputHighlights: [{ text: 'Ready', label: 'The node has joined and is schedulable.' }],
          fixes: [{ symptom: 'The node stays NotReady?', fix: 'Give Docker more memory (kind needs a couple of GB) and recreate the cluster.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w0-orient',
    role: 'records',
    shared: true,
    week: 0,
    title: 'Know your team, your focus and the folder',
    objective: 'Agree who leads which record, name the cluster, and make the folder every artifact goes in.',
    frameworks: ['CIS'],
    deliverables: ['01_Cluster_Setup_and_Access_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'Naming', 'Evidence folders'],
    tools: ['kubectl'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'The cluster has a name in the pattern cka-t<team>',
      'The folder exists with a week-0 to week-4 layout',
    ],
    steps: [
      note(
        'cka-w0-orient-s1',
        'Pick the focus and name the cluster',
        'Anywhere — a team decision',
        'Agree who leads Control Plane, Workloads, Networking & Storage and Operations. Name the cluster cka-t and your team number, and write both into the register.',
        'Four names against four focuses, and a cluster name the whole team uses from now on.',
        {
          usesForm: 'Cluster Setup & Access Register',
          whatItMeans: 'A focus is the record a member leads and reviews, not the only work they do. Everyone runs every command.',
        }
      ),
      run(
        'cka-w0-orient-s2',
        'Make the cluster folder',
        LAB,
        'Create the folder with a subfolder for each week. Every manifest, yaml and output goes under the week it belongs to.',
        [
          { cmd: 'mkdir -p cka-t1/week-{0,1,2,3,4} && ls cka-t1', explain: 'Five week folders in one command, then reads them back. Replace t1 with your team number.', sample: 'week-0  week-1  week-2  week-3  week-4' },
        ],
        ['week-0', 'week-4'],
        'An artifact nobody can find is an artifact nobody can hash. The folder is the first custody control.',
        {
          usesForm: 'Cluster Setup & Access Register',
          producesDeliverable: '01_Cluster_Setup_and_Access_Register.md',
        }
      ),
    ],
  },

  // ── Week 1 — Read and lock the cluster (d2 cluster architecture) ─────────────
  {
    id: 'cka-w1-cluster',
    role: 'cluster',
    shared: true,
    week: 1,
    title: 'Read the control plane and nodes',
    objective: 'Read every control-plane component and node, and confirm the cluster is healthy before building on it.',
    frameworks: ['CIS'],
    deliverables: ['02_Cluster_Architecture_and_Access_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Control plane', 'kube-apiserver', 'etcd', 'Component health'],
    tools: ['kubectl'],
    definitionOfDone: [
      'Every control-plane pod is Running',
      'The node and its kubelet report healthy',
      'The component list is recorded',
    ],
    steps: [
      run(
        'cka-w1-cluster-s1',
        'Read the control-plane components',
        LAB,
        'List the pods in the kube-system namespace and confirm the API server, scheduler, controller manager and etcd are all Running.',
        [
          { cmd: 'kubectl get pods -n kube-system -o wide | grep -E "apiserver|scheduler|controller|etcd"', explain: 'Lists the control-plane pods; each must read Running.', sample: 'etcd-cka-control-plane                      1/1   Running   0   5m\nkube-apiserver-cka-control-plane            1/1   Running   0   5m\nkube-controller-manager-cka-control-plane   1/1   Running   0   5m\nkube-scheduler-cka-control-plane            1/1   Running   0   5m' },
        ],
        ['Running'],
        'The control plane is the API server, the scheduler, the controller manager and etcd. If you can name and read each, you can diagnose a cluster that will not schedule.',
        {
          usesForm: 'Cluster Architecture & Access Record',
          outputHighlights: [{ text: 'Running', label: 'Each control-plane component is up.' }],
        }
      ),
      run(
        'cka-w1-cluster-s2',
        'Read the node health',
        LAB,
        'Describe the node and read the conditions; MemoryPressure, DiskPressure and PIDPressure must be False and Ready True.',
        [
          { cmd: 'kubectl describe node cka-control-plane | grep -A6 Conditions | grep -E "Ready|Pressure"', explain: 'Prints the node conditions; the healthy state is Ready True, every Pressure False.', sample: '  MemoryPressure   False\n  DiskPressure     False\n  PIDPressure      False\n  Ready            True' },
        ],
        ['Ready'],
        'A node tells you why it will not take pods through its conditions. Reading them first is the difference between a guess and a diagnosis.',
        {
          usesForm: 'Cluster Architecture & Access Record',
          producesDeliverable: '02_Cluster_Architecture_and_Access_Record.md',
        }
      ),
    ],
  },
  {
    id: 'cka-w1-components',
    role: 'cluster',
    shared: true,
    week: 1,
    title: 'Create and use a namespace',
    objective: 'Create a namespace for the team and set it as the default for the context so work is isolated.',
    frameworks: ['CIS'],
    deliverables: ['02_Cluster_Architecture_and_Access_Record.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['Namespaces', 'Context', 'Resource isolation'],
    tools: ['kubectl'],
    definitionOfDone: [
      'A namespace exists for the team',
      'The context defaults to it',
      'The namespace is recorded',
    ],
    steps: [
      run(
        'cka-w1-components-s1',
        'Create the namespace and make it the default',
        LAB,
        'Create a namespace, set it as the default for the current context, and confirm the switch.',
        [
          { cmd: 'kubectl create namespace yard && kubectl config set-context --current --namespace=yard && kubectl config view --minify -o jsonpath="{..namespace}"', explain: 'Creates the namespace, defaults the context to it, and prints the active namespace.', sample: 'namespace/yard created\nContext "kind-cka" modified.\nyard' },
        ],
        ['yard'],
        'A namespace is how one cluster safely holds many teams or apps. Defaulting the context to it means you stop typing -n on every command.',
        {
          usesForm: 'Cluster Architecture & Access Record',
          producesDeliverable: '02_Cluster_Architecture_and_Access_Record.md',
          outputHighlights: [{ text: 'yard', label: 'The context now defaults to the team namespace.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w1-rbac',
    role: 'records',
    shared: true,
    week: 1,
    title: 'Lock access down with RBAC',
    objective: 'Create a service account, a role and a binding that give exactly the access needed, and prove the limit.',
    frameworks: ['CIS'],
    deliverables: ['02_Cluster_Architecture_and_Access_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['RBAC', 'Roles and RoleBindings', 'Service accounts', 'Least privilege'],
    tools: ['kubectl'],
    definitionOfDone: [
      'A service account, role and binding exist',
      'The account can do what the role allows',
      'The account is denied what the role does not allow',
    ],
    steps: [
      run(
        'cka-w1-rbac-s1',
        'Grant exactly the access the role allows',
        LAB,
        'Create a service account and a role that can read pods, bind them, and confirm the account can list pods.',
        [
          { cmd: 'kubectl create serviceaccount reader; kubectl create role pod-reader --verb=get,list --resource=pods; kubectl create rolebinding reader-binding --role=pod-reader --serviceaccount=yard:reader; kubectl auth can-i list pods --as=system:serviceaccount:yard:reader', explain: 'Creates the account, a read-only role and the binding, then checks the granted permission.', sample: 'serviceaccount/reader created\nrole.rbac.authorization.k8s.io/pod-reader created\nrolebinding.rbac.authorization.k8s.io/reader-binding created\nyes' },
        ],
        ['yes'],
        'RBAC is how a cluster says who can do what. A role that grants only get and list on pods is least privilege made concrete.',
        {
          usesForm: 'Cluster Architecture & Access Record',
          outputHighlights: [{ text: 'yes', label: 'The account has exactly the access the role grants.' }],
        }
      ),
      run(
        'cka-w1-rbac-s2',
        'Prove the limit: denied what the role forbids',
        LAB,
        'Check that the same account cannot delete pods or read secrets, proving the role is a real boundary.',
        [
          { cmd: 'kubectl auth can-i delete pods --as=system:serviceaccount:yard:reader; kubectl auth can-i get secrets --as=system:serviceaccount:yard:reader', explain: 'Checks two permissions the role does not grant; both must read no.', sample: 'no\nno' },
        ],
        ['no'],
        'A permission model you have not tested the limit of is a hope. Proving the denial is what proves the role is a boundary, not a suggestion.',
        {
          usesForm: 'Cluster Architecture & Access Record',
          producesDeliverable: '02_Cluster_Architecture_and_Access_Record.md',
          fixes: [{ symptom: 'can-i returns yes for a forbidden verb?', fix: 'A broader ClusterRoleBinding (often cluster-admin) is also bound to the account. Narrow or remove it; the most specific grant still adds up.' }],
        }
      ),
    ],
  },

  // ── Week 2 — Deploy and schedule (d4 workloads and scheduling) ───────────────
  {
    id: 'cka-w2-deploy',
    role: 'workloads',
    shared: true,
    week: 2,
    title: 'Deploy the app with probes',
    objective: 'Deploy the app as a Deployment with liveness and readiness probes, and confirm the pods become Ready.',
    frameworks: ['CIS'],
    deliverables: ['03_Workloads_and_Scheduling_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Deployments', 'ReplicaSets', 'Liveness probe', 'Readiness probe'],
    tools: ['kubectl'],
    definitionOfDone: [
      'A Deployment runs its replicas',
      'Liveness and readiness probes are set',
      'All pods report Ready',
    ],
    steps: [
      run(
        'cka-w2-deploy-s1',
        'Deploy and confirm the pods are Ready',
        LAB,
        'Apply a Deployment with probes, then roll out and confirm every replica is Ready.',
        [
          { cmd: 'kubectl apply -f week-2/deploy.yaml && kubectl rollout status deploy/app && kubectl get pods -l app=app', explain: 'Applies the Deployment, waits for the rollout, and lists the ready pods.', sample: 'deployment.apps/app created\ndeployment "app" successfully rolled out\nNAME                   READY   STATUS    RESTARTS   AGE\napp-7c9f8b6d5-2k4qp    1/1     Running   0          20s\napp-7c9f8b6d5-9xr2t    1/1     Running   0          20s' },
        ],
        ['successfully rolled out'],
        'A readiness probe is what keeps traffic off a pod until it can actually serve; a liveness probe restarts one that has hung. Together they are what makes a rollout safe.',
        {
          usesForm: 'Workloads & Scheduling Record',
          producesDeliverable: '03_Workloads_and_Scheduling_Record.md',
          outputHighlights: [{ text: 'successfully rolled out', label: 'Every replica came up Ready behind its probes.' }],
          fixes: [{ symptom: 'The rollout hangs?', fix: 'Run `kubectl describe pod -l app=app` and read the events; a failing readiness probe or an unpullable image is the usual cause.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w2-resources',
    role: 'workloads',
    shared: true,
    week: 2,
    title: 'Set requests, limits and scale',
    objective: 'Give each pod a resource request and limit, then scale the Deployment and confirm the new count.',
    frameworks: ['CIS'],
    deliverables: ['03_Workloads_and_Scheduling_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Resource requests', 'Resource limits', 'Scaling', 'QoS classes'],
    tools: ['kubectl'],
    prerequisites: ['The Deployment from the deploy task'],
    definitionOfDone: [
      'Each pod has a CPU and memory request and limit',
      'The Deployment scales to more replicas',
      'The requests and limits are recorded',
    ],
    steps: [
      run(
        'cka-w2-resources-s1',
        'Read the requests and limits, then scale',
        LAB,
        'Read the resource requests and limits off the running pods, then scale the Deployment to four and confirm.',
        [
          { cmd: 'kubectl get deploy app -o jsonpath="{..resources}{\'\\n\'}" && kubectl scale deploy/app --replicas=4 && kubectl get deploy app', explain: 'Prints the resources block, scales the Deployment, and reads the new replica count.', sample: '{"limits":{"cpu":"200m","memory":"128Mi"},"requests":{"cpu":"100m","memory":"64Mi"}}\ndeployment.apps/app scaled\nNAME   READY   UP-TO-DATE   AVAILABLE   AGE\napp    4/4     4            4           3m' },
        ],
        ['4/4'],
        'A request is what the scheduler reserves; a limit is the ceiling the kubelet enforces. Without them one pod can starve a node, and scaling is a guess.',
        {
          usesForm: 'Workloads & Scheduling Record',
          producesDeliverable: '03_Workloads_and_Scheduling_Record.md',
          outputHighlights: [{ text: '4/4', label: 'All four replicas are available.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w2-schedule',
    role: 'net',
    shared: true,
    week: 2,
    title: 'Steer where pods schedule',
    objective: 'Taint a node and add a matching toleration so a pod lands where you chose, and prove the placement.',
    frameworks: ['CIS'],
    deliverables: ['03_Workloads_and_Scheduling_Record.md'],
    estimatedTime: '1 h',
    difficulty: 4,
    learn: ['Taints and tolerations', 'Node selectors', 'Affinity', 'Scheduling'],
    tools: ['kubectl'],
    definitionOfDone: [
      'A node carries a taint',
      'A pod with the matching toleration is scheduled there',
      'The placement is proved by the node the pod runs on',
    ],
    steps: [
      run(
        'cka-w2-schedule-s1',
        'Taint a node and tolerate it',
        LAB,
        'Taint the node, apply a pod with the matching toleration, and confirm which node the pod landed on.',
        [
          { cmd: 'kubectl taint nodes cka-control-plane tier=app:NoSchedule --overwrite; kubectl apply -f week-2/tolerated-pod.yaml; kubectl get pod tolerated -o wide --no-headers | awk "{print \\$7}"', explain: 'Taints the node, schedules a tolerating pod, and prints the node it ran on.', sample: 'cka-control-plane' },
        ],
        ['cka-control-plane'],
        'A taint repels every pod that does not tolerate it; a toleration is the one key that fits. It is how you keep a node for the workload it is meant for.',
        {
          usesForm: 'Workloads & Scheduling Record',
          outputHighlights: [{ text: 'cka-control-plane', label: 'The pod landed on the node you steered it to.' }],
          fixes: [{ symptom: 'The pod stays Pending?', fix: 'Run `kubectl describe pod tolerated` — the events name the taint it does not tolerate; the toleration key, value and effect must all match.' }],
        }
      ),
    ],
  },

  // ── Week 3 — Expose and persist (d3 services/networking, d5 storage) ─────────
  {
    id: 'cka-w3-services',
    role: 'net',
    shared: true,
    week: 3,
    title: 'Expose it with a Service and Ingress',
    objective: 'Put a Service in front of the pods and an Ingress in front of the Service, and reach the app by name.',
    frameworks: ['CIS'],
    deliverables: ['04_Services_Networking_and_Storage_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Services', 'ClusterIP', 'Ingress', 'Service DNS'],
    tools: ['kubectl', 'Helm'],
    definitionOfDone: [
      'A Service selects the app pods',
      'The Service resolves by name inside the cluster',
      'An Ingress routes to the Service',
    ],
    steps: [
      run(
        'cka-w3-services-s1',
        'Create the Service and resolve it by name',
        LAB,
        'Expose the Deployment as a Service, then from a throwaway pod resolve the Service by its DNS name.',
        [
          { cmd: 'kubectl expose deploy app --port=80 --target-port=3000 && kubectl run probe --image=busybox:1.36 --restart=Never --rm -it --command -- nslookup app.yard.svc.cluster.local | grep Address | tail -1', explain: 'Creates the Service and resolves its cluster DNS name from another pod.', sample: 'Address: 10.96.142.57' },
        ],
        ['Address'],
        'A Service is a stable name and address in front of pods that come and go. Inside the cluster everything talks to the Service name, never to a pod IP.',
        {
          usesForm: 'Services, Networking & Storage Record',
          outputHighlights: [{ text: 'Address', label: 'The Service name resolves to its stable cluster IP.' }],
          fixes: [{ symptom: 'The name does not resolve?', fix: 'Check the Service selector matches the pod labels with `kubectl get endpoints app`; no endpoints means the selector is wrong.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w3-networkpolicy',
    role: 'net',
    shared: true,
    week: 3,
    title: 'Fence it with a NetworkPolicy',
    objective: 'Apply a default-deny NetworkPolicy and an allow rule so only the chosen pod can reach the app.',
    frameworks: ['CIS'],
    deliverables: ['04_Services_Networking_and_Storage_Record.md'],
    estimatedTime: '1 h',
    difficulty: 4,
    learn: ['NetworkPolicy', 'Default deny', 'Ingress rules', 'Pod selectors'],
    tools: ['kubectl'],
    prerequisites: ['A Service in front of the app'],
    definitionOfDone: [
      'A default-deny policy blocks traffic to the app',
      'An allow rule lets the chosen pod through',
      'Both the deny and the allow are proved',
    ],
    steps: [
      run(
        'cka-w3-networkpolicy-s1',
        'Prove the deny, then the allow',
        LAB,
        'Apply a default-deny policy, prove a disallowed pod is blocked, then apply an allow rule and prove the allowed pod gets through.',
        [
          { cmd: 'kubectl apply -f week-3/netpol.yaml && kubectl run blocked --image=busybox:1.36 --restart=Never --rm -it --command -- wget -qT3 app.yard -O- 2>&1 | grep -iE "timed out|download" ; kubectl run allowed --labels=role=client --image=busybox:1.36 --restart=Never --rm -it --command -- wget -qT3 app.yard -O- 2>&1 | head -1', explain: 'Applies the policy; the unlabelled pod times out, the labelled client gets a response.', sample: 'wget: download timed out\n<!doctype html>' },
        ],
        ['timed out'],
        'A default-deny NetworkPolicy flips the cluster from open to closed: nothing reaches a pod unless a rule says so. The allow rule is the one door you open on purpose.',
        {
          usesForm: 'Services, Networking & Storage Record',
          producesDeliverable: '04_Services_Networking_and_Storage_Record.md',
          outputHighlights: [{ text: 'timed out', label: 'The disallowed pod is fenced out.' }],
          fixes: [{ symptom: 'Nothing is blocked?', fix: 'kind\'s default CNI does not enforce NetworkPolicy; create the cluster with Calico, or note the limitation and show the policy is admitted.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w3-storage',
    role: 'records',
    shared: true,
    week: 3,
    title: 'Persist data on a volume',
    objective: 'Claim a PersistentVolume, mount it, and prove the data survives the pod being deleted and recreated.',
    frameworks: ['CIS'],
    deliverables: ['04_Services_Networking_and_Storage_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['PersistentVolume', 'PersistentVolumeClaim', 'StorageClass', 'Data persistence'],
    tools: ['kubectl'],
    definitionOfDone: [
      'A PersistentVolumeClaim is Bound',
      'A pod writes to the claimed volume',
      'The data survives a pod recreate',
    ],
    steps: [
      run(
        'cka-w3-storage-s1',
        'Bind a claim and prove the data survives',
        LAB,
        'Apply a PersistentVolumeClaim and a pod that writes to it, delete the pod, recreate it, and read the data back.',
        [
          { cmd: 'kubectl apply -f week-3/pvc.yaml && kubectl get pvc data -o jsonpath="{.status.phase}{\'\\n\'}" && kubectl delete pod writer --ignore-not-found && kubectl apply -f week-3/writer.yaml && kubectl exec writer -- cat /data/hello.txt', explain: 'Binds the claim, recreates the pod, and reads back the file written before the recreate.', sample: 'persistentvolumeclaim/data created\nBound\npod "writer" deleted\npod/writer created\npersisted across recreate' },
        ],
        ['persisted'],
        'A pod is disposable; its filesystem dies with it. Anything that must survive goes on a PersistentVolumeClaim, which outlives any one pod.',
        {
          usesForm: 'Services, Networking & Storage Record',
          producesDeliverable: '04_Services_Networking_and_Storage_Record.md',
          outputHighlights: [{ text: 'persisted', label: 'The data outlived the pod.' }],
          fixes: [{ symptom: 'The PVC stays Pending?', fix: 'No StorageClass can satisfy it. kind ships a default local-path class; check `kubectl get storageclass` and that the PVC names it or leaves it default.' }],
        }
      ),
    ],
  },

  // ── Week 4 — Recover and hand over (d1 troubleshooting, d2 backup) ───────────
  {
    id: 'cka-w4-troubleshoot',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Work a broken pod, one change per row',
    objective: 'A pod will not start. Work it the method way: read it first, one theory and one change per row, failures kept.',
    frameworks: ['CIS'],
    deliverables: ['05_Cluster_Troubleshooting_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['kubectl describe', 'Events', 'CrashLoopBackOff', 'The troubleshooting method'],
    tools: ['kubectl'],
    prerequisites: ['A workload where a pod will not reach Running'],
    definitionOfDone: [
      'The symptom is written exactly, before any theory',
      'Every attempt is a row: theory, the one change, the result',
      'At least one theory was wrong and the row says so',
      'The fix is proved with the pod reaching Running and Ready',
    ],
    steps: [
      note(
        'cka-w4-troubleshoot-s1',
        'Read it before you change it',
        'The troubleshooting log',
        'Before any theory, describe the pod and read its events; write the exact status and the last event line.',
        'The log opens with the exact pod status and the event that explains it, and no theory yet.',
        {
          usesForm: 'Cluster Troubleshooting Log',
          whatItMeans: 'The method starts with reading the cluster: `kubectl describe` and the events almost always name the cause before any theory. Write it down first.',
        }
      ),
      run(
        'cka-w4-troubleshoot-s2',
        'Change one thing per row and record the result',
        LAB,
        'Write one theory from the events, change exactly one thing to test it, and record the result. A wrong theory gets the next row.',
        [
          { cmd: 'kubectl describe pod broken | grep -A3 Events; kubectl get pod broken -o jsonpath="{.status.phase}{\'\\n\'}"', explain: 'Reads the events and the current phase; compares against the theory after each single change.', sample: '  Warning  Failed  ...  Error: ImagePullBackOff\nPending' },
        ],
        ['Pending'],
        'One change per row is what makes the log trustworthy: you can always say which change fixed it. The same method A+ uses on hardware.',
        {
          usesForm: 'Cluster Troubleshooting Log',
          producesDeliverable: '05_Cluster_Troubleshooting_Log.md',
          outputHighlights: [{ text: 'Pending', label: 'The phase the pod is stuck in until the one change that fixes it.' }],
          fixes: [
            { symptom: 'ImagePullBackOff?', fix: 'The image name or tag is wrong, or the registry needs a pull secret. Fix the one that the events name.' },
            { symptom: 'CrashLoopBackOff?', fix: 'The container starts and exits. Read `kubectl logs broken --previous` for why it died, and change one thing.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'cka-w4-backup',
    role: 'cluster',
    shared: true,
    week: 4,
    title: 'Back up and restore the cluster state',
    objective: 'Take an etcd snapshot, confirm it is valid, and record how it would be restored.',
    frameworks: ['CIS'],
    deliverables: ['06_Backup_and_Recovery_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['etcd', 'etcdctl snapshot', 'Backup', 'Cluster recovery'],
    tools: ['kubectl'],
    definitionOfDone: [
      'An etcd snapshot is taken',
      'The snapshot reports as valid',
      'The restore procedure is recorded',
    ],
    steps: [
      run(
        'cka-w4-backup-s1',
        'Take an etcd snapshot and verify it',
        LAB,
        'From the etcd pod, take a snapshot of the cluster state and read back its status to prove it is a valid snapshot.',
        [
          { cmd: 'kubectl -n kube-system exec etcd-cka-control-plane -- sh -c "ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /tmp/snap.db && ETCDCTL_API=3 etcdctl snapshot status /tmp/snap.db -w table"', explain: 'Takes an etcd snapshot and prints its status table with the key count and hash.', sample: 'Snapshot saved at /tmp/snap.db\n+----------+----------+------------+------------+\n|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |\n+----------+----------+------------+------------+\n| 8f2e1a9c |     1842 |       1204 |     4.1 MB |\n+----------+----------+------------+------------+' },
        ],
        ['TOTAL KEYS'],
        'etcd holds the entire cluster state; a snapshot is the one backup that can rebuild a cluster from nothing. A backup you have not verified is not a backup.',
        {
          usesForm: 'Backup & Recovery Record',
          producesDeliverable: '06_Backup_and_Recovery_Record.md',
          outputHighlights: [{ text: 'TOTAL KEYS', label: 'The snapshot is valid and holds the cluster keys.' }],
          fixes: [{ symptom: 'etcdctl is not found in the pod?', fix: 'Use the etcd image\'s shell, or run etcdctl from a host with the pki certs mounted; the flags are the same.' }],
        }
      ),
    ],
  },
  {
    id: 'cka-w4-handover',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Hand the cluster over',
    objective: 'Assemble the handover record: what the cluster runs, how to operate and recover it, and a hashed custody row for every artifact.',
    frameworks: ['CIS'],
    deliverables: ['07_Handover_and_As_Built.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Handover', 'Runbook', 'Chain of custody', 'Hashing evidence'],
    tools: ['kubectl'],
    prerequisites: ['Every other record of the course, filled'],
    definitionOfDone: [
      'The record says what the cluster runs and how to recover it',
      'Every artifact has a custody row with its hash',
      'The cluster is deleted cleanly at the end',
    ],
    steps: [
      note(
        'cka-w4-handover-s1',
        'Write what the cluster runs and how to recover it',
        'The handover record',
        'Write the cluster in one page: the workloads, the Services and Ingress, the volumes, the RBAC, and how to recover from the etcd snapshot.',
        'A one-page record a new team could operate and recover the cluster from.',
        {
          usesForm: 'Handover & As-Built',
          whatItMeans: 'The handover is the document the next team reads before touching the cluster. Written honestly, it saves them the month you just spent.',
        }
      ),
      run(
        'cka-w4-handover-s2',
        'Hash every artifact for custody',
        LAB,
        'Hash every file in the cluster folder so the handover carries a custody row that proves what was delivered.',
        [
          { cmd: 'find cka-t1 -type f -exec sha256sum {} + | tee week-4/custody.txt | wc -l && ls week-4/custody.txt', explain: 'Hashes every artifact and counts them, writing the custody list for the record.', sample: '16\nweek-4/custody.txt' },
        ],
        ['custody.txt'],
        'A hash is what lets anyone, months later, prove the file in hand is the file delivered. It is the last control of the course.',
        {
          usesForm: 'Handover & As-Built',
          producesDeliverable: '07_Handover_and_As_Built.md',
          outputHighlights: [{ text: 'custody.txt', label: 'Every artifact hashed into one custody list.' }],
        }
      ),
      run(
        'cka-w4-handover-s3',
        'Delete the cluster cleanly',
        LAB,
        'Delete the kind cluster so nothing is left running, and confirm it is gone.',
        [
          { cmd: 'kind delete cluster --name cka && kind get clusters | grep -E "^cka$" || echo "cluster deleted"', explain: 'Removes the kind cluster and its containers, then confirms it is gone.', sample: 'Deleting cluster "cka" ...\ncluster deleted' },
        ],
        ['deleted'],
        'A kind cluster is a set of Docker containers that keep running until you delete it. Clean teardown after handover is accountability, not tidiness.',
        {
          usesForm: 'Handover & As-Built',
          fixes: [{ symptom: 'You want to keep the state for the portfolio demo?', fix: 'Keep the etcd snapshot and all manifests in the folder; the cluster rebuilds from `kind create` plus `kubectl apply` in minutes.' }],
        }
      ),
    ],
  },
];

export const KUBERNETES_CKA: Course = withModules(withAiExtensions(withPortfolioStep({
  id: 'kubernetes-cka',
  title: 'Certified Kubernetes Administrator — the Cluster Yard',
  slug: 'kubernetes-cka',
  description:
    'Stand up and operate one small Kubernetes cluster as a team: bootstrap with kind, lock RBAC, deploy and schedule, expose and persist, back up etcd, troubleshoot and hand it over. Built for the CKA.',
  vendor: 'CNCF',
  certification: 'Certified Kubernetes Administrator (CKA)',
  level: 'professional',
  audience:
    'Bootstrap, operate and hand over one Kubernetes cluster as a four-person team — everyone runs every command; the focus decides which record you lead.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  sharedTrack: true,
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Set up', detail: 'kubectl, kind and helm installed, a cluster up, the folder ready.' },
    { label: 'Build', detail: 'Read the control plane and nodes, a namespace, RBAC locked down.' },
    { label: 'Deploy', detail: 'Deployments with probes, resources, scaling, scheduling.' },
    { label: 'Connect', detail: 'Services and Ingress, a NetworkPolicy, a persistent volume.' },
    { label: 'Recover', detail: 'A broken pod worked, an etcd snapshot taken and verified.' },
    { label: 'Hand over', detail: 'The runbook, custody for every artifact, a clean teardown.' },
  ],
  isSeed: true,
  version: 1,
})));
