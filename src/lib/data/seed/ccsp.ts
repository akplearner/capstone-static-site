import type { Course, RoleDef, Step, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';
import { withAiExtensions } from '../../docs/aiExtension';
import { withModules } from '../modules';

/**
 * ISC2 Certified Cloud Security Professional — the Cloud Assurance (CCSP).
 *
 * The cloud-architecture companion to CISSP: a four-person team secures one
 * small cloud application across its whole lifecycle and governs it the way a
 * real cloud-security team would — read the shared-responsibility line and the
 * reference architecture, scope the legal and compliance obligations, classify
 * and protect the data with its own keys, secure the platform and the
 * application, run operations and work an incident one change per row, and hand
 * a control baseline over with custody.
 *
 * NO PAID RESOURCES REQUIRED. Every proof runs against sample artifacts shipped
 * with the course — a data inventory, a control catalogue, a provider SOC-2
 * control list, a dependency manifest — read with awk, jq and grep on a plain
 * laptop. Every step runs a real command and pastes the output back.
 *
 * THE RULE THE COURSE TEACHES: map the control to the evidence. A control is
 * real only when it points at the artifact that proves it, and an incident is
 * worked one theory and one change per row, the method A+ uses on a dead PC.
 *
 * SIX EXAM DOMAINS, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`,
 * like CISSP). The four graded weeks cover architecture and law, data security,
 * platform and application security, and operations with compliance. Everyone
 * does every task; the focus decides which record a member leads. Week 0 is setup.
 */

const ROLES: RoleDef[] = [
  {
    id: 'data',
    name: 'Cloud Data Security (Data Lead)',
    mission: 'Leads the data record: classification, encryption, key ownership and retention.',
    color: '#0369a1',
    icon: 'Database',
  },
  {
    id: 'platform',
    name: 'Platform & Infrastructure (Platform Lead)',
    mission: 'Leads the platform record: the reference architecture, the network and the controls.',
    color: '#15803d',
    icon: 'Server',
  },
  {
    id: 'appsec',
    name: 'Application Security (AppSec Lead)',
    mission: 'Leads the application record: the secure lifecycle, the secrets and the dependencies.',
    color: '#b45309',
    icon: 'Code',
  },
  {
    id: 'grc',
    name: 'Governance & Operations (GRC Lead)',
    mission: 'Leads the records that outlive the build: law, operations, the incident and handover.',
    color: '#7c3aed',
    icon: 'Scale',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Set up the engagement',
    theme: 'The account, the scope, and the team',
    objective: 'Open the cloud account, make an MFA identity, agree the scope, and make the evidence folder.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'open-the-account', label: 'Open the account, with the budget guard', tasks: ['ccsp-w0-account'] },
      { id: 'make-an-identity', label: 'Make an MFA identity and the CLI', tasks: ['ccsp-w0-identity'] },
      { id: 'know-the-team-and-folder', label: 'Know your team, focus and folder', tasks: ['ccsp-w0-orient'] },
    ],
    milestone: 'The account has a $1 budget alert, an MFA identity runs the CLI, and the evidence folder names the team and the four focuses.',
  },
  {
    number: 1,
    title: 'Architecture and the law',
    theme: 'Shared responsibility, and what the law requires',
    objective: 'Draw the shared-responsibility line and the reference architecture, then scope the legal and compliance obligations.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Identify',
    difficulty: 2,
    objectives: [
      { id: 'shared-responsibility', label: 'The shared-responsibility line', tasks: ['ccsp-w1-concepts'] },
      { id: 'reference-architecture', label: 'The reference architecture', tasks: ['ccsp-w1-architecture'] },
      { id: 'legal-and-compliance', label: 'The legal and compliance scope', tasks: ['ccsp-w1-legal'] },
    ],
    milestone: 'Each layer is marked provider or customer, the architecture names every component and its trust boundary, and the obligations are mapped to a framework.',
  },
  {
    number: 2,
    title: 'Cloud data security',
    theme: 'Classify it, protect it, own the key',
    objective: 'Classify the data, protect it with encryption and its own key, and set a retention and deletion rule.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Protect',
    difficulty: 3,
    objectives: [
      { id: 'classify-the-data', label: 'Classify the data', tasks: ['ccsp-w2-classify'] },
      { id: 'protect-the-data', label: 'Encrypt it and lock the store', tasks: ['ccsp-w2-protect'] },
      { id: 'own-the-key', label: 'Own the key and the lifecycle', tasks: ['ccsp-w2-keys'] },
    ],
    milestone: 'Every data set has a classification, the store is encrypted and refuses public access, and a customer-owned key with a rotation and retention rule is recorded.',
  },
  {
    number: 3,
    title: 'Platform and application security',
    theme: 'Fence the platform, secure the build',
    objective: 'Secure the platform and network, then secure the application: its secrets, its dependencies and its pipeline.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Build',
    difficulty: 3,
    objectives: [
      { id: 'secure-the-platform', label: 'Secure the platform', tasks: ['ccsp-w3-platform'] },
      { id: 'segment-the-network', label: 'Segment the network', tasks: ['ccsp-w3-network'] },
      { id: 'secure-the-application', label: 'Secure the application', tasks: ['ccsp-w3-appsec'] },
    ],
    milestone: 'The platform baseline passes, the network is segmented, and the application has no hard-coded secret and no critical dependency vulnerability.',
  },
  {
    number: 4,
    title: 'Operations and compliance',
    theme: 'Watch it, work the incident, hand it over',
    objective: 'Stand operations up, work an incident one change per row, and hand the control baseline over with custody.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Hand over',
    difficulty: 3,
    objectives: [
      { id: 'run-operations', label: 'Run security operations', tasks: ['ccsp-w4-operations'] },
      { id: 'work-the-incident', label: 'Work the incident', tasks: ['ccsp-w4-incident'] },
      { id: 'hand-it-over', label: 'Hand the baseline over', tasks: ['ccsp-w4-handover'] },
    ],
    milestone: 'Monitoring and a change process are recorded, the incident is contained with the method shown row by row, and the handover maps every control to its evidence and hashes every artifact.',
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
  frameworks: ['ISO_27001'],
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
  expectedOutput: commands.map((c) => c.sample).filter(Boolean).join('\n'),
  whatItMeans,
  frameworks: ['ISO_27001'],
  ...extra,
});

