import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the Docker Certified Associate Container Yard produces (DCA).
 *
 * A four-person team ships one small web app in containers and documents it the
 * way a platform team would. Seven forms, one job each, in work order:
 *
 *   1 Install & Environment Register    the engine, Compose, the team        W0
 *   2 Image Build & Registry Record     the Dockerfile, tags, the registry   W1
 *   3 Stack & Orchestration Record      Compose, Swarm, scaling, rollback    W2
 *   4 Networking & Storage Record       networks, names, volumes             W3
 *   5 Container Troubleshooting Log     a connectivity fault, one row a try  W3
 *   6 Image Security & Hardening Record scan, non-root ← the base decision   W4
 *   7 Handover & As-Built               the stack as it is  ← capstone       W4
 *
 * FORM 6 CARRIES THE DECISION the course is about: which base image the stack
 * ships on, weighed on size against vulnerabilities. Form 5 is the method: it
 * keeps the theories that were wrong, because a log with none is not believed.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'docker-dca'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });
const YN = ['Yes', 'No'];

/** The one decision of the yard: which base image the stack ships on. */
const BASE_DECISION: DecisionBlock = {
  id: 'base',
  title: 'The base-image decision',
  subject: 'component',
  prompt: 'The scan findings and the size are in front of the team. Which base image does the stack ship on?',
  options: [
    { id: 'full', label: 'The full base', help: 'Largest and most vulnerable, but everything the app might need is present.' },
    { id: 'slim', label: 'A slim base', help: 'Smaller and fewer packages to attack; some tools must be added back.' },
    { id: 'distroless', label: 'A distroless base', help: 'Smallest attack surface, no shell; hardest to debug and build for.' },
  ],
  questions: [
    { field: 'base_why', label: 'Why that, from the scan and the size', type: 'area', required: true, placeholder: 'The slim base drops 40 packages and 6 high CVEs for a 60MB saving; the app needs no extra tools.' },
    { field: 'base_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'Distroless: the team cannot yet debug without a shell under time pressure.' },
    { field: 'base_risk', label: 'The risk accepted', type: 'text', placeholder: 'The slim base still carries two medium CVEs with no fix yet; tracked for the next rebuild.' },
  ],
};

const DOCKER_DCA_FORMS: DeliverableDef[] = [
  // 1 — Install & Environment Register ──────────────────────────────────────────
  {
    id: 'dca_setup',
    courseId: 'docker-dca',
    num: 1,
    file: '01_Install_and_Environment_Register.md',
    title: 'Install & Environment Register',
    owner: 'records',
    shared: true,
    folder: '00_Setup',
    standard: 'Host & engine configuration · CIS Docker Benchmark 1-2 · NIST SP 800-53 CM-6',
    weeks: [0],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['dca_image'],
    purpose:
      'What the yard runs on: the Docker Engine and Compose versions, the install method, and who leads which record. Written first, so a version mismatch is caught before any build.',
    howTo:
      'Record the engine and Compose versions, the install method, the hello-world run, the app name and the four focuses.',
    buildSteps: [
      'The Docker Engine client and server versions.',
      'The Compose plugin version.',
      'That hello-world ran.',
      'The app name and the yard folder path.',
      'Who leads which focus.',
    ],
    meaning: 'A good setup record lets anyone reproduce the environment and proves the engine ran a container before real work began.',
    useIt: 'The image record builds on it; the handover closes the environment against it.',
    pitfalls: [
      'A client version with no server — the daemon is not running.',
      'The old docker-compose binary instead of the v2 plugin.',
      'No record of the install method.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The engine',
        fields: [
          { field: 'client', label: 'Docker client version', type: 'text', required: true, placeholder: '27.3.1' },
          { field: 'server', label: 'Docker server (daemon) version', type: 'text', required: true, placeholder: '27.3.1' },
          { field: 'compose', label: 'Compose plugin version', type: 'text', required: true, placeholder: 'v2.29.7' },
          { field: 'hello', label: 'hello-world ran', type: 'select', required: true, options: YN },
          { field: 'install', label: 'Install method', type: 'text', required: true, placeholder: 'apt docker-ce / Docker Desktop' },
        ],
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'app', label: 'App name', type: 'text', required: true, placeholder: 'yard-t1/app' },
          { field: 'folder', label: 'Yard folder path', type: 'text', required: true, placeholder: 'yard-t1/' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Images: Sam · Orchestration: Jo · Networking: Alex · Operations: Priya' },
        ],
      },
    ],
    dod: [
      { label: 'The engine shows a client and a server version', when: { fields: ['client', 'server'] } },
      { label: 'Compose is installed and hello-world ran', when: { all: [{ fields: ['compose'] }, { field: 'hello', equals: 'Yes' }] } },
      { label: 'The team has an app name and four focuses', when: { fields: ['app', 'focus'] } },
    ],
  },

  // 2 — Image Build & Registry Record ───────────────────────────────────────────
  {
    id: 'dca_image',
    courseId: 'docker-dca',
    num: 2,
    file: '02_Image_Build_and_Registry_Record.md',
    title: 'Image Build & Registry Record',
    owner: 'images',
    shared: true,
    folder: '01_Build',
    standard: 'Image build & registry · DCA domains 2-3 · CIS Docker Benchmark 4 · NIST SP 800-53 CM-2',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['dca_orchestration'],
    purpose:
      'How the app becomes an image: the Dockerfile, the tags, the registry round trip, and the daemon configuration the team agreed. The record a rebuild starts from.',
    howTo:
      'Record the Dockerfile stages, the image size and tags, the registry push digest, the pull-back proof, and the storage and logging drivers.',
    buildSteps: [
      'The Dockerfile stages and the final image size.',
      'The tags, including a semantic version.',
      'The registry, the push digest and the pull-back proof.',
      'The storage and logging drivers, and the log size cap.',
    ],
    meaning: 'A tagged, pushed, pulled-back image is an image you have really shipped; the digest is the one name that never lies.',
    useIt: 'The stack deploys this image; the security record scans it; the handover names its digest.',
    pitfalls: [
      'Only a latest tag, so no build can be named again.',
      'A push with no pull-back, so nobody knows it round-trips.',
      'An uncapped container log.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The image',
        fields: [
          { field: 'stages', label: 'Dockerfile stages', type: 'text', required: true, placeholder: 'build (node:20) → runtime (node:20-slim)' },
          { field: 'size', label: 'Final image size', type: 'text', required: true, placeholder: '84 MB' },
          { field: 'tags', label: 'Tags applied', type: 'text', required: true, placeholder: '1.0.0, latest' },
        ],
      },
      {
        kind: 'fields',
        title: 'The registry and the daemon',
        fields: [
          { field: 'registry', label: 'Registry', type: 'text', required: true, placeholder: 'localhost:5000' },
          { field: 'digest', label: 'Pushed digest', type: 'text', required: true, placeholder: 'sha256:9f8e7d6c…' },
          { field: 'pullback', label: 'Pulled back by tag', type: 'select', required: true, options: YN },
          { field: 'storage_driver', label: 'Storage driver', type: 'text', required: true, placeholder: 'overlay2' },
          { field: 'log_cap', label: 'Log size cap', type: 'text', required: true, placeholder: 'max-size 10m, max-file 3' },
        ],
      },
    ],
    dod: [
      { label: 'The image has stages, a size and a semantic tag', when: { fields: ['stages', 'size', 'tags'] } },
      { label: 'It pushed to a registry and pulled back by tag', when: { all: [{ fields: ['digest'] }, { field: 'pullback', equals: 'Yes' }] } },
      { label: 'The storage driver and a log cap are recorded', when: { fields: ['storage_driver', 'log_cap'] } },
    ],
  },

  // 3 — Stack & Orchestration Record ────────────────────────────────────────────
  {
    id: 'dca_orchestration',
    courseId: 'docker-dca',
    num: 3,
    file: '03_Stack_and_Orchestration_Record.md',
    title: 'Stack & Orchestration Record',
    owner: 'stack',
    shared: true,
    folder: '02_Orchestrate',
    standard: 'Orchestration · DCA domain 1 · NIST SP 800-53 CP-10',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['dca_network'],
    purpose:
      'How the stack runs as more than one container: the Compose file, the Swarm services and replicas, the scaling, and the rollback that makes a bad deploy safe.',
    howTo:
      'Record the services and their healthchecks, the replica counts on the Swarm, the scaled count, and the rollback from a bad tag.',
    buildSteps: [
      'The services in the Compose file and their healthchecks.',
      'The Swarm services and replica counts.',
      'The scaled replica count.',
      'The bad tag, and the rollback to the working one.',
    ],
    meaning: 'Orchestration is a desired state held by the system; scaling and rollback are one command each because a service is just a number of identical tasks.',
    useIt: 'The network record wires these services together; the handover says how to scale and recover them.',
    pitfalls: [
      'No healthcheck, so "running" does not mean "serving".',
      'A rollback never tested, so nobody trusts it.',
      'Replicas stuck at 0 with no reason read.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'services',
          label: 'The services',
          columns: [
            c('service', 'Service', 'text', { placeholder: 'app' }),
            c('image', 'Image', 'text', { placeholder: 'localhost:5000/app:1.0.0' }),
            c('replicas', 'Replicas', 'text', { placeholder: '2/2' }),
            c('health', 'Healthy', 'select', { options: YN }),
          ],
          seed: [{ service: 'app', image: 'localhost:5000/app:1.0.0', replicas: '2/2', health: 'Yes' }],
        },
      },
      {
        kind: 'fields',
        title: 'Scale and rollback',
        fields: [
          { field: 'scaled', label: 'Scaled replica count reached', type: 'text', required: true, placeholder: '4/4' },
          { field: 'bad_tag', label: 'The bad tag rolled out', type: 'text', required: true, placeholder: 'localhost:5000/app:broken' },
          { field: 'rolled_back', label: 'Rolled back to the working tag', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Stack changes — each with a rollback',
          help: 'Every change to the running stack, and how to undo it.',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'Updated app to localhost:5000/app:1.1.0' }),
            c('reason', 'Reason', 'text', { placeholder: 'Ship the new feature' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'docker service rollback yard_app' }),
          ],
          seed: [{ change: 'Initial deploy', reason: 'Baseline', rollback: 'docker stack rm yard' }],
        },
      },
    ],
    dod: [
      { label: 'At least two services run with a healthcheck', when: { group: 'services', atLeast: 2, every: { filled: ['service', 'image'] } } },
      { label: 'The stack scaled to more replicas', when: { fields: ['scaled'] } },
      { label: 'A bad update was rolled back', when: { all: [{ fields: ['bad_tag'] }, { field: 'rolled_back', equals: 'Yes' }] } },
      { label: 'Every stack change has a rollback', when: { group: 'changes', atLeast: 1, every: { filled: ['change', 'rollback'] } } },
    ],
  },

  // 4 — Networking & Storage Record ─────────────────────────────────────────────
  {
    id: 'dca_network',
    courseId: 'docker-dca',
    num: 4,
    file: '04_Networking_and_Storage_Record.md',
    title: 'Networking & Storage Record',
    owner: 'net',
    shared: true,
    folder: '03_Connect',
    standard: 'Container networking & volumes · DCA domains 4,6 · CIS Docker Benchmark 5 · NIST SP 800-53 SC-7',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['dca_security'],
    purpose:
      'How the containers find each other and keep their data: the user-defined network and its DNS, the published ports, and the named volume the data survives on.',
    howTo:
      'Record the network and its subnet, the name resolution proof, the published ports, and the volume that outlived a recreate.',
    buildSteps: [
      'The user-defined network and its subnet.',
      'One service resolving another by name.',
      'The published ports, host to container.',
      'The named volume, and that data survived a recreate.',
    ],
    meaning: 'On a user network, containers reach each other by name; on a volume, their data outlives them. Both are what turn containers into a system.',
    useIt: 'The troubleshooting log works a fault in this network; the handover lists the volumes to back up.',
    pitfalls: [
      'Containers on the default bridge, where names do not resolve.',
      'Data in the container, lost on the first recreate.',
      'A port mapping that does not match the app’s listen port.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The network',
        fields: [
          { field: 'network', label: 'Network name', type: 'text', required: true, placeholder: 'yard_default' },
          { field: 'subnet', label: 'Subnet', type: 'text', required: true, placeholder: '172.18.0.0/16' },
          { field: 'resolves', label: 'One service resolves another by name', type: 'select', required: true, options: YN },
          { field: 'ports', label: 'Published ports (host→container)', type: 'text', required: true, placeholder: '8080→3000' },
        ],
      },
      {
        kind: 'fields',
        title: 'The storage',
        fields: [
          { field: 'volume', label: 'Named volume', type: 'text', required: true, placeholder: 'yard_dbdata' },
          { field: 'survived', label: 'Data survived a container recreate', type: 'select', required: true, options: YN },
        ],
      },
    ],
    dod: [
      { label: 'The services share a user network and resolve by name', when: { all: [{ fields: ['network'] }, { field: 'resolves', equals: 'Yes' }] } },
      { label: 'The published ports are recorded', when: { fields: ['ports'] } },
      { label: 'The data survives a recreate on a named volume', when: { all: [{ fields: ['volume'] }, { field: 'survived', equals: 'Yes' }] } },
    ],
  },

  // 5 — Container Troubleshooting Log ───────────────────────────────────────────
  {
    id: 'dca_troubleshoot',
    courseId: 'docker-dca',
    num: 5,
    file: '05_Container_Troubleshooting_Log.md',
    title: 'Container Troubleshooting Log',
    owner: 'records',
    shared: true,
    folder: '03_Connect',
    standard: 'Fault diagnosis · one change per row · NIST SP 800-53 IR-4',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['dca_security'],
    purpose:
      'A connectivity fault worked the method way: the symptom first, one theory and one change per row, the failed theories kept, and the fix proved with a successful request.',
    howTo:
      'Write the failing request exactly before any theory. Change one thing per row and record the result. Keep the rows that did not work. End with the proof.',
    buildSteps: [
      'The failing request, the port, and the exact error.',
      'One theory per row, one change, the result.',
      'At least one theory that was wrong, kept.',
      'The proof: a successful request to the port.',
    ],
    meaning: 'A log with no failed theories is a log nobody believes. The failures are the proof the team worked the fault, not guessed.',
    useIt: 'The fix feeds the hardening and the handover; the method carries to every fault after it.',
    pitfalls: [
      'Writing "it does not work" instead of the exact error.',
      'Changing three things at once.',
      'Deleting the theories that failed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The fault',
        fields: [
          { field: 'request', label: 'The failing request', type: 'text', required: true, placeholder: 'curl http://localhost:8080/ → connection reset' },
          { field: 'error', label: 'The exact error', type: 'area', required: true, placeholder: 'curl: (56) Recv failure; app logs show it listening on 3000, published 8080→80' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'attempts',
          label: 'The attempts — one change per row',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'Published port maps to the wrong container port' }),
            c('change', 'The one change', 'text', { placeholder: 'Change ports to 8080:3000' }),
            c('result', 'Result', 'select', { options: ['Fixed it', 'No change — theory wrong', 'Partly — new symptom'] }),
          ],
          seed: [{ theory: 'Wrong container port', change: 'ports 8080:3000', result: 'Fixed it' }],
        },
      },
      {
        kind: 'fields',
        title: 'The proof',
        fields: [{ field: 'proof', label: 'The successful request', type: 'text', required: true, placeholder: 'curl -o /dev/null -w "%{http_code}" http://localhost:8080/ → 200' }],
      },
    ],
    dod: [
      { label: 'The failing request and the exact error are written', when: { fields: ['request', 'error'] } },
      { label: 'Every attempt is a row, and at least one theory was wrong', when: { group: 'attempts', atLeast: 2, some: { column: 'result', equals: 'No change — theory wrong' } } },
      { label: 'The fix is proved with a successful request', when: { fields: ['proof'] } },
    ],
  },

  // 6 — Image Security & Hardening Record ← the decision ─────────────────────────
  {
    id: 'dca_security',
    courseId: 'docker-dca',
    num: 6,
    file: '06_Image_Security_and_Hardening_Record.md',
    title: 'Image Security & Hardening Record',
    owner: 'images',
    shared: true,
    folder: '04_Handover',
    standard: 'Image security & least privilege · DCA domain 5 · CIS Docker Benchmark 4-5 · NIST SP 800-53 AC-6',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['dca_handover'],
    purpose:
      'How the image is made safe to ship: the scan findings and what was done about each, the non-root run with capabilities dropped, no secret in the layers, and the base-image decision.',
    howTo:
      'Record the scan counts and the decision per high finding, the non-root uid, the no-secret proof, and the base-image decision with its rejected option.',
    buildSteps: [
      'The scan tool and the finding counts by severity.',
      'Each high finding: patch, accept or replace the base.',
      'The non-root uid the container runs as.',
      'The no-secret-in-layers proof.',
      'The base-image decision.',
    ],
    meaning: 'A shipped image carries every flaw in its base. Scanning finds them, least privilege shrinks the blast radius, and the base decision is the biggest lever on both.',
    useIt: 'The handover names the final image and its posture; the decision governs the rebuild.',
    pitfalls: [
      'A scan with no decision per finding.',
      'A container still running as root.',
      'A secret baked into a build layer.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'findings',
          label: 'The scan findings',
          columns: [
            c('cve', 'Finding', 'text', { placeholder: 'CVE-2024-1234 openssl' }),
            c('severity', 'Severity', 'select', { options: ['Critical', 'High', 'Medium', 'Low'] }),
            c('action', 'Decision', 'select', { options: ['Patch by rebuild', 'Accept with reason', 'Replace the base'] }),
          ],
          seed: [{ cve: 'CVE-2024-1234 openssl', severity: 'High', action: 'Patch by rebuild' }],
        },
      },
      {
        kind: 'fields',
        title: 'Least privilege',
        fields: [
          { field: 'nonroot_uid', label: 'Non-root uid the container runs as', type: 'text', required: true, placeholder: '10001' },
          { field: 'no_secret', label: 'No secret is baked into the image layers', type: 'select', required: true, options: YN },
        ],
      },
      { kind: 'decision', block: BASE_DECISION },
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date', type: 'date', required: true },
          { field: 'signoff', label: 'Reviewed by (Images focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'Every high finding has a decision', when: { group: 'findings', atLeast: 1, every: { filled: ['cve', 'action'] } } },
      { label: 'The container runs non-root with no baked secret', when: { all: [{ fields: ['nonroot_uid'] }, { field: 'no_secret', equals: 'Yes' }] } },
      decisionDod(BASE_DECISION),
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },

  // 7 — Handover & As-Built ← capstone ──────────────────────────────────────────
  {
    id: 'dca_handover',
    courseId: 'docker-dca',
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
      'The stack as it really is, handed to whoever runs it next: the image and tag, the services, networks and volumes, how to run, scale and recover it, the known limits, and a custody row with a hash for every artifact.',
    howTo:
      'Describe the stack by reference to the other records. Say how to bring it up, scale it and recover it. List the known limits. Hash every artifact into the custody log.',
    buildSteps: [
      'The stack now: the image digest, the services, networks and volumes.',
      'How to run it, scale it and recover it.',
      'Known limits: what it cannot do and what to watch.',
      'The custody log: every Dockerfile, compose file, scan and output, hashed.',
    ],
    meaning: 'The as-built is the document the next team reads before touching the stack. Written honestly, it saves them the month you just spent.',
    useIt: 'It is the capstone: reviewed by the Orchestration focus, approved by the Operations focus, and issued with the stack.',
    pitfalls: [
      'Describing the plan rather than the stack as built.',
      'A secret or a registry credential in the document.',
      'No recovery steps.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The stack now',
        fields: [
          { field: 'app', label: 'App name and image digest', type: 'text', required: true, placeholder: 'yard-t1/app @ sha256:9f8e…' },
          { field: 'services', label: 'Services, networks and volumes', type: 'area', required: true, placeholder: 'app (2 replicas), db (1); network yard_default; volume yard_dbdata' },
          { field: 'run', label: 'How to run, scale and recover', type: 'area', required: true, placeholder: 'docker stack deploy -c compose.yaml yard; docker service scale yard_app=N; docker service rollback yard_app' },
        ],
      },
      {
        kind: 'fields',
        title: 'Known limits',
        fields: [{ field: 'limits', label: 'What it cannot do, and what to watch', type: 'area', required: true, placeholder: 'Single-node swarm — no real HA; db volume must be backed up before any host rebuild.' }],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-1/Dockerfile', description: 'The app Dockerfile', collected_by: 'Images', datetime: '2026-10-26 10:10', location: 'yard-t1/week-1/', sha256: '3b2a…', transferred_to: 'Records', transferred_at: '2026-10-26 10:30', notes: 'for the build record' },
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
      { label: 'The stack is described as built, with how to run and scale it', when: { fields: ['app', 'services', 'run'] } },
      { label: 'The known limits and recovery are recorded', when: { fields: ['limits'] } },
      { label: 'Every artifact is hashed into the custody log', when: everyEvidenceHashed('evidence') },
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const DOCKER_DCA_DELIVERABLES: DeliverableDef[] = DOCKER_DCA_FORMS;
