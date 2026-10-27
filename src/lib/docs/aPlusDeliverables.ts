import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';

/** R132 — the one decision of the build: what to do with the disk the SMART counters describe. */
const DISK_DECISION: DecisionBlock = {
  id: 'disk',
  title: 'The disk decision',
  subject: 'component',
  prompt: 'The SMART counters are in front of the team. What happens to this disk?',
  options: [
    { id: 'keep', label: 'Build on it', help: 'PASSED with clean counters; the user keeps the disk they have.' },
    { id: 'image-replace', label: 'Image it, then replace it', help: 'Pending or reallocated sectors; the image protects the data while a new disk is fitted.' },
    { id: 'replace', label: 'Replace it before any build', help: 'FAILED or not available; nothing is written to it.' },
  ],
  questions: [
    { field: 'disk_why', label: 'Why that, from the counters', type: 'area', required: true, placeholder: 'Reallocated_Sector_Ct 0 and Current_Pending_Sector 0 at 15,214 hours: the disk is healthy and under three years old.' },
    { field: 'disk_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'Replace now: no fault to justify the cost.' },
    { field: 'disk_risk', label: 'The risk accepted', type: 'text', placeholder: 'A disk this age can still fail without warning; the Week 2 image covers it.' },
  ],
};
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the A+ Capstone Bench produces.
 *
 * THE SCENARIO. A used desktop PC arrives at the help desk with no record and
 * a fault. The team receives it, diagnoses it, images it, rebuilds it, supports
 * a user on it, secures it and hands it over. Eight forms, one job each, in the
 * order the work happens:
 *
 *   1 Intake & Bench Checklist     what arrived, and a safe bench          W0-1
 *   2 Asset & Build Sheet          every part, read from the machine       W1-4
 *   3 Troubleshooting Log          the six-step method, one row per try    W1,3
 *   4 OS Build & Baseline Record   firmware, install, accounts, network    W1-3
 *   5 Backup & Image Register      every image, its hash, every restore    W2,4
 *   6 Support Ticket Log           user setup and the faults worked        W3
 *   7 Security Checklist           encryption, Defender, firewall, diff    W4
 *   8 Handover & As-Built          the machine as it is  ← capstone        W4
 *
 * FORM 5 IS THE ONE THE COURSE IS ABOUT. The image comes before any change,
 * and an image counts only once a restore from it has been run and timed.
 * Form 3 is the method: it keeps the theories that were wrong, because a
 * log with no failed theories in it is a log nobody believes.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'a-plus'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });

const YN = ['Yes', 'No'];
const RESULT = ['Fixed it', 'No change — theory wrong', 'Partly — new symptom'];