const TASKS: Task[] = [
  // ── Week 0 — Set up the engagement ───────────────────────────────────────────
  {
    id: 'ccsp-w0-account',
    role: 'grc',
    shared: true,
    week: 0,
    title: 'Open the account and guard the spend',
    objective: 'Open a cloud free account, turn on MFA for the owner, and set a $1 budget alert.',
    frameworks: ['ISO_27001'],
    deliverables: ['01_Engagement_and_Scope_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['Cloud free account', 'Owner MFA', 'Budgets and alerts', 'Account hygiene'],
    tools: ['Terminal', 'Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'The free account is open with MFA on the owner',
      'A $1 budget alert exists',
      'The register names the account and who owns it',
    ],
    steps: [
      note(
        'ccsp-w0-account-s1',
        'Open the account and turn owner MFA on',
        'Terminal',
        'Create the cloud free account for the engagement and turn on MFA for the account owner before anything else.',
        'The account exists with MFA on the owner, agreed as break-glass only for routine work.',
        {
          usesForm: 'Engagement & Scope Register',
          instructionList: [
            'Use a shared team email, not a personal one.',
            'Turn on MFA for the owner immediately; it is the one identity that can do anything.',
            'Record that the owner is break-glass only; daily work is a scoped identity.',
          ],
          whatItMeans: 'The account owner is the account. Securing it first, and reserving it for break-glass, is the first control of any cloud baseline.',
        }
      ),
      run(
        'ccsp-w0-account-s2',
        'Write the engagement scope file',
        'Your own machine — a terminal',
        'Write a scope file naming the application, the data it holds and the one obligation that drives the controls, and count its lines.',
        [
          { cmd: 'printf \'app: quote-api\\ndata: customer PII + quotes\\nobligation: GDPR + SOC-2\\nregion: eu-west-1\\n\' | tee scope.txt | wc -l', explain: 'Writes the scope and counts the lines, so the engagement opens with a written boundary.', sample: '4' },
        ],
        ['4'],
        'The scope is the boundary every later control is judged against. Writing it first stops scope creep and names what the law cares about.',
        {
          usesForm: 'Engagement & Scope Register',
          producesDeliverable: '01_Engagement_and_Scope_Register.md',
          outputHighlights: [{ text: '4', label: 'The scope is written, one line per fact.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w0-identity',
    role: 'platform',
    shared: true,
    week: 0,
    title: 'Make an MFA identity and the CLI',
    objective: 'Create a scoped identity with MFA for daily work and confirm the CLI runs as it, not the owner.',
    frameworks: ['ISO_27001'],
    deliverables: ['01_Engagement_and_Scope_Register.md'],
    estimatedTime: '40 min',
    difficulty: 1,
    learn: ['Scoped identity', 'MFA', 'CLI profiles', 'Least privilege'],
    tools: ['Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'A scoped identity with MFA exists',
      'The CLI runs as that identity',
      'The identity is recorded in the register',
    ],
    steps: [
      run(
        'ccsp-w0-identity-s1',
        'Confirm the CLI identity is scoped, not the owner',
        'Your own machine — a terminal',
        'Run the identity check and confirm the caller is the scoped user, not the account owner.',
        [
          { cmd: 'echo "caller: $(whoami)@cloud profile=engagement" && grep -q engagement ~/.cloud/config && echo "scoped profile active"', explain: 'Prints the active profile and confirms it is the scoped engagement profile, not the owner.', sample: 'caller: analyst@cloud profile=engagement\nscoped profile active' },
        ],
        ['scoped profile active'],
        'Every command carries an identity. Confirming it is scoped, not the owner, is how you know a mistake has limits.',
        {
          usesForm: 'Engagement & Scope Register',
          producesDeliverable: '01_Engagement_and_Scope_Register.md',
          outputHighlights: [{ text: 'scoped profile active', label: 'Daily work runs as a scoped identity.' }],
          fixes: [{ symptom: 'The profile is the owner?', fix: 'Create a scoped user with MFA, configure a CLI profile for it, and select that profile before any work.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w0-orient',
    role: 'data',
    shared: true,
    week: 0,
    title: 'Know your team, your focus and the folder',
    objective: 'Agree who leads which record, name the application, and make the evidence folder every artifact goes in.',
    frameworks: ['ISO_27001'],
    deliverables: ['01_Engagement_and_Scope_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'Naming', 'Evidence folders'],
    tools: ['Terminal', 'Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'The application has a name in the pattern ccsp-t<team>',
      'The evidence folder exists with a week-0 to week-4 layout',
    ],
    steps: [
      note(
        'ccsp-w0-orient-s1',
        'Pick the focus and name the application',
        'Anywhere — a team decision',
        'Agree who leads Data Security, Platform, Application Security and Governance. Name the application ccsp-t and your team number.',
        'Four names against four focuses, and an application name the whole team uses from now on.',
        {
          usesForm: 'Engagement & Scope Register',
          whatItMeans: 'A focus is the record a member leads and reviews, not the only work they do. Everyone runs the commands and everyone pastes output.',
        }
      ),
      run(
        'ccsp-w0-orient-s2',
        'Make the evidence folder',
        'Your own machine — a terminal',
        'Create the evidence folder with a subfolder for each week. Every policy, mapping and finding goes under the week it belongs to.',
        [
          { cmd: 'mkdir -p ccsp-t1/week-{0,1,2,3,4} && ls ccsp-t1', explain: 'Five week folders in one command, then reads them back. Replace t1 with your team number.', sample: 'week-0  week-1  week-2  week-3  week-4' },
        ],
        ['week-0', 'week-4'],
        'An artifact nobody can find is an artifact nobody can hash. The folder is the first custody control.',
        {
          usesForm: 'Engagement & Scope Register',
          producesDeliverable: '01_Engagement_and_Scope_Register.md',
        }
      ),
    ],
  },

  // ── Week 1 — Architecture and the law (domains 1 & 6) ────────────────────────
  {
    id: 'ccsp-w1-concepts',
    role: 'platform',
    shared: true,
    week: 1,
    title: 'The shared-responsibility line',
    objective: 'For each layer of the stack, mark who secures it — the provider or the customer — for the service model in scope.',
    frameworks: ['ISO_27001'],
    deliverables: ['02_Architecture_and_Responsibility.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Shared responsibility', 'IaaS vs PaaS vs SaaS', 'Service models', 'Trust boundaries'],
    tools: ['Deliverables forms', 'Terminal'],
    definitionOfDone: [
      'Each layer is marked provider or customer for the model in scope',
      'At least one layer is shown moving owner between service models',
      'The line is recorded in the architecture record',
    ],
    steps: [
      run(
        'ccsp-w1-concepts-s1',
        'Build the responsibility matrix',
        'Your own machine — a terminal',
        'Write each layer with who secures it under the service model in scope, then count the customer-owned layers.',
        [
          { cmd: 'printf \'data\\tcustomer\\napp\\tcustomer\\nruntime\\tprovider\\nos\\tprovider\\nnetwork\\tprovider\\n\' | tee responsibility.tsv | awk -F"\\t" \'$2=="customer"{c++} END{print c" customer-owned layers"}\'', explain: 'Writes the responsibility matrix and counts the layers the customer must secure.', sample: '2 customer-owned layers' },
        ],
        ['customer-owned'],
        'The shared-responsibility line is the first thing a cloud auditor asks for: it says exactly which controls are yours to run and which the provider runs.',
        {
          usesForm: 'Architecture & Responsibility',
          producesDeliverable: '02_Architecture_and_Responsibility.md',
          outputHighlights: [{ text: 'customer-owned', label: 'The layers the team must secure.' }],
        }
      ),
      note(
        'ccsp-w1-concepts-s2',
        'Show a layer moving between service models',
        'Architecture & Responsibility',
        'Pick one layer, such as the runtime, and show who owns it under IaaS versus PaaS versus SaaS.',
        'One layer with its owner written for all three service models, showing the line moves.',
        {
          usesForm: 'Architecture & Responsibility',
          whatItMeans: 'The responsibility line is not fixed: moving from IaaS to SaaS hands layers to the provider. Knowing which stops a team securing what is no longer theirs, or missing what is.',
        }
      ),
    ],
  },
  {
    id: 'ccsp-w1-architecture',
    role: 'platform',
    shared: true,
    week: 1,
    title: 'The reference architecture',
    objective: 'Name every component of the application, its trust boundary, and the data that crosses each boundary.',
    frameworks: ['ISO_27001'],
    deliverables: ['02_Architecture_and_Responsibility.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Reference architecture', 'Trust boundaries', 'Data flows', 'Threat surface'],
    tools: ['Deliverables forms', 'Terminal'],
    definitionOfDone: [
      'Every component is named with its trust zone',
      'Every boundary crossing names the data that crosses it',
      'The architecture is recorded with its boundaries',
    ],
    steps: [
      run(
        'ccsp-w1-architecture-s1',
        'List the components and their trust zones',
        'Your own machine — a terminal',
        'Write each component with its trust zone and confirm every tier is present.',
        [
          { cmd: 'printf \'edge\\tpublic\\napi\\tapp\\nqueue\\tapp\\ndb\\tprivate\\nkms\\tprivate\\n\' | tee components.tsv | awk -F"\\t" \'{z[$2]++} END{for (k in z) print k": "z[k]}\'', explain: 'Writes the components and counts how many sit in each trust zone.', sample: 'public: 1\napp: 2\nprivate: 2' },
        ],
        ['private'],
        'A component with no trust zone is a component nobody is defending. The zone decides which controls apply and what may talk to it.',
        {
          usesForm: 'Architecture & Responsibility',
          producesDeliverable: '02_Architecture_and_Responsibility.md',
          outputHighlights: [{ text: 'private', label: 'The components that must never face the public zone.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w1-legal',
    role: 'grc',
    shared: true,
    week: 1,
    title: 'The legal and compliance scope',
    objective: 'Map the obligations the application carries to a control framework, and name where the data may and may not live.',
    frameworks: ['ISO_27001'],
    deliverables: ['03_Legal_Risk_and_Compliance.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Legal obligations', 'Framework mapping', 'Data residency', 'Jurisdiction'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The control catalogue shipped with the course (controls.json)'],
    definitionOfDone: [
      'Each obligation maps to one or more controls in the framework',
      'The data-residency rule is stated with its jurisdiction',
      'The mapping is recorded in the compliance register',
    ],
    steps: [
      run(
        'ccsp-w1-legal-s1',
        'Map each obligation to a control',
        'Your own machine — a terminal',
        'Read the shipped control catalogue and list the controls that satisfy the data-protection obligation.',
        [
          { cmd: 'jq -r \'.controls[] | select(.obligations[]? == "data-protection") | "\\(.id)\\t\\(.title)"\' controls.json', explain: 'Selects from the catalogue the controls that satisfy the data-protection obligation.', sample: 'A.8.24\tUse of cryptography\nA.5.34\tPrivacy and protection of PII' },
        ],
        ['A.8.24'],
        'An obligation with no control mapped to it is a gap a regulator will find first. The mapping is what turns a law into something the team can actually do.',
        {
          usesForm: 'Legal, Risk & Compliance',
          producesDeliverable: '03_Legal_Risk_and_Compliance.md',
          outputHighlights: [{ text: 'A.8.24', label: 'A control that satisfies the obligation.' }],
          fixes: [{ symptom: 'jq is not found?', fix: 'Install jq from your package manager; it is a standard command-line JSON tool.' }],
        }
      ),
      note(
        'ccsp-w1-legal-s2',
        'State the data-residency rule',
        'Legal, Risk & Compliance',
        'Write where the data may live and where it must not, and the jurisdiction that decides it.',
        'A residency rule naming the allowed region, the forbidden ones and the law that sets it.',
        {
          usesForm: 'Legal, Risk & Compliance',
          whatItMeans: 'Data residency is where cloud law bites hardest: a backup replicated to the wrong region can breach the obligation before anyone notices.',
        }
      ),
    ],
  },

  // ── Week 2 — Cloud data security (domain 2) ──────────────────────────────────
  {
    id: 'ccsp-w2-classify',
    role: 'data',
    shared: true,
    week: 2,
    title: 'Classify the data',
    objective: 'Give every data set in the inventory a classification, and confirm nothing is left unclassified.',
    frameworks: ['ISO_27001'],
    deliverables: ['04_Data_Security_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Data classification', 'Data inventory', 'PII', 'Handling rules'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The data inventory shipped with the course (inventory.csv)'],
    definitionOfDone: [
      'Every data set has a classification',
      'No row is left unclassified',
      'The classification is recorded with its handling rule',
    ],
    steps: [
      run(
        'ccsp-w2-classify-s1',
        'Confirm nothing is unclassified',
        'Your own machine — a terminal',
        'Read the data inventory and count any row whose classification column is empty.',
        [
          { cmd: 'awk -F, \'NR>1 && $3=="" {u++} END{print (u+0)" unclassified rows"}\' inventory.csv', explain: 'Counts inventory rows with no classification; zero is the goal.', sample: '0 unclassified rows' },
        ],
        ['unclassified rows'],
        'An unclassified data set is one nobody knows how to protect. Classification is the control every data rule hangs off.',
        {
          usesForm: 'Data Security Record',
          producesDeliverable: '04_Data_Security_Record.md',
          outputHighlights: [{ text: '0 unclassified rows', label: 'Every data set is classified.' }],
          fixes: [{ symptom: 'More than zero?', fix: 'Classify each empty row in the inventory — public, internal, confidential or restricted — then re-run.' }],
        }
      ),
      run(
        'ccsp-w2-classify-s2',
        'Count the restricted data that drives the controls',
        'Your own machine — a terminal',
        'Count the rows classified restricted, since those set the strongest handling rules.',
        [
          { cmd: 'awk -F, \'NR>1 && $3=="restricted" {r++} END{print (r+0)" restricted data sets"}\' inventory.csv', explain: 'Counts the restricted data sets that drive encryption and access rules.', sample: '3 restricted data sets' },
        ],
        ['restricted'],
        'The restricted rows decide the strongest controls. Counting them tells the team how much of the build is high-stakes.',
        {
          usesForm: 'Data Security Record',
          producesDeliverable: '04_Data_Security_Record.md',
        }
      ),
    ],
  },
  {
    id: 'ccsp-w2-protect',
    role: 'data',
    shared: true,
    week: 2,
    title: 'Encrypt it and lock the store',
    objective: 'Confirm the data store encrypts at rest and refuses a public grant, so classified data cannot land in the open.',
    frameworks: ['ISO_27001'],
    deliverables: ['04_Data_Security_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Encryption at rest', 'Public-access block', 'In-transit encryption', 'Store policy'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The store configuration shipped with the course (store.json)'],
    definitionOfDone: [
      'The store encrypts at rest, confirmed',
      'Public access is blocked, confirmed',
      'The protection is recorded',
    ],
    steps: [
      run(
        'ccsp-w2-protect-s1',
        'Confirm encryption and no public access',
        'Your own machine — a terminal',
        'Read the store configuration and confirm encryption is on and public access is blocked.',
        [
          { cmd: 'jq -r \'"encryption: \\(.encryption.atRest)  public: \\(.publicAccess)"\' store.json', explain: 'Prints whether the store encrypts at rest and whether public access is allowed.', sample: 'encryption: aws:kms  public: blocked' },
        ],
        ['blocked'],
        'An encrypted store that still allows a public grant is one bad policy away from a breach. The two controls together are what keep classified data in.',
        {
          usesForm: 'Data Security Record',
          producesDeliverable: '04_Data_Security_Record.md',
          outputHighlights: [{ text: 'blocked', label: 'Public access is off and encryption is on.' }],
          fixes: [{ symptom: 'public is not blocked?', fix: 'Turn Block Public Access fully on and re-export the store configuration, then re-run.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w2-keys',
    role: 'data',
    shared: true,
    week: 2,
    title: 'Own the key and the lifecycle',
    objective: 'Confirm the key is customer-owned with rotation on, and record the key-ownership decision and the retention rule.',
    frameworks: ['ISO_27001'],
    deliverables: ['04_Data_Security_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Key ownership', 'BYOK vs provider keys', 'Rotation', 'Retention and deletion'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The key configuration shipped with the course (key.json)'],
    definitionOfDone: [
      'The key is customer-owned with rotation on',
      'A retention and deletion rule is recorded',
      'The key-ownership decision is recorded with the option rejected',
    ],
    steps: [
      run(
        'ccsp-w2-keys-s1',
        'Confirm the key is customer-owned and rotates',
        'Your own machine — a terminal',
        'Read the key configuration and confirm the manager is the customer and rotation is on.',
        [
          { cmd: 'jq -r \'"manager: \\(.manager)  rotation: \\(.rotation)"\' key.json', explain: 'Prints who manages the key and whether rotation is enabled.', sample: 'manager: customer  rotation: enabled' },
        ],
        ['customer'],
        'A customer-owned key is one you set the policy on and can rotate, disable and destroy. A provider key gives none of that control to prove.',
        {
          usesForm: 'Data Security Record',
          producesDeliverable: '04_Data_Security_Record.md',
          outputHighlights: [{ text: 'customer', label: 'The key is the team\u2019s to govern.' }],
        }
      ),
      note(
        'ccsp-w2-keys-s2',
        'Record the key-ownership decision',
        'Data Security Record',
        'With the residency and obligation in front of the team, record the key decision: a provider key, a customer-owned key, or hold-your-own-key.',
        'A recorded decision with its reason, the option rejected and the accepted risk.',
        {
          usesForm: 'Data Security Record',
          whatItMeans: 'The key decision is the drafter\u2019s to make and own. Writing the rejected option proves a choice was made, not defaulted into.',
        }
      ),
    ],
  },

  // ── Week 3 — Platform and application security (domains 3 & 4) ────────────────
  {
    id: 'ccsp-w3-platform',
    role: 'platform',
    shared: true,
    week: 3,
    title: 'Secure the platform',
    objective: 'Run the platform baseline against the catalogue and confirm every must-pass control passes.',
    frameworks: ['ISO_27001'],
    deliverables: ['05_Platform_and_Network_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Platform baseline', 'CIS benchmarks', 'Configuration scanning', 'Hardening'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The baseline results shipped with the course (baseline.json)'],
    definitionOfDone: [
      'Every must-pass control is checked',
      'Any failing control has an owner and a fix',
      'The baseline result is recorded',
    ],
    steps: [
      run(
        'ccsp-w3-platform-s1',
        'Find the failing baseline controls',
        'Your own machine — a terminal',
        'Read the baseline results and list any control that failed, so each gets an owner.',
        [
          { cmd: 'jq -r \'.checks[] | select(.result=="fail") | "\\(.id)\\t\\(.title)"\' baseline.json; echo "scan complete"', explain: 'Lists the failing baseline checks; an empty list before "scan complete" means a clean baseline.', sample: 'CIS-2.1.1\tEnsure logging is enabled\nscan complete' },
        ],
        ['scan complete'],
        'A baseline you never scanned is a baseline you are only hoping holds. The failing list is the work; the clean scan is the proof.',
        {
          usesForm: 'Platform & Network Record',
          producesDeliverable: '05_Platform_and_Network_Record.md',
          outputHighlights: [{ text: 'scan complete', label: 'The baseline was scanned, pass or fail recorded.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w3-network',
    role: 'platform',
    shared: true,
    week: 3,
    title: 'Segment the network',
    objective: 'Confirm the private tier has no public route and the app tier reaches only what it must.',
    frameworks: ['ISO_27001'],
    deliverables: ['05_Platform_and_Network_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Network segmentation', 'Micro-segmentation', 'Least connectivity', 'Egress control'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The network configuration shipped with the course (network.json)'],
    definitionOfDone: [
      'The private tier has no public route',
      'Each allowed flow has a reason',
      'The segmentation is recorded',
    ],
    steps: [
      run(
        'ccsp-w3-network-s1',
        'Prove the private tier has no public route',
        'Your own machine — a terminal',
        'Read the network configuration and confirm the private tier\u2019s routes never reach the public gateway.',
        [
          { cmd: 'jq -r \'.tiers.private.routes[]\' network.json | grep -q public && echo "LEAK: public route" || echo "private tier has no public route"', explain: 'Checks the private tier routes for any public path; the safe result names no leak.', sample: 'private tier has no public route' },
        ],
        ['no public route'],
        'A private tier with a public route is not private. The route table, not the subnet name, is where segmentation is really enforced.',
        {
          usesForm: 'Platform & Network Record',
          producesDeliverable: '05_Platform_and_Network_Record.md',
          outputHighlights: [{ text: 'no public route', label: 'The private tier is sealed from the internet.' }],
          fixes: [{ symptom: 'LEAK: public route?', fix: 'Remove the public route from the private tier and route egress through a controlled gateway, then re-run.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w3-appsec',
    role: 'appsec',
    shared: true,
    week: 3,
    title: 'Secure the application',
    objective: 'Confirm the application has no hard-coded secret and no critical dependency vulnerability before it ships.',
    frameworks: ['ISO_27001'],
    deliverables: ['06_Application_Security_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Secure SDLC', 'Secrets in code', 'Dependency scanning', 'SAST'],
    tools: ['grep', 'jq', 'Deliverables forms'],
    prerequisites: ['The sample source and dependency manifest shipped with the course'],
    definitionOfDone: [
      'No hard-coded secret is found in the source',
      'No critical dependency vulnerability remains',
      'The scans are recorded',
    ],
    steps: [
      run(
        'ccsp-w3-appsec-s1',
        'Scan the source for hard-coded secrets',
        'Your own machine — a terminal',
        'Grep the sample source for anything that looks like a key or password, and confirm none is found.',
        [
          { cmd: 'grep -rniE "(secret|password|api[_-]?key)\\s*=\\s*[\\"\\x27][^\\"\\x27]+" src/ && echo "SECRET FOUND" || echo "no hard-coded secret"', explain: 'Searches the source for assigned secrets; the safe result finds none.', sample: 'no hard-coded secret' },
        ],
        ['no hard-coded secret'],
        'A secret in code is a secret in every clone, log and backup forever. Finding none before the build ships is the control.',
        {
          usesForm: 'Application Security Record',
          producesDeliverable: '06_Application_Security_Record.md',
          outputHighlights: [{ text: 'no hard-coded secret', label: 'The source is clean of inline secrets.' }],
          fixes: [{ symptom: 'SECRET FOUND?', fix: 'Move it to a secrets manager or an environment variable, rotate the exposed value, and re-run.' }],
        }
      ),
      run(
        'ccsp-w3-appsec-s2',
        'Scan the dependencies for critical vulnerabilities',
        'Your own machine — a terminal',
        'Read the dependency scan report and count any critical finding that must be fixed before shipping.',
        [
          { cmd: 'jq -r \'[.vulnerabilities[] | select(.severity=="critical")] | length | "\\(.) critical vulnerabilities"\' scan.json', explain: 'Counts critical dependency vulnerabilities; zero is the ship gate.', sample: '0 critical vulnerabilities' },
        ],
        ['critical vulnerabilities'],
        'Most breaches ride in on a known-vulnerable dependency. The critical count is the gate: zero before the application ships.',
        {
          usesForm: 'Application Security Record',
          producesDeliverable: '06_Application_Security_Record.md',
        }
      ),
    ],
  },

  // ── Week 4 — Operations and compliance (domains 5 & 6) ───────────────────────
  {
    id: 'ccsp-w4-operations',
    role: 'grc',
    shared: true,
    week: 4,
    title: 'Run security operations',
    objective: 'Confirm monitoring is on and a change goes through a recorded, reversible process.',
    frameworks: ['ISO_27001'],
    deliverables: ['07_Operations_and_Incident_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Monitoring', 'Change management', 'Logging', 'Operational controls'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The operations configuration shipped with the course (ops.json)'],
    definitionOfDone: [
      'Monitoring and alerting are confirmed on',
      'A change is recorded with its rollback',
      'The operations state is recorded',
    ],
    steps: [
      run(
        'ccsp-w4-operations-s1',
        'Confirm monitoring is on and alerts route',
        'Your own machine — a terminal',
        'Read the operations configuration and confirm logging is on and an alert has a destination.',
        [
          { cmd: 'jq -r \'"logging: \\(.logging)  alert: \\(.alerting.destination)"\' ops.json', explain: 'Prints whether logging is on and where alerts route; a destination means they reach a human.', sample: 'logging: enabled  alert: secops-oncall' },
        ],
        ['enabled'],
        'Operations is where a control baseline keeps living after the build. Logging with a real alert destination is what makes it detect, not just record.',
        {
          usesForm: 'Operations & Incident Log',
          producesDeliverable: '07_Operations_and_Incident_Log.md',
          outputHighlights: [{ text: 'enabled', label: 'Monitoring is on and alerts route to a human.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w4-incident',
    role: 'grc',
    shared: true,
    week: 4,
    title: 'Work the incident',
    objective: 'Work a real incident the method way: one theory, one containment action, one result per row, until it is contained.',
    frameworks: ['ISO_27001'],
    deliverables: ['07_Operations_and_Incident_Log.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['Incident response', 'Containment', 'One change at a time', 'Lessons learned'],
    tools: ['jq', 'Deliverables forms'],
    prerequisites: ['The alert detail shipped with the course (alert.json)'],
    definitionOfDone: [
      'The incident is written exactly, before any action',
      'Every step is a row: theory, the one action, the result',
      'At least one action did not contain it and the row says so',
      'The incident is contained and the lesson is recorded',
    ],
    steps: [
      note(
        'ccsp-w4-incident-s1',
        'Write the incident exactly',
        'Operations & Incident Log',
        'Before any action, write what happened from the alert: the actor, the resource, the action, and why it is an incident.',
        'The log opens with the actor, the resource, the unauthorized action and why it is an incident, and no action yet.',
        {
          usesForm: 'Operations & Incident Log',
          whatItMeans: 'The method starts with the incident written down. For a cloud incident the symptom is the exact alert, not a feeling that something is off.',
        }
      ),
      run(
        'ccsp-w4-incident-s2',
        'Read the alert, then contain it one action per row',
        'Your own machine — a terminal',
        'Read the alert detail, write one containment theory, take one action, and record the result. An action that does not contain it gets its own row.',
        [
          { cmd: 'jq -r \'"actor: \\(.actor)  action: \\(.action)  resource: \\(.resource)"\' alert.json && echo "theory: revoke the session → contained"', explain: 'Reads the alert facts the incident is worked from, then records the first containment theory and its result.', sample: 'actor: svc-quote  action: GetObject  resource: restricted-bucket\ntheory: revoke the session → contained' },
        ],
        ['contained'],
        'One action per row is what makes the log trustworthy: you can always say which action contained it. The same method A+ uses on hardware.',
        {
          usesForm: 'Operations & Incident Log',
          producesDeliverable: '07_Operations_and_Incident_Log.md',
          outputHighlights: [{ text: 'contained', label: 'The first containment action and its result.' }],
          fixes: [{ symptom: 'Revoking the session did not contain it?', fix: 'Next row: rotate the service credential, one change, and re-check whether the calls stop.' }],
        }
      ),
    ],
  },
  {
    id: 'ccsp-w4-handover',
    role: 'grc',
    shared: true,
    week: 4,
    title: 'Hand the baseline over',
    objective: 'Map every control to the evidence that proves it, list the open risks, and hash every artifact for custody.',
    frameworks: ['ISO_27001'],
    deliverables: ['08_Cloud_Security_Handover.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Control-to-evidence mapping', 'Risk register', 'Chain of custody', 'Hashing evidence'],
    tools: ['Terminal', 'Deliverables forms'],
    prerequisites: ['Every other record of the course, filled'],
    definitionOfDone: [
      'Every control maps to the artifact that proves it',
      'Each open risk has an owner and a mitigation',
      'Every artifact has a custody row with its hash',
    ],
    steps: [
      note(
        'ccsp-w4-handover-s1',
        'Map every control to its evidence',
        'Cloud Security Handover',
        'Write the baseline in one page: each control across data, platform, application and operations, and the artifact in the evidence folder that proves it.',
        'A one-page baseline where every control points at the artifact that proves it, and each open risk has an owner.',
        {
          usesForm: 'Cloud Security Handover',
          whatItMeans: 'A control with no evidence is a claim. The control-to-evidence map is what an auditor and the next team both read first.',
        }
      ),
      run(
        'ccsp-w4-handover-s2',
        'Hash every artifact for custody',
        'Your own machine — a terminal',
        'Hash every file in the evidence folder so the handover carries a custody row that proves what was delivered.',
        [
          { cmd: 'find ccsp-t1 -type f -exec sha256sum {} + | tee week-4/custody.txt | wc -l && echo "custody.txt written"', explain: 'Hashes every artifact and counts them, writing the custody list for the record.', sample: '19\ncustody.txt written' },
        ],
        ['custody.txt'],
        'A hash is what lets anyone, months later, prove the control evidence in hand is the one delivered. It is the last control of the course.',
        {
          usesForm: 'Cloud Security Handover',
          producesDeliverable: '08_Cloud_Security_Handover.md',
          outputHighlights: [{ text: 'custody.txt', label: 'Every artifact hashed into one custody list.' }],
        }
      ),
    ],
  },
];

export const CCSP: Course = withModules(withAiExtensions(withPortfolioStep({
  id: 'ccsp',
  title: 'CCSP — the Cloud Assurance',
  slug: 'ccsp',
  description:
    'Secure one small cloud application across its lifecycle and govern it: shared responsibility and the law, classified data under its own key, a fenced platform, a secure build, operations and an incident, handed over control-by-control. Built for CCSP.',
  vendor: 'ISC2',
  certification: 'CCSP',
  level: 'professional',
  audience:
    'Secure and govern one small cloud application as a four-person team — everyone runs the commands, pastes the proof and fills every record; the focus decides which record you lead.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  // One shared engagement: every member works every task, and the focus is the
  // record they lead and review.
  sharedTrack: true,
  // No week locks. A team waiting on a sample artifact still works the weeks it can.
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  // The assurance picture: the scope, the architecture, the data, the platform,
  // the application, operations, and the records lane. From `ccspContent.ts`.
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Set up', detail: 'The account with a budget guard, an MFA identity, the scope.' },
    { label: 'Identify', detail: 'Shared responsibility, the architecture, and the law.' },
    { label: 'Protect', detail: 'Classify the data, encrypt it, own the key.' },
    { label: 'Build', detail: 'A fenced platform and a secure application build.' },
    { label: 'Operate', detail: 'Monitoring, change management, and an incident worked.' },
    { label: 'Hand over', detail: 'Every control mapped to its evidence, with custody.' },
  ],
  isSeed: true,
  version: 1,
})));
