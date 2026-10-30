/**
 * The Docker Certified Associate Container Yard's picture, as DATA (R103, R130).
 *
 * One small app shipped in containers: the image built and pushed, the stack
 * composed and orchestrated, the network and volumes that make it a system, the
 * security that makes it safe to ship, and the records lane. Each part arrives
 * in the week the course first touches it; the week's process is that week's
 * thread walked across the same boxes. Plain data, drawn by `ArchDiagram`.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The yard — one app, built into an image and orchestrated into a stack',
    howToRead:
      'Left: the Dockerfile, the image and the registry. Middle: the Compose and Swarm stack. Right: the network, ports and volumes. Bottom: the fault worked, the scan and the hardening. Lane: the records issued at handover.',
    footer: 'Everything runs on a laptop: Docker Engine, a local registry and a single-node Swarm. No paid cloud.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'build', label: 'Build the image', note: 'Dockerfile · registry', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'stack', label: 'Orchestrate the stack', note: 'Compose · Swarm', x: 220, y: 40, w: 500, h: 340, tone: 2 },
    { id: 'platform', label: 'Network and persist', note: 'networks · ports · volumes', x: 740, y: 40, w: 200, h: 340, tone: 3 },
    { id: 'proof', label: 'Make it safe to ship', note: 'fault · scan · hardening', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms issued at handover', note: '1–7 · the stack documented', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'dockerfile', label: 'Dockerfile', sub: 'multi-stage', kind: 'evidence', zone: 'build', x: 110, y: 110, arrives: 1, records: 'dca_image', role: 'images', purpose: 'The recipe the image is built from, small by design' },
    { id: 'image', label: 'App image', sub: 'tagged 1.0.0', kind: 'app', zone: 'build', x: 110, y: 200, arrives: 1, records: 'dca_image', role: 'images', purpose: 'The built, tagged artifact the whole stack runs' },
    { id: 'registry', label: 'Registry', sub: 'push · pull · digest', kind: 'backup', zone: 'build', x: 110, y: 290, arrives: 1, records: 'dca_image', role: 'images', purpose: 'Where the image is shipped from; the digest is its true name' },
    { id: 'compose', label: 'Compose stack', sub: 'app + db', kind: 'server', zone: 'stack', x: 320, y: 110, arrives: 2, records: 'dca_orchestration', role: 'stack', purpose: 'The multi-container stack as one versioned file' },
    { id: 'swarm', label: 'Swarm services', sub: 'replicas', kind: 'server', zone: 'stack', x: 480, y: 110, arrives: 2, records: 'dca_orchestration', role: 'stack', purpose: 'The stack as desired-state services across replicas' },
    { id: 'scale', label: 'Scale & rollback', sub: 'one command each', kind: 'monitor', zone: 'stack', x: 630, y: 110, arrives: 2, records: 'dca_orchestration', role: 'stack', purpose: 'Scaling up and rolling a bad deploy back' },
    { id: 'daemon', label: 'Daemon config', sub: 'driver · log cap', kind: 'control', zone: 'stack', x: 320, y: 200, arrives: 1, records: 'dca_image', role: 'records', purpose: 'The storage and logging the engine runs with' },
    { id: 'app_run', label: 'Running app', sub: 'healthy', kind: 'app', zone: 'stack', x: 480, y: 200, arrives: 2, records: 'dca_orchestration', role: 'stack', purpose: 'The app container serving behind a healthcheck' },
    { id: 'db', label: 'Database', sub: 'on a volume', kind: 'data', zone: 'stack', x: 630, y: 200, arrives: 3, records: 'dca_network', role: 'net', purpose: 'The stateful service whose data lives on a volume' },
    { id: 'network', label: 'User network', sub: 'DNS by name', kind: 'switch', zone: 'platform', x: 840, y: 110, arrives: 3, records: 'dca_network', role: 'net', purpose: 'The network containers resolve each other by name on' },
    { id: 'ports', label: 'Published ports', sub: 'host → container', kind: 'endpoint', zone: 'platform', x: 840, y: 200, arrives: 3, records: 'dca_network', role: 'net', purpose: 'The host ports that reach the app' },
    { id: 'volume', label: 'Named volume', sub: 'survives recreate', kind: 'backup', zone: 'platform', x: 840, y: 290, arrives: 3, records: 'dca_network', role: 'net', purpose: 'Where the data outlives any one container' },
    { id: 'fault', label: 'Connectivity fault', sub: 'one change per row', kind: 'ticket', zone: 'proof', x: 320, y: 455, arrives: 3, records: 'dca_troubleshoot', role: 'records', purpose: 'A broken connection worked to a proven fix, failures kept' },
    { id: 'scan', label: 'Image scan', sub: 'CVEs by severity', kind: 'scanner', zone: 'proof', x: 480, y: 455, arrives: 4, records: 'dca_security', role: 'images', purpose: 'The vulnerabilities in the image, found before an attacker does' },
    { id: 'harden', label: 'Hardening', sub: 'non-root · no secret', kind: 'control', zone: 'proof', x: 640, y: 455, arrives: 4, records: 'dca_security', role: 'records', purpose: 'The image run least-privileged, secrets kept out' },
    { id: 'custody', label: 'Custody', sub: 'every artifact hashed', kind: 'backup', zone: 'proof', x: 800, y: 455, arrives: 4, records: 'dca_handover', role: 'records', purpose: 'A hash for every artifact the course produced' },
    { id: 'r_setup', label: '1 Install & env', sub: '', kind: 'record', zone: 'records', x: 85, y: 538, arrives: 0, records: 'dca_setup', role: 'records', purpose: 'Records the engine, Compose and the team' },
    { id: 'r_image', label: '2 Image & registry', sub: '', kind: 'record', zone: 'records', x: 230, y: 538, arrives: 1, records: 'dca_image', role: 'images', purpose: 'Records the Dockerfile, the tags and the registry' },
    { id: 'r_orch', label: '3 Stack & orchestration', sub: '', kind: 'record', zone: 'records', x: 375, y: 538, arrives: 2, records: 'dca_orchestration', role: 'stack', purpose: 'Records Compose, Swarm, scaling and rollback' },
    { id: 'r_net', label: '4 Network & storage', sub: '', kind: 'record', zone: 'records', x: 520, y: 538, arrives: 3, records: 'dca_network', role: 'net', purpose: 'Records the networks, ports and volumes' },
    { id: 'r_trouble', label: '5 Troubleshooting log', sub: '', kind: 'record', zone: 'records', x: 665, y: 538, arrives: 3, records: 'dca_troubleshoot', role: 'records', purpose: 'Records the fault worked one change per row' },
    { id: 'r_security', label: '6 Security & hardening', sub: '', kind: 'record', zone: 'records', x: 810, y: 538, arrives: 4, records: 'dca_security', role: 'images', purpose: 'Records the scan, the hardening and the base decision' },
    { id: 'r_handover', label: '7 Handover', sub: '', kind: 'record', zone: 'records', x: 85, y: 572, arrives: 4, records: 'dca_handover', role: 'records', purpose: 'The capstone: the stack as it is, with custody for every artifact' },
    { id: 'r_portfolio', label: '8 Portfolio', sub: '', kind: 'record', zone: 'records', x: 230, y: 572, arrives: 4, records: 'dca_portfolio', role: 'records', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'dockerfile', to: 'image', label: 'builds' },
    { from: 'image', to: 'registry', label: 'pushed, digest', kind: 'backup' },
    { from: 'registry', to: 'compose', label: 'pulled' },
    { from: 'compose', to: 'swarm', label: 'deployed' },
    { from: 'db', to: 'volume', label: 'persists', kind: 'backup' },
    { from: 'network', to: 'app_run', label: 'name · DNS' },
    { from: 'image', to: 'scan', label: 'scanned', kind: 'log' },
    { from: 'harden', to: 'custody', label: 'shipped safe', kind: 'admin' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Set up: engine, Compose, the yard folder', steps: [
      { from: 'dockerfile', to: 'image', label: 'engine ready to build' },
    ] },
    1: { title: 'Week 1: build, tag, push, configure', steps: [
      { from: 'dockerfile', to: 'image', label: 'built and tagged' },
      { from: 'image', to: 'registry', label: 'pushed and pulled back' },
      { from: 'daemon', to: 'image', label: 'driver and log cap set' },
    ] },
    2: { title: 'Week 2: compose, swarm, scale, roll back', steps: [
      { from: 'registry', to: 'compose', label: 'image pulled into the stack' },
      { from: 'compose', to: 'swarm', label: 'deployed as services' },
      { from: 'swarm', to: 'scale', label: 'scaled and rolled back' },
    ] },
    3: { title: 'Week 3: network, persist, work the fault', steps: [
      { from: 'network', to: 'app_run', label: 'resolves by name' },
      { from: 'db', to: 'volume', label: 'data survives recreate' },
      { from: 'ports', to: 'fault', label: 'connectivity worked' },
    ] },
    4: { title: 'Week 4: scan, harden, hand over', steps: [
      { from: 'image', to: 'scan', label: 'vulnerabilities found' },
      { from: 'scan', to: 'harden', label: 'non-root, secrets out' },
      { from: 'harden', to: 'custody', label: 'every artifact hashed' },
      { from: 'custody', to: 'r_handover', label: 'handed over' },
    ] },
  },
  captions: {
    0: 'The engine and Compose installed and proven, and the yard folder ready.',
    1: 'New: the image built from a Dockerfile, tagged, pushed and pulled back, and the daemon configured.',
    2: 'New: the stack composed, deployed to a Swarm as services, scaled, and a bad update rolled back.',
    3: 'New: the user network and name resolution, the data on a named volume, and a connectivity fault worked.',
    4: 'New: the image scanned, run non-root with no secret, the base decided, and the stack handed over and torn down.',
  },
});
