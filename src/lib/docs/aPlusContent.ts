/**
 * The A+ Capstone Bench's picture, as DATA (R103, R130).
 *
 * One used desktop on a bench: the parts inside it, the media around it, the
 * network and the help desk it joins in Week 3, and the records lane. Each
 * part arrives in the week the course first touches it; the week's process
 * is that week's thread walked across the same boxes. Plain data, so it ships
 * in the course document (`content.arch`) and `ArchDiagram` draws it.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The bench — one PC, the media around it, and the desk it joins',
    howToRead:
      'Left: the bench and the media the team builds. Middle: the PC and what is inside and on it, week by week. Right: the network and the help desk it joins in Week 3. Bottom: the records that document each part. Every task names one of these boxes.',
    footer: 'One second-hand desktop per team. The image drive is the way back; the records lane is what the client receives.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'bench', label: 'The bench', note: 'tools · media', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'pc', label: 'The PC — what the team rebuilds', note: 'parts · firmware · system', x: 220, y: 40, w: 500, h: 340, tone: 2 },
    { id: 'desk', label: 'The desk it joins', note: 'network · help desk', x: 740, y: 40, w: 200, h: 340, tone: 3 },
    { id: 'proof', label: 'The way back and the proof', note: 'images · baseline · custody', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms that document the bench', note: '1–8 · issued at handover', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'strap', label: 'Strap and tools', sub: 'ESD · #2 screwdriver', kind: 'control', zone: 'bench', x: 110, y: 100, arrives: 0, records: 'ap_intake', role: 'records', purpose: 'The bench made safe before the case opens' },
    { id: 'live', label: 'LIVE stick', sub: 'Linux live USB', kind: 'evidence', zone: 'bench', x: 110, y: 170, arrives: 0, records: 'ap_intake', role: 'os', purpose: 'Boots the PC to read and prove its parts' },
    { id: 'install', label: 'INSTALL stick', sub: 'Windows media, checked', kind: 'evidence', zone: 'bench', x: 110, y: 240, arrives: 0, records: 'ap_intake', role: 'os', purpose: 'Installs Windows clean from hash-checked media' },
    { id: 'images', label: 'IMAGES drive', sub: 'external · three images', kind: 'backup', zone: 'bench', x: 110, y: 310, arrives: 0, records: 'ap_backup', role: 'records', purpose: 'Holds every image, hash and the recovery key' },
    { id: 'board', label: 'Board, CPU, memory', sub: 'read from dmidecode', kind: 'server', zone: 'pc', x: 310, y: 100, arrives: 1, records: 'ap_asset', role: 'hw', purpose: 'The parts, identified by sight and proved from the live system' },
    { id: 'disk', label: 'Disk', sub: 'SMART checked', kind: 'data', zone: 'pc', x: 470, y: 100, arrives: 1, records: 'ap_asset', role: 'hw', purpose: 'Imaged before any change; replaced if SMART fails it' },
    { id: 'firmware', label: 'Firmware', sub: 'UEFI · Secure Boot · TPM', kind: 'control', zone: 'pc', x: 630, y: 100, arrives: 1, records: 'ap_os', role: 'os', purpose: 'The first security control, set and recorded with menu paths' },
    { id: 'fault', label: 'The fault', sub: 'six-step method', kind: 'ticket', zone: 'pc', x: 310, y: 170, arrives: 1, records: 'ap_fault', role: 'hw', purpose: 'Worked one theory and one change per row, failures kept' },
    { id: 'windows', label: 'Windows', sub: 'clean install · updated', kind: 'app', zone: 'pc', x: 470, y: 170, arrives: 2, records: 'ap_os', role: 'os', purpose: 'Installed from checked media, drivers clean, updates current' },
    { id: 'accounts', label: 'Accounts', sub: 'named admin · standard user', kind: 'identity', zone: 'pc', x: 630, y: 170, arrives: 2, records: 'ap_os', role: 'os', purpose: 'A named admin, a standard user, the built-in Administrator off' },
    { id: 'peripherals', label: 'Printer and displays', sub: 'set up as the user', kind: 'endpoint', zone: 'pc', x: 310, y: 240, arrives: 3, records: 'ap_tickets', role: 'support', purpose: 'Added and proved as the standard user, not the admin' },
    { id: 'remote', label: 'Remote help', sub: 'Quick Assist · RDP', kind: 'control', zone: 'pc', x: 470, y: 240, arrives: 3, records: 'ap_tickets', role: 'support', purpose: 'A teammate takes control and the session is a ticket' },
    { id: 'tickets', label: 'Three tickets', sub: 'injected faults', kind: 'ticket', zone: 'pc', x: 630, y: 240, arrives: 3, records: 'ap_tickets', role: 'support', purpose: 'Network, boot and software faults worked with the method' },
    { id: 'bitlocker', label: 'Encryption', sub: 'BitLocker · TPM', kind: 'control', zone: 'pc', x: 310, y: 310, arrives: 4, records: 'ap_security', role: 'os', purpose: 'The disk encrypted, the recovery key stored off the machine' },
    { id: 'defender', label: 'Defender and firewall', sub: 'current · all profiles', kind: 'scanner', zone: 'pc', x: 470, y: 310, arrives: 4, records: 'ap_security', role: 'os', purpose: 'Real-time protection, three profiles on, a clean full scan' },
    { id: 'diff', label: 'Baseline diff', sub: 'Week 4 vs Week 2', kind: 'monitor', zone: 'pc', x: 630, y: 310, arrives: 4, records: 'ap_security', role: 'os', purpose: 'Every service that changed is on purpose or a finding' },
    { id: 'switch', label: 'Bench switch', sub: 'DHCP · DNS · gateway', kind: 'switch', zone: 'desk', x: 840, y: 100, arrives: 3, records: 'ap_os', role: 'support', purpose: 'Gives the PC its address; the known-good picture is recorded' },
    { id: 'internet', label: 'Outside', sub: 'the path out', kind: 'outside', zone: 'desk', x: 840, y: 170, external: true, arrives: 3, records: 'ap_os', role: 'support', purpose: 'Gateway, name, route: three tests in order prove the path' },
    { id: 'user', label: 'The user', sub: 'bench.user', kind: 'people', zone: 'desk', x: 840, y: 240, arrives: 3, records: 'ap_tickets', role: 'support', purpose: 'Signs in as a standard user and raises the tickets' },
    { id: 'helpdesk', label: 'Help desk', sub: 'a teammate, remote', kind: 'people', zone: 'desk', x: 840, y: 310, arrives: 3, records: 'ap_tickets', role: 'support', purpose: 'Helps remotely and works the tickets by the method' },
    { id: 'image_received', label: 'As-received image', sub: 'before any change', kind: 'backup', zone: 'proof', x: 310, y: 455, arrives: 2, records: 'ap_backup', role: 'records', purpose: 'The way back, hashed, taken before the installer runs' },
    { id: 'image_post', label: 'Post-install image', sub: 'restore proved, timed', kind: 'backup', zone: 'proof', x: 470, y: 455, arrives: 2, records: 'ap_backup', role: 'records', purpose: 'The clean build, proved by a restore and a matching hash' },
    { id: 'baseline', label: 'Services baseline', sub: 'file with a hash', kind: 'evidence', zone: 'proof', x: 630, y: 455, arrives: 2, records: 'ap_os', role: 'os', purpose: 'The saved state Week 4 is compared against' },
    { id: 'image_handover', label: 'Handover image', sub: 'encrypted · timed restore', kind: 'backup', zone: 'proof', x: 790, y: 455, arrives: 4, records: 'ap_backup', role: 'records', purpose: 'Restored over a deliberate break inside the written target' },
    { id: 'r_intake', label: '1 Intake & bench', sub: '', kind: 'record', zone: 'records', x: 85, y: 538, arrives: 0, records: 'ap_intake', role: 'records', purpose: 'Records the safety lines, the machine as received and the media' },
    { id: 'r_asset', label: '2 Asset & build', sub: '', kind: 'record', zone: 'records', x: 250, y: 538, arrives: 1, records: 'ap_asset', role: 'hw', purpose: 'Records every part as the live system reported it' },
    { id: 'r_fault', label: '3 Troubleshooting log', sub: '', kind: 'record', zone: 'records', x: 415, y: 538, arrives: 1, records: 'ap_fault', role: 'hw', purpose: 'Records the six steps, one attempt per row' },
    { id: 'r_os', label: '4 OS build & baseline', sub: '', kind: 'record', zone: 'records', x: 580, y: 538, arrives: 1, records: 'ap_os', role: 'os', purpose: 'Records firmware, install, accounts, network and the baseline' },
    { id: 'r_backup', label: '5 Backup & image', sub: '', kind: 'record', zone: 'records', x: 745, y: 538, arrives: 2, records: 'ap_backup', role: 'records', purpose: 'Records every image, its hash and every timed restore' },
    { id: 'r_tickets', label: '6 Support tickets', sub: '', kind: 'record', zone: 'records', x: 85, y: 572, arrives: 3, records: 'ap_tickets', role: 'support', purpose: 'Records the setup and the three faults as tickets' },
    { id: 'r_security', label: '7 Security checklist', sub: '', kind: 'record', zone: 'records', x: 250, y: 572, arrives: 4, records: 'ap_security', role: 'os', purpose: 'Records encryption, Defender, firewall, scan and the diff' },
    { id: 'r_handover', label: '8 Handover & as-built', sub: '', kind: 'record', zone: 'records', x: 415, y: 572, arrives: 4, records: 'ap_handover', role: 'records', purpose: 'The capstone: the machine as it is, with custody for every artifact' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'live', to: 'board', label: 'reads the parts' },
    { from: 'install', to: 'windows', label: 'installs' },
    { from: 'disk', to: 'images', label: 'imaged, hashed', kind: 'backup' },
    { from: 'images', to: 'disk', label: 'restored, timed', kind: 'backup' },
    { from: 'switch', to: 'windows', label: 'address · DNS' },
    { from: 'user', to: 'helpdesk', label: 'tickets' },
    { from: 'helpdesk', to: 'remote', label: 'takes control', kind: 'admin' },
    { from: 'baseline', to: 'diff', label: 'compared', kind: 'log' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'The bench, before the case opens', steps: [
      { from: 'strap', to: 'disk', label: 'safe to touch' },
      { from: 'live', to: 'board', label: 'boots the machine' },
    ] },
    1: { title: 'Week 1: read it, fix it, set the firmware', steps: [
      { from: 'live', to: 'board', label: 'dmidecode, lscpu, lsblk' },
      { from: 'live', to: 'disk', label: 'SMART health' },
      { from: 'fault', to: 'board', label: 'one theory, one change' },
      { from: 'firmware', to: 'disk', label: 'UEFI, Secure Boot, boot order' },
    ] },
    2: { title: 'Week 2: image first, build, prove the restore', steps: [
      { from: 'disk', to: 'image_received', label: 'imaged before any change' },
      { from: 'install', to: 'windows', label: 'clean install, updates' },
      { from: 'windows', to: 'baseline', label: 'services saved and hashed' },
      { from: 'image_received', to: 'disk', label: 'restored and timed' },
    ] },
    3: { title: 'Week 3: connect, set up, work the tickets', steps: [
      { from: 'switch', to: 'windows', label: 'address, gateway, DNS' },
      { from: 'user', to: 'peripherals', label: 'printer and displays' },
      { from: 'helpdesk', to: 'remote', label: 'Quick Assist' },
      { from: 'user', to: 'tickets', label: 'three faults, by the method' },
    ] },
    4: { title: 'Week 4: secure, time the restore, hand over', steps: [
      { from: 'bitlocker', to: 'images', label: 'key stored off the machine' },
      { from: 'baseline', to: 'diff', label: 'every change explained' },
      { from: 'image_handover', to: 'disk', label: 'restored inside the target' },
      { from: 'r_handover', to: 'user', label: 'as-built with custody' },
    ] },
  },
  captions: {
    0: 'The bench made safe, the media built and hash-checked, the IMAGES drive ready, and the machine recorded as received.',
    1: 'New: the parts read from the live system, the fault worked with the method, and the firmware baseline set.',
    2: 'New: the as-received image, Windows installed clean, accounts and a hashed baseline, and a restore proved and timed.',
    3: 'New: the network, the user, the printer and displays, remote help, and three injected faults worked as tickets.',
    4: 'New: encryption, Defender, the baseline diff, the handover image restored inside the target, and the as-built issued.',
  },
});