const A_PLUS_FORMS: DeliverableDef[] = [
  // 1 — Intake & Bench Checklist ──────────────────────────────────────────────
  {
    id: 'ap_intake',
    courseId: 'a-plus',
    num: 1,
    file: '01_Intake_and_Bench_Checklist.md',
    title: 'Intake & Bench Checklist',
    owner: 'records',
    shared: true,
    folder: '00_Intake',
    standard: 'Physical installation & asset inventory',
    weeks: [0, 1],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['ap_asset', 'ap_fault'],
    purpose:
      'What arrived, in what condition, with what, and the bench it will be worked on. Written before anyone opens the case, because the record of what arrived is the one you defend if a part goes missing.',
    howTo:
      'Tick the safety lines as you do them. Read the tag off the sticker, list the accessories, describe the condition honestly, photograph it front and back, and record the media you built and the hashes you checked.',
    buildSteps: [
      'Unplug from the wall, strap on, clipped to bare metal. Tick each line only when it is true.',
      'Make, model and service tag from the sticker on the case.',
      'Every accessory that came with it, and the condition, including anything that rattles.',
      'Two photographs, saved to the week-0 folder and hashed.',
      'The three download hashes, compared with the publisher’s page, and the media each was written to.',
      'Who leads which focus, and the hostname the team will use.',
    ],
    meaning: 'A good intake record lets anyone say, months later, exactly what the team was given. The safety lines are the habit; the photos are the evidence.',
    useIt: 'The Asset & Build Sheet starts from it, the Troubleshooting Log opens with its symptom, and the handover closes against it.',
    pitfalls: [
      'Writing the model from memory. The tag on the case is the source.',
      'Skipping the photo because the machine looks fine. The photo is for the day it does not.',
      'Writing a checksum you did not compare. A hash is proof only once it matched.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The bench — safety',
        fields: [
          { field: 'unplugged', label: 'The PC is unplugged from the wall before the case opens', type: 'select', required: true, options: YN },
          { field: 'strap', label: 'The strap is worn and clipped to bare metal', type: 'select', required: true, options: YN },
          { field: 'bench', label: 'The bench holds only the PC, the tools and the media', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'fields',
        title: 'The machine as received',
        fields: [
          { field: 'make', label: 'Make', type: 'text', required: true, placeholder: 'Dell' },
          { field: 'model', label: 'Model', type: 'text', required: true, placeholder: 'OptiPlex 7050 SFF' },
          { field: 'tag', label: 'Service tag or serial', type: 'text', required: true, placeholder: '7XQ2R52', help: 'From the sticker, not from memory.' },
          { field: 'accessories', label: 'What came with it', type: 'area', required: true, placeholder: 'Power lead, keyboard, no mouse, one 500 GB SATA drive fitted.' },
          { field: 'condition', label: 'Condition and the reported fault', type: 'area', required: true, placeholder: 'Dented side panel; "does not turn on" per the donor. Fans twitch and stop.' },
          { field: 'photos', label: 'Photographs saved (filenames)', type: 'text', required: true, placeholder: 'week-0/as-received-front.jpg, week-0/as-received-back.jpg' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'media',
          label: 'The media — checked before it was written',
          help: 'One row per download. The hash counts only once it matched the publisher’s page.',
          columns: [
            c('item', 'Image', 'text', { placeholder: 'Ubuntu 24.04 desktop' }),
            c('sha256', 'SHA-256 (first 12)', 'text', { placeholder: 'e5f2a1c0…' }),
            c('matched', 'Matched the page', 'select', { options: YN }),
            c('written_to', 'Written to', 'select', { options: ['LIVE stick', 'INSTALL stick', 'Clonezilla stick', 'Not written'] }),
          ],
          seed: [{ item: 'Ubuntu 24.04 desktop', sha256: 'e5f2a1c0…', matched: 'Yes', written_to: 'LIVE stick' }],
        },
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'hostname', label: 'Hostname the team uses', type: 'text', required: true, placeholder: 'BENCH-T1' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Hardware: Alex · Systems: Sam · Help Desk: Jo · Records: Priya' },
          { field: 'images_drive', label: 'IMAGES drive free space', type: 'number', unit: 'GB', required: true, help: 'At least twice the PC disk.' },
        ],
      },
    ],
    dod: [
      { label: 'Every safety line is Yes', when: { all: [{ field: 'unplugged', equals: 'Yes' }, { field: 'strap', equals: 'Yes' }, { field: 'bench', equals: 'Yes' }] } },
      { label: 'The machine is named with its tag, condition and accessories', when: { fields: ['make', 'model', 'tag', 'accessories', 'condition'] } },
      { label: 'Two photographs are saved', when: { fields: ['photos'] } },
      { label: 'Every piece of media was hash-checked before it was written', when: { group: 'media', atLeast: 2, every: { column: 'matched', equals: 'Yes' } } },
      { label: 'The team has a hostname and four named focuses', when: { fields: ['hostname', 'focus'] } },
    ],
  },

  // 2 — Asset & Build Sheet ───────────────────────────────────────────────────
  {
    id: 'ap_asset',
    courseId: 'a-plus',
    num: 2,
    file: '02_Asset_and_Build_Sheet.md',
    title: 'Asset & Build Sheet',
    owner: 'hw',
    shared: true,
    folder: '01_Bench',
    standard: 'Hardware audit & compatibility validation',
    weeks: [1, 2, 4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ap_os', 'ap_handover'],
    purpose:
      'Every part of the machine, read from the machine: what it is, where it sits, what the live system reported, and its health. Updated when a part is replaced, so the sheet always describes the PC as it is.',
    howTo:
      'One row per part from the open case, then the model line from the live system beside it. Record the disk health with the SMART line. When a part is replaced later, add a row for the new one and mark the old one replaced.',
    buildSteps: [
      'Walk the open case: board, CPU, each memory slot, every drive, the supply, every card, the ports.',
      'Boot the live stick and paste the model lines from dmidecode, lscpu and lsblk beside each row.',
      'Run the SMART check on the disk and record PASSED or FAILED with the counters.',
      'Mark anything replaced during the course, with why and when.',
    ],
    meaning: 'A sheet that matches the machine is what lets a stranger order the right spare. The sticker says what was sold; the firmware says what is fitted; this records the second.',
    useIt: 'The OS build reads it for drivers and the disk, and the handover copies its final part list.',
    pitfalls: [
      'Copying the model from the box or the sticker. The live system is the source.',
      'Leaving the empty memory slots out. They are the upgrade path.',
      'Building on a disk with pending sectors because the sheet never said so.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'parts',
          label: 'Every part — read from the machine',
          columns: [
            c('part', 'Part', 'select', { options: ['Motherboard', 'CPU', 'Memory module', 'Storage drive', 'Power supply', 'Graphics card', 'Network adapter', 'Other card', 'Case / cooling', 'Peripheral'] }),
            c('location', 'Where it sits', 'text', { placeholder: 'DIMM1 · SATA0 · PCIe x16' }),
            c('model', 'Model (from the live system)', 'text', { placeholder: 'ST500DM002-1BD142' }),
            c('detail', 'Capacity / rating / speed', 'text', { placeholder: '465.8 GB · 2400 MT/s · 240 W' }),
            c('status', 'Status', 'select', { options: ['Fitted', 'Replaced', 'Added', 'Removed'] }),
          ],
          seed: [
            { part: 'Motherboard', location: 'Case', model: 'Dell 0NW6H5', detail: 'LGA1151, 4 DIMM slots, 2 SATA', status: 'Fitted' },
            { part: 'Memory module', location: 'DIMM1', model: '8 GB DDR4', detail: '2400 MT/s', status: 'Fitted' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Disk health',
        fields: [
          { field: 'smart_result', label: 'SMART overall result', type: 'select', required: true, options: ['PASSED', 'FAILED', 'Not available'] },
          { field: 'smart_line', label: 'The counters line', type: 'paste', required: true, placeholder: '5 Reallocated_Sector_Ct … 0 / 197 Current_Pending_Sector … 0 / 9 Power_On_Hours … 15214' },
        ],
      },
      { kind: 'decision', block: DISK_DECISION },
      {
        kind: 'fields',
        title: 'Empty slots and the upgrade path',
        fields: [
          { field: 'empty_slots', label: 'Empty slots and free ports', type: 'text', placeholder: 'DIMM2 and DIMM4 empty; one SATA port free; M.2 slot present' },
          { field: 'upgrade', label: 'The one upgrade that would matter most', type: 'text', placeholder: 'An M.2 NVMe drive as the boot disk; keep the SATA disk for data.' },
        ],
      },
    ],
    dod: [
      { label: 'At least six parts are rows with a location and the model the live system reported', when: { group: 'parts', where: { filled: ['part', 'location', 'model'] }, atLeast: 6 } },
      { label: 'The disk health is recorded with its counters', when: { fields: ['smart_result', 'smart_line'] } },
      decisionDod(DISK_DECISION),
      { label: 'The empty slots are listed', when: { fields: ['empty_slots'] } },
    ],
  },

  // 3 — Troubleshooting Log ───────────────────────────────────────────────────
  {
    id: 'ap_fault',
    courseId: 'a-plus',
    num: 3,
    file: '03_Troubleshooting_Log.md',
    title: 'Troubleshooting Log',
    owner: 'hw',
    shared: true,
    folder: '01_Bench',
    standard: 'Structured troubleshooting method',
    weeks: [1, 3],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ap_tickets', 'ap_handover'],
    purpose:
      'The six-step method as a record: identify the problem, establish a theory, test it, plan and act, verify, document. One row per attempt, including the ones that changed nothing, because ruling a theory out is the method working.',
    howTo:
      'Write the symptom exactly, before any theory. Then one row per attempt: the theory, the one thing you changed, the result. When the machine works, write what it was, the fix, and what stops it coming back.',
    buildSteps: [
      'Step 1, identify: what it does, exactly. Fans, lights, beeps, screen, when it stops. Look the code up for this model.',
      'Step 2, a theory of probable cause. Write it before you act.',
      'Step 3, test the theory: change one thing. Record the result, including no change.',
      'Step 4, plan the fix and its way back. Step 5, make it and verify full function.',
      'Step 6, document: what it was, the fix, the prevention.',
    ],
    meaning: 'Anyone can reseat memory. A technician can say which symptom pointed there, what they ruled out, and how they proved it. The rows that say no change are that proof.',
    useIt: 'The Week 3 tickets link to rows here, and the handover lists the fault history.',
    pitfalls: [
      'Changing several things at once, then not knowing which one worked.',
      'Deleting the failed attempts before handing the log in.',
      'A theory written after the fix. That is a story, not a theory.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Step 1 — identify the problem',
        fields: [
          { field: 'symptom', label: 'The symptom, exactly', type: 'area', required: true, placeholder: 'Power button: fans spin for two seconds, stop, amber LED blinks 2-3. No video, no beep.' },
          { field: 'code', label: 'Beep or LED code, looked up for this model', type: 'text', placeholder: 'Dell amber 2-3: memory or RAM failure' },
          { field: 'changed', label: 'What changed before it arrived', type: 'text', placeholder: 'Donor says it was moved between offices last month.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'attempts',
          label: 'Steps 2–3 — one row per attempt',
          help: 'Keep the rows that did not work. One change per row; change three things and you learn nothing.',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'A memory module is unseated' }),
            c('action', 'The one thing you changed', 'text', { placeholder: 'Reseated both modules' }),
            c('result', 'Result', 'select', { options: RESULT }),
          ],
          seed: [
            { theory: 'A memory module is unseated', action: 'Reseated both modules', result: 'No change — theory wrong' },
            { theory: 'One module is dead', action: 'Minimum boot: one module in DIMM1 only', result: 'Fixed it' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Steps 4–6 — the fix, the proof, the prevention',
        fields: [
          { field: 'fix', label: 'What it was, and the fix', type: 'area', required: true, placeholder: 'DIMM in slot 3 dead. Removed it; machine runs on one 8 GB module. Spare ordered.' },
          { field: 'verified', label: 'How you verified full function', type: 'text', required: true, placeholder: 'Booted the live stick; free -h shows 7.7Gi; lsblk lists the disk; dmesg has no errors.' },
          { field: 'prevent', label: 'What stops it recurring', type: 'text', required: true, placeholder: 'Memory reseated and clipped; MemTest86+ one pass clean on the remaining module.' },
        ],
      },
    ],
    dod: [
      { label: 'The symptom is written before any theory', when: { fields: ['symptom'] } },
      { label: 'At least two attempts are rows, each with a theory, one change and a result', when: { group: 'attempts', where: { filled: ['theory', 'action', 'result'] }, atLeast: 2 } },
      { label: 'At least one theory was wrong and the row says so', when: { group: 'attempts', some: { column: 'result', matches: 'theory wrong' } } },
      { label: 'The fault is fixed, verified and a prevention is named', when: { all: [{ group: 'attempts', some: { column: 'result', equals: 'Fixed it' } }, { fields: ['fix', 'verified', 'prevent'] }] } },
    ],
  },

  // 4 — OS Build & Baseline Record ────────────────────────────────────────────
  {
    id: 'ap_os',
    courseId: 'a-plus',
    num: 4,
    file: '04_OS_Build_and_Baseline.md',
    title: 'OS Build & Baseline Record',
    owner: 'os',
    shared: true,
    folder: '02_Build',
    standard: 'Configuration baseline, hardening benchmark & written policy',
    weeks: [1, 2, 3],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ap_security', 'ap_handover'],
    purpose:
      'The machine’s software state as built: the firmware settings, the Windows edition and build, drivers, updates, accounts, the network it sits on, and the baseline file that Week 4 is compared against.',
    howTo:
      'Record the firmware version and every setting you changed with its menu path. After the install, paste the build line, confirm no device is in error, list the accounts, and save the services baseline with its hash. After connecting, record the four network numbers.',
    buildSteps: [
      'Firmware: the version on arrival and after any update; boot mode, Secure Boot, TPM, boot order, setup password set.',
      'Install: edition, build and the disk it went on. No device in error after drivers.',
      'Updates current, rebooted; the three newest updates listed.',
      'Accounts: a named admin, bench.user as a standard user, Administrator disabled.',
      'The services baseline file and its SHA-256.',
      'Network: adapter speed, address, gateway, DNS, and the three proof tests.',
    ],
    meaning: 'A baseline is a file with a hash, not a memory. This record is what Week 4 diffs against, and what the next technician reads to know what normal looks like.',
    useIt: 'The Security Checklist compares against it; the handover copies it.',
    pitfalls: [
      'Writing "UEFI" without the menu path. The next technician needs the path.',
      'Capturing the baseline before the reboot that followed updates.',
      'Leaving the built-in Administrator enabled because the install wizard did.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Firmware baseline',
        fields: [
          { field: 'fw_before', label: 'Firmware version on arrival', type: 'text', required: true, placeholder: '1.29.0 (2024-06-24)' },
          { field: 'fw_after', label: 'Firmware version after update', type: 'text', placeholder: '1.33.0 (2026-03-02), or "not updated: current"' },
          { field: 'boot_mode', label: 'Boot mode', type: 'select', required: true, options: ['UEFI', 'Legacy BIOS'] },
          { field: 'secure_boot', label: 'Secure Boot', type: 'select', required: true, options: ['On', 'Off — reason recorded'] },
          { field: 'tpm', label: 'TPM', type: 'select', required: true, options: ['2.0 enabled', '1.2 enabled', 'None on this board'] },
          { field: 'boot_order', label: 'Boot order', type: 'text', required: true, placeholder: 'Internal disk, then USB' },
          { field: 'setup_pw', label: 'Setup password set', type: 'select', required: true, options: YN, help: 'Record the password in the team’s notes, never in this document.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'fw_changes',
          label: 'Every firmware setting changed, with its menu path',
          columns: [
            c('setting', 'Setting', 'text', { placeholder: 'SATA operation' }),
            c('path', 'Menu path', 'text', { placeholder: 'System Configuration → SATA Operation' }),
            c('from', 'From', 'text', { placeholder: 'RAID On' }),
            c('to', 'To', 'text', { placeholder: 'AHCI' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Windows build',
        fields: [
          { field: 'os_line', label: 'OS Name and OS Version lines', type: 'paste', required: true, placeholder: 'OS Name: Microsoft Windows 11 Pro\nOS Version: 10.0.26100 N/A Build 26100' },
          { field: 'install_disk', label: 'Installed onto', type: 'text', required: true, placeholder: 'The internal 465 GB SATA disk, all partitions deleted first' },
          { field: 'devices_ok', label: 'No device in error after drivers', type: 'select', required: true, options: YN },
          { field: 'updates', label: 'Three newest updates', type: 'text', required: true, placeholder: 'KB5044284, KB5043178, KB5039338 on 2026-10-26' },
          { field: 'accounts', label: 'Accounts and their state', type: 'paste', required: true, placeholder: 'Administrator False · alex.admin True · bench.user True (Users only)' },
          { field: 'baseline_file', label: 'Services baseline file', type: 'text', required: true, placeholder: 'D:\\bench-t1\\week-2\\services-baseline.txt' },
          { field: 'baseline_hash', label: 'Its SHA-256', type: 'text', required: true, placeholder: '8C1D…B2E0' },
        ],
      },
      {
        kind: 'fields',
        title: 'Network — the known-good picture',
        fields: [
          { field: 'link', label: 'Adapter status and speed', type: 'text', placeholder: 'Ethernet Up 1 Gbps' },
          { field: 'ip', label: 'IPv4 address', type: 'ipv4', placeholder: '10.10.50.23' },
          { field: 'gateway', label: 'Default gateway', type: 'ipv4', placeholder: '10.10.50.1' },
          { field: 'dns', label: 'DNS server', type: 'ipv4', placeholder: '10.10.0.10' },
          { field: 'proof', label: 'The three proofs: gateway ping, name resolved, first hop out', type: 'paste', placeholder: 'Reply from 10.10.50.1 · example.com → 93.184.215.14 · hop 1 10.10.50.1' },
        ],
      },
    ],
    dod: [
      { label: 'The firmware baseline is set and recorded', when: { fields: ['fw_before', 'boot_mode', 'secure_boot', 'tpm', 'boot_order', 'setup_pw'] } },
      { label: 'Windows is installed clean with no device in error and updates current', when: { all: [{ fields: ['os_line', 'install_disk', 'updates'] }, { field: 'devices_ok', equals: 'Yes' }] }, week: 2 },
      { label: 'The accounts are as the course requires and the baseline file is hashed', when: { fields: ['accounts', 'baseline_file', 'baseline_hash'] }, week: 2 },
      { label: 'The known-good network picture is recorded with its proofs', when: { fields: ['ip', 'gateway', 'dns', 'proof'] }, week: 3 },
    ],
  },

  // 5 — Backup & Image Register ───────────────────────────────────────────────
  {
    id: 'ap_backup',
    courseId: 'a-plus',
    num: 5,
    file: '05_Backup_and_Image_Register.md',
    title: 'Backup & Image Register',
    owner: 'records',
    shared: true,
    folder: '02_Build',
    standard: 'Backup & restore proof',
    weeks: [2, 4],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ap_handover'],
    purpose:
      'Every image of the disk, its hash and where it lives, and every restore that was run from one, with the two clock readings that make the restore time a measurement. The rule this course teaches: image first, and an image counts only once it has been restored.',
    howTo:
      'One row per image as you take it: name, what state it captures, where it is, the hash. One row per restore: which image, why, the start and end time, and what proved it came back. Write the recovery target before the Week 4 restore, not after.',
    buildSteps: [
      'The as-received image before the installer runs; hash it from the live stick.',
      'The post-install image once Windows is baselined; hash it.',
      'Restore as-received, boot it, time it; restore post-install, prove the baseline hash matches.',
      'Week 4: write the recovery target first, take the handover image, break the machine on purpose, restore, time it.',
      'Compare the measured time with the target and explain the gap.',
    ],
    meaning: 'A backup is a promise until it has been restored. The restore time is the number a manager asks for, and only a measured one is worth saying.',
    useIt: 'The handover names every image and the measured restore time; the custody log carries every hash.',
    pitfalls: [
      'Taking the image after the install. The point is the way back to before.',
      'Recording "restore tested" with no times. A restore without a measurement is a story.',
      'Writing the target after the measurement so they agree.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'images',
          label: 'Every image taken',
          columns: [
            c('name', 'Image name', 'text', { placeholder: 'as-received-20261026' }),
            c('state', 'What it captures', 'select', { options: ['As received, before any change', 'Post-install, baselined', 'Handover, encrypted'] }),
            c('where', 'Where it lives', 'text', { placeholder: 'IMAGES drive, /bench-t1/week-2/' }),
            c('sha256', 'SHA-256 of the partition image (first 12)', 'text', { placeholder: '4d7a9ce21f…' }),
            c('taken', 'Taken (date, by whom)', 'text', { placeholder: '2026-10-26, Sam' }),
          ],
          seed: [{ name: 'as-received-20261026', state: 'As received, before any change', where: 'IMAGES drive, /bench-t1/week-2/', sha256: '4d7a9ce21f…', taken: '2026-10-26, Sam' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'restores',
          label: 'Every restore run — with the two clock readings',
          help: 'The end time is when the restored system answers, not when Clonezilla says done.',
          columns: [
            c('image', 'Image restored', 'text', { placeholder: 'as-received-20261026' }),
            c('why', 'Why', 'text', { placeholder: 'Prove the as-received image boots' }),
            c('start', 'Start', 'text', { placeholder: '14:02:11' }),
            c('end', 'End', 'text', { placeholder: '14:31:40' }),
            c('minutes', 'Measured minutes', 'number', { unit: 'min' }),
            c('proof', 'What proved it came back', 'text', { placeholder: 'Old system reached its sign-in screen' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The recovery target (Week 4) — written before the restore',
        fields: [
          { field: 'rto', label: 'Recovery time target', type: 'duration', placeholder: '45 minutes', help: 'How long the user can be without the machine. Write it before you measure.' },
          { field: 'rto_why', label: 'Why that number', type: 'text', placeholder: 'The user has one machine and no spare; half a morning is the most they will accept.' },
          { field: 'rto_gap', label: 'Measured against target — the gap, explained', type: 'area', placeholder: 'Measured 39 minutes against a 45-minute target. Clonezilla took 31; the BitLocker key prompt cost 4.' },
        ],
      },
    ],
    dod: [
      { label: 'The as-received image exists with a hash, taken before the install', when: { group: 'images', some: { all: [{ column: 'state', matches: '^As received' }, { filled: ['sha256', 'where'] }] } } },
      { label: 'The post-install image exists with a hash', when: { group: 'images', some: { all: [{ column: 'state', matches: '^Post-install' }, { filled: ['sha256'] }] } } },
      { label: 'At least one restore was run and timed with two readings', when: { group: 'restores', where: { filled: ['image', 'start', 'end', 'proof'] }, atLeast: 1 } },
      { label: 'The recovery target was written and the Week 4 restore measured against it', when: { all: [{ fields: ['rto', 'rto_why', 'rto_gap'] }, { group: 'restores', where: { filled: ['image', 'start', 'end', 'proof'] }, atLeast: 2 }] }, week: 4 },
      { label: 'The handover image exists, hashed, noted as encrypted', when: { group: 'images', some: { all: [{ column: 'state', matches: '^Handover' }, { filled: ['sha256'] }] } }, week: 4 },
    ],
  },

  // 6 — Support Ticket Log ────────────────────────────────────────────────────
  {
    id: 'ap_tickets',
    courseId: 'a-plus',
    num: 6,
    file: '06_Support_Ticket_Log.md',
    title: 'Support Ticket Log',
    owner: 'support',
    shared: true,
    folder: '03_Support',
    standard: 'Incident & request handling',
    weeks: [3],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ap_handover'],
    purpose:
      'Every request and every fault, as a ticket: who, what they said, when it opened, what was done with the method, and when it closed. The setup of the user and peripherals is the first ticket; the three injected faults are the rest.',
    howTo:
      'Open a ticket from the user’s words before you look at the machine. Work it with the six steps and link the Troubleshooting Log rows. Close it with the time and the proof the user can work again.',
    buildSteps: [
      'T-001 Setup: the user signed in as a standard user, the printer, the second display, the remote session.',
      'One ticket per injected fault, opened from what the user said.',
      'Priority from impact: the user who cannot work at all comes first.',
      'Each ticket: theory, test, fix, proof, closed time. At least one needed a second theory.',
    ],
    meaning: 'A ticket that opens with a theory skips the first step of the method. A ticket closed without proof is a ticket that reopens.',
    useIt: 'The handover lists the open and closed tickets and what the user was taught.',
    pitfalls: [
      'Writing what you think instead of what the user said.',
      'Closing a ticket on "should be fine now". Proof is the user doing the thing.',
      'Three faults, three fixes, no method shown. The method is what is assessed.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'tickets',
          label: 'Tickets',
          columns: [
            c('ref', 'Ticket', 'text', { placeholder: 'T-002' }),
            c('kind', 'Kind', 'select', { options: ['Request — setup', 'Fault — network', 'Fault — boot or hardware', 'Fault — software or printing'] }),
            c('user_said', 'What the user said', 'text', { placeholder: '“The internet is down on the bench PC.”' }),
            c('opened', 'Opened', 'text', { placeholder: '15:10' }),
            c('theory', 'Theory, then test', 'text', { placeholder: 'DNS changed: ipconfig shows 8.8.4.4, not the lab server' }),
            c('fix', 'Fix and proof', 'text', { placeholder: 'Reset DNS to DHCP; nslookup example.com resolves' }),
            c('closed', 'Closed', 'text', { placeholder: '15:22' }),
            c('log_rows', 'Troubleshooting Log rows', 'text', { placeholder: 'Rows 3–4' }),
          ],
          seed: [{ ref: 'T-001', kind: 'Request — setup', user_said: 'New user needs the PC, the printer and a second screen.', opened: '13:00', theory: 'n/a', fix: 'bench.user signs in; test page printed; displays extended; Quick Assist session with Jo', closed: '14:05', log_rows: '—' }],
        },
      },
      {
        kind: 'fields',
        title: 'Remote help',
        fields: [
          { field: 'remote_tool', label: 'Remote tool used', type: 'select', required: true, options: ['Quick Assist', 'Remote Desktop', 'Both'] },
          { field: 'remote_proof', label: 'Proof of the session', type: 'text', required: true, placeholder: 'hostname and query session run by the helper: BENCH-T1, bench.user console Active' },
        ],
      },
    ],
    dod: [
      { label: 'The setup ticket records the user, the printer, the display and the remote session', when: { group: 'tickets', some: { all: [{ column: 'kind', matches: '^Request' }, { filled: ['fix', 'closed'] }] } } },
      { label: 'Three fault tickets are opened from the user’s words', when: { group: 'tickets', where: { all: [{ column: 'kind', matches: '^Fault' }, { filled: ['user_said', 'opened'] }] }, atLeast: 3 } },
      { label: 'Every fault ticket is worked with a theory and closed with proof', when: { group: 'tickets', where: { column: 'kind', matches: '^Fault' }, atLeast: 3, every: { any: [{ column: 'kind', matches: '^Request' }, { filled: ['theory', 'fix', 'closed', 'log_rows'] }] } } },
      { label: 'The remote session is proved', when: { fields: ['remote_tool', 'remote_proof'] } },
    ],
  },

  // 7 — Security Checklist ────────────────────────────────────────────────────
  {
    id: 'ap_security',
    courseId: 'a-plus',
    num: 7,
    file: '07_Security_Checklist.md',
    title: 'Security Checklist',
    owner: 'os',
    shared: true,
    folder: '04_Handover',
    standard: 'Device hardening · policy',
    weeks: [4],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['ap_handover'],
    purpose:
      'The security state the machine is handed over in, each line with the output that proves it: disk encryption with the key off the machine, Defender current and real-time, every firewall profile on, a clean full scan, and the services diff against Week 2 explained.',
    howTo: 'Run each check, paste the line that proves it, and tick it. Explain every row of the services diff; an empty diff is the best answer and still gets written down.',
    buildSteps: [
      'BitLocker: Protection On, the method, TPM and a numerical password as protectors. The recovery key on the IMAGES drive, named here by location.',
      'Defender: service on, real-time on, signatures dated today.',
      'Firewall: Domain, Private and Public all True.',
      'A full scan with zero detections.',
      'The services diff against the Week 2 baseline, and the baseline file’s hash unchanged.',
    ],
    meaning: 'These are the questions an auditor asks about an endpoint. The answers are output, not opinions.',
    useIt: 'The handover copies it as the security state at handover.',
    pitfalls: [
      'The recovery key saved on the encrypted disk. That is no key at all.',
      'Ticking the firewall from memory. One profile is usually off after a wizard.',
      'A diff with rows and no explanation.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Encryption',
        fields: [
          { field: 'bl_status', label: 'manage-bde -status: Protection Status line', type: 'paste', required: true, placeholder: 'Protection Status:    Protection On' },
          { field: 'bl_method', label: 'Encryption method', type: 'text', required: true, placeholder: 'XTS-AES 256' },
          { field: 'bl_protectors', label: 'Key protectors', type: 'text', required: true, placeholder: 'TPM, Numerical Password' },
          { field: 'bl_key_where', label: 'Where the recovery key lives (location, never the key)', type: 'text', required: true, placeholder: 'IMAGES drive, /bench-t1/week-4/bitlocker-recovery.txt, and the instructor’s safe' },
        ],
      },
      {
        kind: 'fields',
        title: 'Defender and the firewall',
        fields: [
          { field: 'defender', label: 'Get-MpComputerStatus: the three columns', type: 'paste', required: true, placeholder: 'AMServiceEnabled True · RealTimeProtectionEnabled True · AntivirusSignatureLastUpdated 26/10/2026' },
          { field: 'fw_domain', label: 'Domain profile', type: 'select', required: true, options: ['True', 'False'] },
          { field: 'fw_private', label: 'Private profile', type: 'select', required: true, options: ['True', 'False'] },
          { field: 'fw_public', label: 'Public profile', type: 'select', required: true, options: ['True', 'False'] },
          { field: 'scan', label: 'Full scan detections (Count)', type: 'number', required: true, unit: 'threats' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'diff',
          label: 'Services diff against Week 2 — every row explained',
          help: 'Paste each row of the Compare-Object output and say why it changed. No rows: add one row saying "empty".',
          columns: [
            c('service', 'Service', 'text', { placeholder: 'Spooler, or "empty"' }),
            c('side', 'Side', 'select', { options: ['=> started since', '<= stopped since', 'empty'] }),
            c('why', 'Why', 'text', { placeholder: 'Printer added in Week 3 — on purpose' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The baseline itself',
        fields: [{ field: 'baseline_hash_now', label: 'Week 2 baseline file SHA-256, read today', type: 'text', required: true, placeholder: '8C1D…B2E0 — matches the OS Build record' }],
      },
    ],
    dod: [
      { label: 'The disk is encrypted with Protection On and the key is stored off the machine', when: { all: [{ field: 'bl_status', matches: 'Protection On' }, { fields: ['bl_method', 'bl_protectors', 'bl_key_where'] }] } },
      { label: 'Defender is on and current', when: { fields: ['defender'] } },
      { label: 'All three firewall profiles are on', when: { all: [{ field: 'fw_domain', equals: 'True' }, { field: 'fw_private', equals: 'True' }, { field: 'fw_public', equals: 'True' }] } },
      { label: 'A full scan ran with zero detections', when: { field: 'scan', matches: '^0$' } },
      { label: 'Every row of the services diff is explained', when: { group: 'diff', atLeast: 1, every: { filled: ['service', 'side', 'why'] } } },
      { label: 'The baseline file still hashes as recorded', when: { fields: ['baseline_hash_now'] } },
    ],
  },

  // 8 — Handover & As-Built ───────────────────────────────────────────────────
  {
    id: 'ap_handover',
    courseId: 'a-plus',
    num: 8,
    file: '08_Handover_and_As_Built.md',
    title: 'Handover & As-Built',
    owner: 'records',
    shared: true,
    capstone: true,
    folder: '04_Handover',
    standard: 'As-built documentation · operational handover',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The machine as it really is, handed to the person who will run it: the final part list, what was done, where the images and the key live, the known issues, a ten-minute first-day check, and a custody row with a hash for every artifact the course produced.',
    howTo:
      'Copy the final part list from the Asset & Build Sheet. Say what was replaced, changed and secured, by reference to the other records. Name the locations of the images and the recovery key without the key. List the known issues honestly. Write the first-day check in order. Hash every artifact into the custody log.',
    buildSteps: [
      'The machine now: hostname, the final part list, the Windows build, the accounts.',
      'What was done: the fault fixed, the parts replaced, the firmware baseline, the security state.',
      'Where things live: each image by name and location, the recovery key by location.',
      'Known issues: what you could not fix or chose not to, and why.',
      'The first-day check: boot, sign in as the user, print, reach a website, Protection On. Ten minutes, in order.',
      'The custody log: every photo, log, baseline, image and output file, hashed, with who collected it and who holds it.',
    ],
    meaning: 'The as-built is the document the next technician reads before touching the machine. Written honestly, it saves them the week you just spent.',
    useIt: 'It is the capstone: it is reviewed by the Systems focus, approved by the Help Desk focus, and issued with the machine.',
    pitfalls: [
      'Describing the plan rather than the machine. The sheet says what is fitted now.',
      'A password or a recovery key in the document. Locations only.',
      'A first-day check that assumes the reader knows the machine.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The machine now',
        fields: [
          { field: 'hostname', label: 'Hostname', type: 'text', required: true, placeholder: 'BENCH-T1' },
          { field: 'parts_now', label: 'Final part list', type: 'area', required: true, placeholder: 'Dell OptiPlex 7050 SFF · i5-7500 · 8 GB (one module; DIMM3 removed, dead) · 500 GB SATA (SMART PASSED) · onboard graphics' },
          { field: 'build_now', label: 'Windows build and accounts', type: 'text', required: true, placeholder: 'Windows 11 Pro 26100 · alex.admin (admin) · bench.user (standard) · Administrator disabled' },
        ],
      },
      {
        kind: 'fields',
        title: 'What was done, and where things live',
        fields: [
          { field: 'done', label: 'Fault fixed, parts replaced, firmware set, secured', type: 'area', required: true, placeholder: 'Dead DIMM removed (Troubleshooting Log rows 1–2). Firmware 1.33.0, UEFI, Secure Boot on. BitLocker XTS-AES 256, Defender on, firewall on all profiles.' },
          { field: 'images_where', label: 'Images, by name and location', type: 'area', required: true, placeholder: 'as-received-20261026, post-install-20261102, handover-20261116 — IMAGES drive /bench-t1/, hashes in the register' },
          { field: 'key_where', label: 'Recovery key location (never the key)', type: 'text', required: true, placeholder: 'IMAGES drive /bench-t1/week-4/bitlocker-recovery.txt and the instructor’s safe' },
          { field: 'restore_time', label: 'Measured restore time against target', type: 'text', required: true, placeholder: '39 minutes measured, 45 target' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'known_issues',
          label: 'Known issues — honestly',
          columns: [
            c('issue', 'Issue', 'text', { placeholder: 'Only one memory module fitted' }),
            c('impact', 'Impact', 'text', { placeholder: 'Slower with many tabs open' }),
            c('plan', 'What to do about it', 'text', { placeholder: 'Fit the spare 8 GB module in DIMM1 when it arrives' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The first-day check — ten minutes, in order',
        fields: [{ field: 'first_day', label: 'Steps a stranger follows', type: 'area', required: true, placeholder: '1 Power on; firmware splash, then Windows. 2 Sign in as bench.user. 3 Print a test page. 4 Open a website. 5 manage-bde -status C: shows Protection On. 6 Defender shows no action needed.' }],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-0/as-received-front.jpg', description: 'The machine as received, front', collected_by: 'Records', datetime: '2026-10-26 09:40', location: 'IMAGES /bench-t1/week-0/', sha256: '4d7a…', transferred_to: 'Hardware', transferred_at: '2026-10-26 10:00', notes: 'for the Asset & Build Sheet' },
        ],
      }),
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date issued', type: 'date', required: true },
          { field: 'signoff', label: 'Issued by (Records focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The machine is described as it is now: parts, build, accounts', when: { fields: ['hostname', 'parts_now', 'build_now'] } },
      { label: 'What was done is recorded by reference to the other records', when: { fields: ['done'] } },
      { label: 'Every image and the recovery key are named by location, and the restore time is stated', when: { fields: ['images_where', 'key_where', 'restore_time'] } },
      { label: 'Known issues are listed', when: { group: 'known_issues', atLeast: 1, every: { filled: ['issue', 'plan'] } } },
      { label: 'A first-day check exists', when: { fields: ['first_day'] } },
      { label: 'Every artifact is logged with a SHA-256 (chain of custody)', when: everyEvidenceHashed() },
      { label: 'The document is versioned, dated and signed', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const A_PLUS_DELIVERABLES: DeliverableDef[] = A_PLUS_FORMS;
