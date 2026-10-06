import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

// SecAI+ capstone (CompTIA CY0-001): "Four Releases" (R101).
//
// The team is the security function for the Ridgeline Service Hub's AI — a
// customer assistant, a dispatch agent, a document reader and a failure
// predictor. Every week runs the same loop (Map → Attack → Defend → Watch →
// Govern → Release) and ships a complete release of the same five documents
// (P1–P5) plus a signed release note. The spec is written for one learner;
// the platform's three-role shape splits the loop:
//
//   AI Red Team         Attack       P2 Attack casebook
//   AI Defender         Defend+Watch P3 Control set · P4 Watch plan
//   AI Governance Lead  Map+Govern   P1 System map · P5 Governance pack · Release note
//
// Every attack runs only against the team's own lab instance (the signed lab
// rule, R1). The starter kit the spec names (Service Hub Lite) is not built
// yet, so the lab stand-in is a small open-weight model in Ollama behind a
// LiteLLM gateway; each step that needs the starter says so. Forms live in
// docs/secaiDeliverables.ts; the picture in docs/secaiContent.ts.

const roles: RoleDef[] = [
  { id: 'redteam', name: 'AI Red Team', mission: 'Test the Hub’s AI on your own instance and prove each case.', color: '#dc2626', icon: 'Bug', label: '🧪 AI Red Team' },
  { id: 'defender', name: 'AI Defender', mission: 'Build the controls, logging and alerts that stop and catch each case.', color: '#2563eb', icon: 'ShieldCheck', label: '🛡️ AI Defender' },
  { id: 'governance', name: 'AI Governance Lead', mission: 'Map the system, own the risks and rules, and sign each release.', color: '#16a34a', icon: 'ClipboardList', label: '📋 AI Governance Lead' },
];

const weeks: WeekDef[] = [
  { number: 0, title: 'Lab and ground rules', theme: 'Agree the rules', objective: 'Sign the lab rule, open the ledger, and capture the product as found.',
    setup: true, stage: 0, phase: 'Set up', difficulty: 1,
    objectives: [
      { id: 'sign-the-lab-rule-and-open-the-ledger', label: 'Sign the lab rule and open the ledger', tasks: ['sa-w0-gov'] },
      { id: 'run-the-hub-as-found', label: 'Run the Service Hub stand-in as found', tasks: ['sa-w0-def'] },
      { id: 'capture-the-baseline', label: 'Capture the baseline transcripts', tasks: ['sa-w0-red'] },
    ],
    milestone: 'Every member has signed the lab rule, the ledger is open, and five baseline transcripts are hashed into it.' },
  { number: 1, title: 'Release v1', theme: 'Minimum viable security', objective: 'Ship the smallest complete release: two attacks proven, blocked and logged, and no secret in a prompt.',
    stage: 1, phase: 'Minimum viable security', difficulty: 2,
    objectives: [
      { id: 'map-the-system-and-sign-v1', label: 'Map the system, write the rules, sign v1', tasks: ['sa-w1-gov'] },
      { id: 'prove-two-attack-cases', label: 'Prove two attack cases with evidence', tasks: ['sa-w1-red'] },
      { id: 'close-sa-1-and-log-every-attempt', label: 'Close SA-1 and log every attempt', tasks: ['sa-w1-def'] },
    ],
    milestone: '2 attacks in the suite, 2 blocked, 2 found in the logs. No secret in any prompt. SA-1 closed, SA-6 flagged. Release note v1 signed, ledger clean.' },
  { number: 2, title: 'Release v2', theme: 'Full coverage', objective: 'Cover all six attack cases: guardrails, a scoped agent, redacted logs and owned alert thresholds.',
    stage: 2, phase: 'Full coverage', difficulty: 3,
    objectives: [
      { id: 'six-cases-and-the-threat-model', label: 'Six cases and a mapped threat model', tasks: ['sa-w2-red'] },
      { id: 'guard-scope-and-redact', label: 'Guard the inputs, scope the agent, redact the logs', tasks: ['sa-w2-def'] },
      { id: 'map-the-data-and-the-rules', label: 'Map the data and every rule that applies', tasks: ['sa-w2-gov'] },
    ],
    milestone: '6 attacks in the suite, 4 or more blocked or contained, all 6 in the logs. The agent holds no admin right; no tenant names or access codes in logs. Release note v2 signed.' },
  { number: 3, title: 'Release v3', theme: 'Automated and measured', objective: 'Make the suite a pipeline test, alert on all six cases, and measure accuracy.',
    stage: 3, phase: 'Automated and measured', difficulty: 3,
    objectives: [
      { id: 'gate-the-pipeline-and-alert', label: 'Gate the pipeline and alert on every case', tasks: ['sa-w3-def'] },
      { id: 'automate-the-suite-and-check-ai-help', label: 'Automate the suite and check AI-assisted work', tasks: ['sa-w3-red'] },
      { id: 'find-shadow-ai-and-audit-accuracy', label: 'Find shadow AI and measure accuracy', tasks: ['sa-w3-gov'] },
    ],
    milestone: 'The 6-case suite runs in the pipeline; a removed guardrail blocks the build and one rollback is recorded. All 6 attempts alert. SA-7 closed. Release note v3 signed.' },
  { number: 4, title: 'Release v4', theme: 'Proven and handed over', objective: 'Rebuild clean, prove the same results, and hand customers evidence-backed answers.',
    stage: 4, phase: 'Proven and handed over', difficulty: 3,
    objectives: [
      { id: 'rebuild-clean-and-hand-over', label: 'Rebuild clean and hand over monitoring', tasks: ['sa-w4-def'] },
      { id: 'reproduce-and-add-paper-cases', label: 'Reproduce the suite and add four paper cases', tasks: ['sa-w4-red'] },
      { id: 'accept-the-risks-and-answer-customers', label: 'Accept the risks and answer the customers', tasks: ['sa-w4-gov'] },
    ],
    milestone: 'The rebuilt copy matches v3 and alerts on all 6. All 8 planted weaknesses closed or accepted in writing. The assurance response cites the ledger.' },
];

// No gatekeeping (the instructor's rule for this course): every week is open
// from the start. The gates still mark each release, and each names one task
// per role, so the Home tab can say which release the team has signed.
const gates: Gate[] = [
  { id: 1, week: 1, title: 'Release v1 signed', description: 'Two attacks proven, blocked and logged; no secret in any prompt; the CEO has signed the release note.',
    requiredArtifactTypes: ['07_Release_Note.md'], requiredTasks: ['sa-w1-gov', 'sa-w1-red', 'sa-w1-def'],
    handoffs: [{ from: 'redteam', to: 'defender', artifact: 'Attack casebook', label: 'Red Team → Defender: what to block and log' }] },
  { id: 2, week: 2, title: 'Release v2 signed', description: 'All six cases in the suite, four or more contained, all six logged; the agent holds no admin right.',
    requiredArtifactTypes: ['04_Control_Set.md'], requiredTasks: ['sa-w2-gov', 'sa-w2-red', 'sa-w2-def'],
    handoffs: [{ from: 'defender', to: 'governance', artifact: 'Control set', label: 'Defender → Governance: controls for the risk register' }] },
  { id: 3, week: 3, title: 'Release v3 signed', description: 'The suite runs in the pipeline, a removed guardrail blocks the build, and every case alerts.',
    requiredArtifactTypes: ['05_Watch_Plan.md'], requiredTasks: ['sa-w3-gov', 'sa-w3-red', 'sa-w3-def'],
    handoffs: [{ from: 'redteam', to: 'defender', artifact: 'Automated suite', label: 'Red Team → Defender: the pipeline regression test' }] },
];

const DOCS = {
  owaspLlm: { title: 'OWASP Top 10 for LLM Applications', url: 'https://genai.owasp.org/llm-top-10/', lookFor: 'the entry each case maps to, and its prevention list' },
  atlas: { title: 'MITRE ATLAS', url: 'https://atlas.mitre.org/', lookFor: 'the technique ID that matches each case' },
  aiRmf: { title: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', lookFor: 'the Govern, Map, Measure and Manage functions' },
  csf: { title: 'NIST Cybersecurity Framework 2.0', url: 'https://www.nist.gov/cyberframework', lookFor: 'the function each step of the loop maps to' },
  ollama: { title: 'Ollama Modelfile reference', url: 'https://github.com/ollama/ollama/blob/main/docs/modelfile.md', lookFor: 'SYSTEM and PARAMETER instructions' },
  litellm: { title: 'LiteLLM proxy: budgets and rate limits', url: 'https://docs.litellm.ai/docs/proxy/users', lookFor: 'rpm_limit and tpm_limit per key' },
  openbao: { title: 'OpenBao KV secrets engine', url: 'https://openbao.org/docs/secrets/kv/', lookFor: 'kv put, kv get, and versioning' },
  gitleaks: { title: 'Gitleaks', url: 'https://github.com/gitleaks/gitleaks', lookFor: 'detect --no-git, and the exit code on a leak' },
  garak: { title: 'garak LLM vulnerability scanner', url: 'https://github.com/NVIDIA/garak', lookFor: 'running a named probe set against an Ollama model' },
  llmGuard: { title: 'LLM Guard input scanners', url: 'https://protectai.github.io/llm-guard/input_scanners/prompt_injection/', lookFor: 'what scan() returns and the threshold' },
  presidio: { title: 'Microsoft Presidio', url: 'https://microsoft.github.io/presidio/', lookFor: 'adding a custom PatternRecognizer' },
  wazuh: { title: 'Wazuh custom rules', url: 'https://documentation.wazuh.com/current/user-manual/ruleset/rules/custom.html', lookFor: 'rule level, match and frequency' },
  semgrep: { title: 'Semgrep CLI', url: 'https://semgrep.dev/docs/cli-reference', lookFor: 'the --error flag for a blocking gate' },
  trivy: { title: 'Trivy filesystem scanning', url: 'https://trivy.dev/latest/docs/target/filesystem/', lookFor: '--exit-code and --severity' },
  zeek: { title: 'Zeek dns.log', url: 'https://docs.zeek.org/en/master/logs/dns.html', lookFor: 'the query field' },
  modelscan: { title: 'ModelScan', url: 'https://github.com/protectai/modelscan', lookFor: 'which serialisation formats it checks' },
  threatDragon: { title: 'OWASP Threat Dragon', url: 'https://www.threatdragon.com/docs/', lookFor: 'drawing trust boundaries and adding STRIDE threats' },
  iso42001: { title: 'ISO/IEC 42001 AI management system', url: 'https://www.iso.org/standard/81230.html', lookFor: 'the scope and the management-system clauses' },
  prowler: { title: 'Prowler', url: 'https://docs.prowler.com/', lookFor: 'running a scan and reading the compliance output' },
  modelcard: { title: 'Model cards', url: 'https://huggingface.co/docs/hub/model-cards', lookFor: 'the sections a model card should carry' },
};

const tasks: Task[] = [
  // ── Week 0 — Lab and ground rules ─────────────────────────────────────────
  {
    id: 'sa-w0-gov', role: 'governance', week: 0,
    title: 'Sign the lab rule and open the evidence ledger',
    objective: 'Agree in writing that attacks run only on your own instance, and start the ledger every artifact is hashed into.',
    frameworks: ['SECAI', 'NIST_CSF'], deliverables: ['01_Lab_Rule_and_Ledger.md'], estimatedTime: '30 min',
    learn: ['Authorisation before testing', 'Why a hash plus a timestamp is evidence'],
    tools: ['Git', 'sha256sum'], docs: [DOCS.csf],
    definitionOfDone: ['Lab rule signed by every member (R1)', 'Ledger repository opened (R2)'],
    handoff: [{ to: 'redteam', artifact: 'Signed lab rule', note: 'No attack runs before every member has signed.' }],
    steps: [
      {
        id: 'sa-w0-gov-s1', title: 'Sign the lab rule', description: 'Record the boundary every attack stays inside.',
        instruction: 'In the Lab Rule & Evidence Ledger form, name your team’s lab instance and have every member sign that attacks run only there.',
        usesForm: 'Lab Rule & Evidence Ledger',
        whatItMeans: 'Testing a system you do not own is illegal, however good the intent. The signed rule is the authorisation every later attack case rests on.',
        frameworks: ['SECAI'],
      },
      {
        id: 'sa-w0-gov-s2', title: 'Open the evidence ledger', description: 'A Git repository is the time-stamped record.',
        commands: [{
          cmd: 'git init ridgeline-evidence && cd ridgeline-evidence && git commit --allow-empty -m "ledger opened"',
          explain: 'Creates the repository the ledger lives in and makes its first commit, so every later artifact has a dated place in history.',
          sample: 'Initialized empty Git repository in /home/student/ridgeline-evidence/.git/\n[main (root-commit) 3f2a1c0] ledger opened',
        }],
        whatItMeans: 'Each commit is a timestamp nobody can quietly change. With a file hash per artifact, the ledger proves what existed and when.',
        frameworks: ['NIST_CSF'],
        verify: ['Initialized empty Git repository', 'ledger opened'],
      },
    ],
  },
  {
    id: 'sa-w0-def', role: 'defender', week: 0,
    title: 'Run the Service Hub stand-in as found',
    objective: 'Bring up the assistant exactly as found, planted weaknesses included, so every later fix has a before.',
    frameworks: ['SECAI'], deliverables: [], estimatedTime: '45 min',
    learn: ['Open-weight models run locally', 'A system prompt is configuration, not a secret store'],
    tools: ['Ollama'], docs: [DOCS.ollama],
    definitionOfDone: ['Model pulled and listed', 'Assistant created from the as-found Modelfile and answering'],
    steps: [
      {
        id: 'sa-w0-def-s1', title: 'Pull a small open-weight model', description: 'The lab model runs on the machine; no data leaves it.',
        commands: [{
          cmd: 'ollama pull llama3.2:3b && ollama list',
          explain: 'Downloads a 3-billion-parameter model that runs in 16 GB of memory without a GPU, then lists what is installed.',
          sample: 'NAME           ID              SIZE      MODIFIED\nllama3.2:3b    a80c4f17acd5    2.0 GB    5 seconds ago',
        }],
        whatItMeans: 'Production uses a third-party model API; the lab uses a local model so attacks and data stay on your machine.',
        frameworks: ['SECAI'],
        verify: ['llama3.2:3b'],
      },
      {
        id: 'sa-w0-def-s2', title: 'Create the assistant as found', description: 'The as-found system prompt, weaknesses included.',
        instruction: 'Until Service Hub Lite ships, use the instructor’s as-found Modelfile. It carries the planted SA-1 prompt.',
        commands: [{
          cmd: 'ollama create hub-assistant -f Modelfile && ollama run hub-assistant "Which filter does the RTU-40 take?"',
          explain: 'Builds the assistant from the as-found Modelfile, then asks it one ordinary question.',
          sample: 'transferring model data\nusing existing layer sha256:dde5aa3fc5ff\ncreating new layer sha256:6c1e2f0a9b1d\nwriting manifest\nsuccess\nThe RTU-40 takes two 20x25x2 MERV 13 filters (manual section 4.2).',
        }],
        whatItMeans: 'Securing a system starts from what is actually running. Every control you add later is measured against this as-found copy.',
        frameworks: ['SECAI'],
        verify: ['success'],
      },
    ],
  },
  {
    id: 'sa-w0-red', role: 'redteam', week: 0,
    title: 'Capture the baseline transcripts',
    objective: 'Record five ordinary questions and answers from the product as found, and hash them into the ledger.',
    frameworks: ['SECAI'], deliverables: [], estimatedTime: '30 min',
    prerequisites: ['Lab rule signed by every member'],
    learn: ['A baseline is what normal looks like', 'Hashing a transcript freezes it'],
    tools: ['Ollama', 'sha256sum'], docs: [DOCS.ollama],
    definitionOfDone: ['Five baseline transcripts saved (R3)', 'Their hashes appended to the ledger'],
    steps: [
      {
        id: 'sa-w0-red-s1', title: 'Ask five ordinary questions', description: 'Normal use, saved word for word.',
        instructionList: ['Ask about a manual, a building record, a contract term, a work order and a schedule.', 'Save each answer as baseline-01.txt to baseline-05.txt.'],
        commands: [{
          cmd: 'ollama run hub-assistant "What does the RTU-40 maintenance schedule say?" | tee baseline-01.txt',
          explain: 'Asks one question and writes the answer to a file while showing it on screen.',
          sample: 'The RTU-40 maintenance schedule calls for filter changes every 90 days and a coil inspection each spring.',
        }],
        whatItMeans: 'You cannot say an attack changed the product’s behaviour without a record of how it behaved before.',
        frameworks: ['SECAI'],
        verify: ['RTU-40'],
      },
      {
        id: 'sa-w0-red-s2', title: 'Hash them into the ledger', description: 'One line per transcript.',
        commands: [{
          cmd: 'sha256sum baseline-*.txt >> ledger.sha256 && tail -n 2 ledger.sha256',
          explain: 'Appends a SHA-256 hash for each transcript to the ledger file and shows the last two lines.',
          sample: '9b1c4e7f0a2d6c8b3e5f7a9c1d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e  baseline-04.txt\n4e7d2a9c8b1f0e3d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d  baseline-05.txt',
        }],
        whatItMeans: 'A hash changes if a single character changes, so the ledger proves the transcripts you cite later are the ones you captured today.',
        frameworks: ['SECAI'],
        verify: ['baseline-05.txt'],
      },
    ],
  },

  // ── Week 1 — Release v1, minimum viable security ──────────────────────────
  {
    id: 'sa-w1-gov', role: 'governance', week: 1,
    title: 'Map the system, write the rules, sign v1',
    objective: 'Write P1 and P5 at v1, assemble the release note, and get the CEO’s signature.',
    frameworks: ['SECAI', 'NIST_AI_RMF', 'NIST_CSF'], deliverables: ['02_System_Map.md', '06_Governance_Pack.md', '07_Release_Note.md'], estimatedTime: '2 hours',
    learn: ['Model types and how each was trained or tuned', 'Zero-, one- and multi-shot prompts', 'Policy “shall” statements'],
    tools: ['draw.io or Mermaid', 'Git'], docs: [DOCS.aiRmf, DOCS.csf],
    definitionOfDone: ['P1 v1 lists every model, the prompt structure and the data writers', 'SA-6 flagged', 'P5 v1 has five shall statements and five owned risks', 'Release note v1 signed'],
    consumes: [{ from: 'redteam', artifact: 'Attack casebook v1', note: 'The scoreboard counts these cases.' }, { from: 'defender', artifact: 'Control set v1', note: 'The release note lists what shipped.' }],
    steps: [
      {
        id: 'sa-w1-gov-s1', title: 'Write the system map (P1 v1)', description: 'What the product is made of.',
        instructionList: ['List every model: type, training or tuning method, host, settings.', 'Record the prompt structure: system, user, template, examples, shot count.', 'List each data source with its origin and who can write to it.', 'Name one human checkpoint, and flag SA-6: the predictor’s training data has no known origin.'],
        usesForm: 'P1 System Map',
        whatItMeans: 'You cannot defend a component nobody listed. The map is also where an unknown training source first becomes visible as a risk.',
        frameworks: ['SECAI', 'NIST_AI_RMF'],
      },
      {
        id: 'sa-w1-gov-s2', title: 'Write the governance pack (P5 v1)', description: 'Rules, risks and one accountable person.',
        instructionList: ['Write five policy statements using “shall”.', 'Enter five risks, each with an owner and a treatment.', 'Name the accountable executive.'],
        usesForm: 'P5 Governance Pack',
        whatItMeans: 'An AI system with no accountable person and no written rules is the first thing a customer or regulator asks about.',
        frameworks: ['NIST_AI_RMF'],
      },
      {
        id: 'sa-w1-gov-s3', title: 'Verify the ledger and sign v1', description: 'The release note closes the release.',
        instruction: 'Check every hash still matches, then fill Release Note v1: what shipped, the scoreboard, open risks, and the CEO’s signature.',
        commands: [{
          cmd: 'sha256sum -c ledger.sha256 | tail -n 3',
          explain: 'Re-hashes every file the ledger lists and reports OK or FAILED for each.',
          sample: 'case-01-v1.txt: OK\ncase-02-v1.txt: OK\nbaseline-05.txt: OK',
        }],
        usesForm: 'Release Note',
        whatItMeans: 'A release is complete when its evidence still matches and someone with authority has accepted what remains open.',
        frameworks: ['NIST_CSF'],
        verify: ['OK'],
      },
    ],
  },
  {
    id: 'sa-w1-red', role: 'redteam', week: 1,
    title: 'Prove two attack cases with evidence',
    objective: 'Rank five threats, then prove two cases against your own instance: prompt injection and sensitive information disclosure.',
    frameworks: ['SECAI', 'OWASP_LLM'], deliverables: ['03_Attack_Casebook.md'], estimatedTime: '2 hours',
    prerequisites: ['Lab rule signed', 'Baseline transcripts in the ledger'],
    learn: ['LLM01 prompt injection', 'LLM02 sensitive information disclosure', 'Evidence: input, transcript, hash'],
    tools: ['garak', 'Ollama'], docs: [DOCS.owaspLlm, DOCS.garak],
    definitionOfDone: ['Five threats ranked, each with an OWASP reference', 'Two cases with input file, transcript and ledger hash', 'Both cases re-run after the Defender’s fix'],
    handoff: [{ to: 'defender', artifact: 'Two proven cases', note: 'The Defender blocks and logs exactly these.' }],
    steps: [
      {
        id: 'sa-w1-red-s1', title: 'Run the injection probe set', description: 'A standard scanner, against your own instance only.',
        commands: [{
          cmd: 'python -m garak --model_type ollama --model_name hub-assistant --probes promptinject --report_prefix v1-injection',
          explain: 'Runs garak’s prompt-injection probes against your lab assistant and writes a report you can cite.',
          sample: 'garak LLM vulnerability scanner v0.10.3\n📜 reporting to garak_runs/v1-injection.report.jsonl\nprobes.promptinject.HijackHateHumansMini  promptinject.AttackRogueString: FAIL  ok on  12/ 20   (failure rate:  40.00%)\n✔️  garak run complete in 94.21s',
        }],
        whatItMeans: 'A named, repeatable probe set turns “it seemed vulnerable” into a failure rate you can re-run after the fix.',
        frameworks: ['OWASP_LLM'],
        verify: ['report.jsonl', 'FAIL'],
      },
      {
        id: 'sa-w1-red-s2', title: 'Record both cases in the casebook', description: 'Input, transcript, hash, OWASP reference.',
        instructionList: ['Rank five threats, each with an OWASP LLM reference.', 'Case 1: the probe report, failure rate and transcript (LLM01).', 'Case 2: the as-found key appearing in output (LLM02), with its transcript.', 'Hash each input and transcript into the ledger.'],
        usesForm: 'P2 Attack Casebook',
        whatItMeans: 'A case without its input and output cannot be re-run or believed. The ledger hash makes the evidence stand on its own.',
        frameworks: ['OWASP_LLM', 'SECAI'],
      },
    ],
  },
  {
    id: 'sa-w1-def', role: 'defender', week: 1,
    title: 'Close SA-1 and log every attempt',
    objective: 'Move the key out of the prompt, put a rate-limited gateway in front, log every request, and write P3 and P4 at v1.',
    frameworks: ['SECAI', 'OWASP_LLM', 'NIST_CSF'], deliverables: ['04_Control_Set.md', '05_Watch_Plan.md'], estimatedTime: '2.5 hours',
    prerequisites: ['The Red Team’s two proven cases'],
    learn: ['Secrets belong in a secret store', 'A gateway is the one place to limit and log', 'Control rows: who, how often, with what, record'],
    tools: ['OpenBao', 'LiteLLM', 'Gitleaks'], docs: [DOCS.owaspLlm, DOCS.openbao, DOCS.litellm, DOCS.gitleaks],
    definitionOfDone: ['No secret in any prompt (Gitleaks clean)', 'Rate limit returns 429', 'P3 v1 has three or more complete rows', 'P4 v1 says what is logged, who reads it, how long it is kept'],
    steps: [
      {
        id: 'sa-w1-def-s1', title: 'Move the key into the secret store', description: 'SA-1: the key leaves the prompt.',
        commands: [{
          cmd: 'bao kv put secret/hub/llm api_key=@key.txt && shred -u key.txt',
          explain: 'Stores the model key in OpenBao’s key-value store, then destroys the plain-text copy on disk.',
          sample: '== Secret Path ==\nsecret/data/hub/llm\n\n======= Metadata =======\nKey                Value\n---                -----\ncreated_time       2026-10-06T14:02:11Z\nversion            1',
        }],
        whatItMeans: 'Anything in a prompt can be repeated back by the model. A key held in a secret store, with an owner and rotation, cannot.',
        frameworks: ['SECAI'],
        verify: ['secret/data/hub/llm', 'version'],
      },
      {
        id: 'sa-w1-def-s2', title: 'Prove no secret is left in a prompt', description: 'The template and Modelfile, scanned.',
        commands: [{
          cmd: 'gitleaks detect --no-git --source prompts/ -v',
          explain: 'Scans the prompt templates and Modelfile for anything shaped like a key or token.',
          sample: '    ○\n    │╲\n    │ ○\n    ○ ░\n    ░    gitleaks\n\n2:05PM INF scanned ~2.1 KB in 31ms\n2:05PM INF no leaks found',
        }],
        whatItMeans: '“No secret in any prompt” is a Done-when line; a scanner turns it from a promise into evidence.',
        frameworks: ['OWASP_LLM'],
        verify: ['no leaks found'],
      },
      {
        id: 'sa-w1-def-s3', title: 'Rate-limit and log at the gateway', description: 'One door, with a limit and a log.',
        instruction: 'Start LiteLLM with a per-key limit of 10 requests a minute and request logging on, then send twelve requests.',
        commands: [{
          cmd: 'for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:4000/v1/chat/completions -H "Authorization: Bearer $HUB_KEY" -d @ping.json; done | sort | uniq -c',
          explain: 'Sends twelve requests through the gateway and counts the status codes: allowed ones return 200, limited ones 429.',
          sample: '     10 200\n      2 429',
        }],
        whatItMeans: 'SA-4: with no limit, one caller can exhaust the budget or the model. The 429s prove the limit is enforced, not just configured.',
        frameworks: ['SECAI', 'OWASP_LLM'],
        verify: ['429'],
      },
      {
        id: 'sa-w1-def-s4', title: 'Write P3 and P4 at v1', description: 'Controls as rows; the log as a plan.',
        instructionList: ['P3: three or more rows — control, who, how often, with what, record.', 'P4: what is logged, who can read it, how long it is kept.', 'Confirm both of the Red Team’s cases appear in the gateway log.'],
        usesForm: 'P3 Control Set',
        whatItMeans: 'A control with no owner and no record is an intention. Rows with all five columns are what an auditor can test.',
        frameworks: ['SECAI', 'NIST_CSF'],
      },
    ],
  },

  // ── Week 2 — Release v2, full coverage ────────────────────────────────────
  {
    id: 'sa-w2-red', role: 'redteam', week: 2,
    title: 'Six cases and a mapped threat model',
    objective: 'Grow the suite to six cases, map twelve threats to OWASP and MITRE ATLAS, and describe three AI-enabled attacker scenarios.',
    frameworks: ['SECAI', 'OWASP_LLM', 'MITRE_ATLAS', 'STRIDE'], deliverables: ['03_Attack_Casebook.md'], estimatedTime: '2.5 hours',
    learn: ['Indirect injection through documents', 'Excessive agency', 'Insecure output handling', 'Model denial of service'],
    tools: ['OWASP Threat Dragon', 'garak'], docs: [DOCS.atlas, DOCS.threatDragon, DOCS.owaspLlm],
    definitionOfDone: ['Six cases with evidence', 'Twelve threats mapped to OWASP and ATLAS', 'Three AI-enabled attacker scenarios, each with a detection and a control'],
    handoff: [{ to: 'defender', artifact: 'Six-case suite', note: 'Four or more must be blocked or contained by the release.' }],
    steps: [
      {
        id: 'sa-w2-red-s1', title: 'Run all six cases', description: 'The suite, one input file per case.',
        instruction: 'Add the four new cases to attacks/: the instructor’s poisoned work order, an agent overreach, unencoded output and an oversized request.',
        commands: [{
          cmd: 'for f in attacks/case-0*.txt; do ollama run hub-assistant < "$f" > "results/$(basename "$f" .txt)-v2.txt"; done; ls results/*-v2.txt | wc -l',
          explain: 'Runs every case file through the assistant, saves one result per case, and counts them.',
          sample: '6',
        }],
        whatItMeans: 'The suite is the release’s yardstick: the same six inputs, every release, so “four or more contained” is a count, not an impression.',
        frameworks: ['SECAI'],
        verify: ['6'],
      },
      {
        id: 'sa-w2-red-s2', title: 'Map the threats and the attacker’s use of AI', description: 'P2 v2 in the casebook.',
        instructionList: ['Draw the data flow with trust boundaries in Threat Dragon.', 'Map twelve threats to an OWASP list and an ATLAS technique.', 'Describe three AI-enabled attacker scenarios, each with one detection and one control.'],
        usesForm: 'P2 Attack Casebook',
        whatItMeans: 'Mapping to shared catalogues lets a customer compare your threat model with anyone else’s, and shows nothing obvious was skipped.',
        frameworks: ['MITRE_ATLAS', 'STRIDE'],
      },
    ],
  },
  {
    id: 'sa-w2-def', role: 'defender', week: 2,
    title: 'Guard the inputs, scope the agent, redact the logs',
    objective: 'Close SA-2, SA-3, SA-4, SA-5 and SA-8 with guardrails, a scoped agent, encoded output, redacted logs and owned alert thresholds.',
    frameworks: ['SECAI', 'OWASP_LLM', 'NIST_CSF'], deliverables: ['04_Control_Set.md', '05_Watch_Plan.md'], estimatedTime: '3 hours',
    prerequisites: ['The six-case suite'],
    learn: ['Input and output guardrails', 'Least privilege for agents', 'Redaction before write'],
    tools: ['LLM Guard', 'Microsoft Presidio', 'LiteLLM', 'Wazuh'], docs: [DOCS.llmGuard, DOCS.presidio, DOCS.wazuh],
    definitionOfDone: ['Four or more cases blocked or contained', 'Agent holds no admin right', 'No tenant names or access codes in logs', 'Access matrix and data protection rules in P3', 'Thresholds with owners in P4'],
    handoff: [{ to: 'governance', artifact: 'Control set v2', note: 'Governance enters each control against a risk.' }],
    steps: [
      {
        id: 'sa-w2-def-s1', title: 'Screen inputs before the model', description: 'The guardrail result, per case.',
        commands: [{
          cmd: "python - <<'PY'\nfrom llm_guard.input_scanners import PromptInjection\ntext = open('attacks/case-03.txt').read()\n_, valid, score = PromptInjection().scan(text)\nprint('BLOCKED' if not valid else 'ALLOWED', round(score, 2))\nPY",
          explain: 'Runs LLM Guard’s prompt-injection scanner over one case file and prints whether it would be blocked, with its risk score.',
          sample: 'BLOCKED 1.0',
        }],
        whatItMeans: 'A guardrail in front of the model is a compensating control: it does not make the model safe, but it stops known patterns reaching it.',
        frameworks: ['OWASP_LLM'],
        verify: ['BLOCKED'],
      },
      {
        id: 'sa-w2-def-s2', title: 'Redact before anything is logged', description: 'SA-5: names and access codes out of the logs.',
        commands: [{
          cmd: "python - <<'PY'\nfrom presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern\nfrom presidio_anonymizer import AnonymizerEngine\ncode = PatternRecognizer(supported_entity='ACCESS_CODE', patterns=[Pattern('code', r'\\b\\d{4}#', 0.9)])\nengine = AnalyzerEngine(); engine.registry.add_recognizer(code)\ntext = 'Tenant Maria Lopez, door code 4417#'\nprint(AnonymizerEngine().anonymize(text, engine.analyze(text, language='en')).text)\nPY",
          explain: 'Adds an access-code recognizer to Presidio, then replaces the tenant’s name and the code with placeholders before the line is written.',
          sample: 'Tenant <PERSON>, door code <ACCESS_CODE>',
        }],
        whatItMeans: 'Logs are read by more people than the product is. Redacting before the write means a log reader never sees what a customer typed.',
        frameworks: ['SECAI'],
        verify: ['<PERSON>', '<ACCESS_CODE>'],
      },
      {
        id: 'sa-w2-def-s3', title: 'Scope the agent and encode the output', description: 'SA-3 and SA-8.',
        instructionList: ['Replace the work-order tool’s admin token with a scoped one.', 'Require a person to approve every outbound email.', 'Encode the assistant’s output before the portal renders it.', 'Fill the access matrix and data protection rules in P3.'],
        usesForm: 'P3 Control Set',
        whatItMeans: 'An agent can only do the damage its tools allow. A scoped token and an approval step turn a hijacked agent into a stopped one.',
        frameworks: ['OWASP_LLM', 'SECAI'],
      },
      {
        id: 'sa-w2-def-s4', title: 'Set the alert thresholds', description: 'Rate and four cost drivers, each owned.',
        instruction: 'In P4, set thresholds for request rate and for prompt, storage, response and processing cost, each with an owner.',
        usesForm: 'P4 Watch Plan',
        whatItMeans: 'A model can be attacked through the bill. A cost threshold with a named owner turns a slow drain into an alert someone answers.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sa-w2-gov', role: 'governance', week: 2,
    title: 'Map the data and every rule that applies',
    objective: 'Write P1 and P5 at v2: data lineage and life cycle, ten risks, ten roles, and a compliance table for every rule.',
    frameworks: ['SECAI', 'NIST_AI_RMF', 'ISO_42001'], deliverables: ['02_System_Map.md', '06_Governance_Pack.md', '07_Release_Note.md'], estimatedTime: '2.5 hours',
    learn: ['Structured, semi-structured and unstructured data', 'The nine-stage AI life cycle', 'Applicability, with a reason'],
    tools: ['CISO Assistant Community', 'draw.io'], docs: [DOCS.aiRmf, DOCS.iso42001],
    definitionOfDone: ['Life-cycle table with risk and human checkpoint', 'Ten risks including bias, leakage and autonomous action', 'Compliance table covers every rule in the scenario', 'Release note v2 signed with owners and dates for any open case'],
    consumes: [{ from: 'defender', artifact: 'Control set v2', note: 'Each control is entered against a risk.' }],
    steps: [
      {
        id: 'sa-w2-gov-s1', title: 'Map the data and the life cycle (P1 v2)', description: 'Lineage, embeddings, nine stages.',
        instructionList: ['Classify each data type: structured, semi-structured or unstructured.', 'Show its processing steps and where it is embedded.', 'Fill the nine-stage life cycle with a risk and a human checkpoint each.'],
        usesForm: 'P1 System Map',
        whatItMeans: 'SA-2 happened because uploads went straight into retrieval. Lineage shows every such path before an attacker finds it.',
        frameworks: ['NIST_AI_RMF'],
      },
      {
        id: 'sa-w2-gov-s2', title: 'Risks, roles and the compliance table (P5 v2)', description: 'Every rule: applies, because, owner.',
        instructionList: ['Grow the register to ten risks: bias, leakage, reputation, accuracy, IP and autonomous action included.', 'Map ten AI roles to the six-person IT team.', 'For each rule in the scenario: does it apply, why, and who owns it.', 'Record whether the EU AI Act applies, and why.'],
        usesForm: 'P5 Governance Pack',
        whatItMeans: 'A compliance table that says “does not apply, because…” is as valuable as one that says “applies”: it shows the question was asked.',
        frameworks: ['ISO_42001', 'NIST_AI_RMF'],
      },
      {
        id: 'sa-w2-gov-s3', title: 'Sign release v2', description: 'Owner and date for every case still open.',
        instruction: 'Fill Release Note v2: scoreboard, open risks, and an owner and date for each case that still gets through.',
        usesForm: 'Release Note',
        whatItMeans: 'A working attack with an owner and a date is a managed risk. One without is an unmanaged one.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ── Week 3 — Release v3, automated and measured ───────────────────────────
  {
    id: 'sa-w3-def', role: 'defender', week: 3,
    title: 'Gate the pipeline and alert on every case',
    objective: 'Put code, dependency and secret scans and the attack suite in the pipeline, prove a block and a rollback, and alert on all six.',
    frameworks: ['SECAI', 'NIST_CSF'], deliverables: ['04_Control_Set.md', '05_Watch_Plan.md'], estimatedTime: '3 hours',
    learn: ['Security gates in a pipeline', 'Regression tests for guardrails', 'Alert to ticket'],
    tools: ['Semgrep', 'Trivy', 'Gitleaks', 'Jenkins or GitLab CI', 'Wazuh', 'GLPI'], docs: [DOCS.semgrep, DOCS.trivy, DOCS.wazuh, DOCS.owaspLlm],
    definitionOfDone: ['Scans block on findings', 'A removed guardrail blocks the build', 'One rollback recorded (R10)', 'Two detections; all six attempts alert into a ticket'],
    steps: [
      {
        id: 'sa-w3-def-s1', title: 'Code scan as a gate', description: 'Findings stop the build.',
        commands: [{
          cmd: 'semgrep scan --config p/python --error src/',
          explain: 'Scans the Hub’s code with the Python ruleset; --error makes any finding fail the pipeline stage.',
          sample: '┌──────────────┐\n│ Scan Summary │\n└──────────────┘\nRan 151 rules on 23 files: 0 findings.',
        }],
        whatItMeans: 'A scan that only reports is advice. A scan that fails the build is a control, and the pipeline log is its record.',
        frameworks: ['SECAI'],
        verify: ['0 findings'],
      },
      {
        id: 'sa-w3-def-s2', title: 'Dependency scan as a gate', description: 'Known-vulnerable libraries stop the build.',
        commands: [{
          cmd: 'trivy fs --scanners vuln --severity HIGH,CRITICAL --exit-code 1 .',
          explain: 'Checks every dependency against known vulnerabilities and exits non-zero on any high or critical one.',
          sample: 'requirements.txt (pip)\n======================\nTotal: 0 (HIGH: 0, CRITICAL: 0)',
        }],
        whatItMeans: 'AI stacks pull in many fast-moving libraries. A gate on known CVEs stops one of them shipping a published hole.',
        frameworks: ['SECAI'],
        verify: ['Total: 0'],
      },
      {
        id: 'sa-w3-def-s3', title: 'Prove the suite blocks a weak build', description: 'Remove a guardrail; watch the build stop.',
        instructionList: ['Turn the input guardrail off in a branch and push.', 'Save the failed run as R10.', 'Roll back the last release and record it.'],
        commands: [{
          cmd: 'python run_suite.py --pass-line 4',
          explain: 'Runs the six cases through the gateway and fails if fewer than four are blocked or contained.',
          sample: 'case-01 BLOCKED\ncase-02 BLOCKED\ncase-03 PASSED THROUGH\ncase-04 BLOCKED\ncase-05 PASSED THROUGH\ncase-06 PASSED THROUGH\n6 run · 3 blocked · pass line 4\nFAIL: below the pass line — build stopped',
        }],
        whatItMeans: 'Guardrails get switched off by accident. The suite as a regression test is what catches it before customers do.',
        frameworks: ['SECAI', 'OWASP_LLM'],
        verify: ['build stopped'],
      },
      {
        id: 'sa-w3-def-s4', title: 'Two detections, alert to ticket', description: 'Injection pattern and cost spike.',
        instruction: 'Write two Wazuh rules, injection pattern and cost spike, route alerts to GLPI tickets, and record them in P4.',
        usesForm: 'P4 Watch Plan',
        whatItMeans: 'An alert nobody owns is noise. A ticket gives each one an owner and a closing record.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sa-w3-red', role: 'redteam', week: 3,
    title: 'Automate the suite and check AI-assisted work',
    objective: 'Define the suite’s pass line, add two variants of each case that still works, and validate an AI assistant’s triage by hand.',
    frameworks: ['SECAI', 'OWASP_LLM'], deliverables: ['03_Attack_Casebook.md'], estimatedTime: '2 hours',
    learn: ['A pass line makes a suite a test', 'AI-assisted triage still needs a human check'],
    tools: ['Continue with a local model', 'Ollama'], docs: [DOCS.garak, DOCS.owaspLlm],
    definitionOfDone: ['Suite definition with pass line in P2', 'Two variants per surviving case', 'AI triage claims checked by hand; at least one error recorded (R9)'],
    handoff: [{ to: 'defender', artifact: 'Automated suite', note: 'The Defender runs it as the pipeline’s regression stage.' }],
    steps: [
      {
        id: 'sa-w3-red-s1', title: 'Define the automated suite', description: 'Pass line and variants in P2 v3.',
        instructionList: ['State the pass line: four or more of six blocked or contained.', 'For each case that still gets through, add two variants to the suite.', 'Record which variants the guardrails catch.'],
        usesForm: 'P2 Attack Casebook',
        whatItMeans: 'A fix that blocks one exact input but not a reworded one is not a fix. Variants test the control, not the sentence.',
        frameworks: ['OWASP_LLM'],
      },
      {
        id: 'sa-w3-red-s2', title: 'Triage a scan report with AI, then check it', description: 'R9: every claim checked by hand.',
        commands: [{
          cmd: 'ollama run llama3.2:3b "List the three highest-risk findings in this report, with CVE and package." < scan-report.txt | tee ai-triage.txt',
          explain: 'Asks the local model to summarise the instructor’s scan report and saves its answer for checking.',
          sample: '1. CVE-2024-34064 in jinja2 3.1.3 (Medium)\n2. CVE-2024-35195 in requests 2.31.0 (Medium)\n3. CVE-2023-45803 in urllib3 2.0.6 (Medium)',
        }],
        whatItMeans: 'AI assistants misread reports and invent details. Checking each claim against the source, and recording the misses, is the control.',
        frameworks: ['SECAI'],
        verify: ['CVE-'],
      },
    ],
  },
  {
    id: 'sa-w3-gov', role: 'governance', week: 3,
    title: 'Find shadow AI and measure accuracy',
    objective: 'Find the AI services staff use, decide each one, write the tool rules, and record an accuracy figure.',
    frameworks: ['SECAI', 'NIST_AI_RMF'], deliverables: ['02_System_Map.md', '06_Governance_Pack.md', '07_Release_Note.md'], estimatedTime: '2.5 hours',
    learn: ['Sanctioned and unsanctioned tools', 'Public and private models', 'Accuracy, hallucination and bias as measured risks'],
    tools: ['Zeek', 'CISO Assistant Community'], docs: [DOCS.zeek, DOCS.aiRmf],
    definitionOfDone: ['Every unsanctioned tool has a decision (R7); SA-7 closed', 'Tool allow-list in P1', 'Accuracy figure from 20 reference questions in the register (R8)', 'Release note v3 signed'],
    steps: [
      {
        id: 'sa-w3-gov-s1', title: 'Find AI services in the DNS log', description: 'SA-7, from the sample proxy and DNS logs.',
        commands: [{
          cmd: "zeek-cut query < dns.log | grep -Ei 'openai|chatgpt|claude|gemini|copilot' | sort | uniq -c | sort -rn",
          explain: 'Pulls the looked-up names from the instructor’s sample DNS log and counts the ones that belong to AI services.',
          sample: '    214 chatgpt.com\n     61 gemini.google.com\n     18 claude.ai\n      7 copilot.microsoft.com',
        }],
        whatItMeans: 'Staff pasting contracts into personal chatbots is a data leak no gateway sees. The network is where it shows up.',
        frameworks: ['SECAI'],
        verify: ['chatgpt.com'],
      },
      {
        id: 'sa-w3-gov-s2', title: 'Decide each tool and write the rules', description: 'P1 v3 allow-list; P5 v3 policy.',
        instructionList: ['Give each tool found a decision: sanction, replace or block.', 'List allowed tools by type, account type and data class.', 'Write what never goes to a public model, and who validates AI output.'],
        usesForm: 'P5 Governance Pack',
        whatItMeans: 'Banning every tool pushes use underground. An allow-list with a sanctioned option is what actually stops contracts leaking.',
        frameworks: ['NIST_AI_RMF'],
      },
      {
        id: 'sa-w3-gov-s3', title: 'Measure accuracy and sign v3', description: 'Twenty reference questions; one figure.',
        instruction: 'Score the assistant on the 20 reference questions, enter the accuracy figure in the risk register, and sign Release Note v3.',
        usesForm: 'Release Note',
        whatItMeans: 'Accuracy is a risk like any other: it needs a number, an owner and a schedule, or it is only a feeling.',
        frameworks: ['NIST_AI_RMF'],
      },
    ],
  },

  // ── Week 4 — Release v4, proven and handed over ───────────────────────────
  {
    id: 'sa-w4-def', role: 'defender', week: 4,
    title: 'Rebuild clean and hand over monitoring',
    objective: 'Rebuild a fresh copy with every control, scan the model files, write the evaluation checklist, and hand over monitoring.',
    frameworks: ['SECAI', 'NIST_CSF'], deliverables: ['04_Control_Set.md', '05_Watch_Plan.md'], estimatedTime: '3 hours',
    learn: ['Reproducibility as evidence', 'Unsafe code in serialised models', 'Model evaluation before replacement'],
    tools: ['ModelScan', 'Prowler'], docs: [DOCS.modelscan, DOCS.prowler],
    definitionOfDone: ['Timed rebuild record (R11)', 'Model files scanned clean', 'Evaluation checklist with pass marks', 'Handover sheet: who watches what, how often'],
    steps: [
      {
        id: 'sa-w4-def-s1', title: 'Scan the model files', description: 'Tampered models carry code.',
        commands: [{
          cmd: 'modelscan -p models/failure-predictor.pkl',
          explain: 'Checks the predictor’s serialised file for operations that would run code when it is loaded.',
          sample: '--- Summary ---\n\n No issues found! 🎉',
        }],
        whatItMeans: 'A pickled model can execute anything when loaded. Scanning it is the compensating control for a supply chain you do not fully see.',
        frameworks: ['SECAI'],
        verify: ['No issues found'],
      },
      {
        id: 'sa-w4-def-s2', title: 'Rebuild a clean copy, timed', description: 'Every control reapplied from the record.',
        commands: [{
          cmd: 'time ./rebuild.sh',
          explain: 'Runs your rebuild script on a fresh copy and reports how long it took.',
          sample: 'gateway ........ ok\nsecrets ........ ok\nguardrails ..... ok\nagent scopes ... ok\nlogging ........ ok\n\nreal\t18m42.311s',
        }],
        whatItMeans: 'If only the person who built it can rebuild it, the controls are not documented. A timed rebuild proves they are.',
        frameworks: ['NIST_CSF'],
        verify: ['real'],
      },
      {
        id: 'sa-w4-def-s3', title: 'Checklist and handover', description: 'P3 v4 and P4 v4.',
        instructionList: ['Write the model evaluation checklist: accuracy, refusals, licence, provenance, pass marks.', 'Run it on the candidate replacement model.', 'Give every final control row a test result.', 'Fill the handover sheet: who watches what, how often.'],
        usesForm: 'P4 Watch Plan',
        whatItMeans: 'Monitoring that lives in one person’s head stops when they leave. The handover sheet is what keeps it running.',
        frameworks: ['NIST_CSF', 'SECAI'],
      },
    ],
  },
  {
    id: 'sa-w4-red', role: 'redteam', week: 4,
    title: 'Reproduce the suite and add four paper cases',
    objective: 'Re-run the suite on the rebuilt copy, and write four paper cases for the attacks the lab cannot run.',
    frameworks: ['SECAI', 'OWASP_LLM', 'MITRE_ATLAS'], deliverables: ['03_Attack_Casebook.md'], estimatedTime: '2 hours',
    learn: ['Training data poisoning', 'Model theft', 'Membership inference', 'Tampered models and dependencies'],
    tools: ['Ollama'], docs: [DOCS.atlas, DOCS.owaspLlm],
    definitionOfDone: ['Rebuilt copy matches the v3 result', 'Four paper cases with expected evidence and a compensating control', 'Final ranked threat table: ten cases in all'],
    steps: [
      {
        id: 'sa-w4-red-s1', title: 'Re-run the suite on the rebuild', description: 'Same inputs, same result.',
        commands: [{
          cmd: 'python run_suite.py --pass-line 4 --target rebuilt',
          explain: 'Runs the six cases against the rebuilt copy and compares the count with the pass line.',
          sample: '6 run · 5 blocked · pass line 4\nPASS',
        }],
        whatItMeans: 'The same result on a fresh copy proves the controls come from the record, not from leftover state on one machine.',
        frameworks: ['SECAI'],
        verify: ['PASS'],
      },
      {
        id: 'sa-w4-red-s2', title: 'Write the four paper cases', description: 'Expected evidence and a compensating control each.',
        instructionList: ['Training data poisoning, tied to SA-6.', 'Model theft through the API.', 'Membership inference on the predictor.', 'A tampered model file or dependency.', 'Rank all ten cases in the final threat table.'],
        usesForm: 'P2 Attack Casebook',
        whatItMeans: 'Some attacks are too costly to stage in a lab. A paper case still says what evidence would show it and what control answers it.',
        frameworks: ['MITRE_ATLAS'],
      },
    ],
  },
  {
    id: 'sa-w4-gov', role: 'governance', week: 4,
    title: 'Accept the risks and answer the customers',
    objective: 'Finish the model cards and responsible-AI assessment, get every remaining risk accepted, and answer the customers’ three questions with evidence.',
    frameworks: ['SECAI', 'NIST_AI_RMF', 'ISO_42001'], deliverables: ['02_System_Map.md', '06_Governance_Pack.md', '07_Release_Note.md', '08_Release_Package.md'], estimatedTime: '3 hours',
    learn: ['Model cards', 'Responsible-AI principles as evidence or gaps', 'Writing for a contracting officer and a lawyer'],
    tools: ['Git'], docs: [DOCS.aiRmf, DOCS.modelcard],
    definitionOfDone: ['A model card per model; SA-6 resolved or accepted', 'Responsible-AI assessment, evidence or gap per principle', 'Every remaining risk accepted in writing', 'Assurance response cites documents and ledger entries', 'Release note v4 signed'],
    consumes: [{ from: 'redteam', artifact: 'Final threat table', note: 'The residual risks come from it.' }, { from: 'defender', artifact: 'Handover sheet', note: 'The assurance response cites it.' }],
    steps: [
      {
        id: 'sa-w4-gov-s1', title: 'Model cards and the responsible-AI assessment', description: 'P1 v4 and P5 v4.',
        instructionList: ['Write a model card for each model.', 'Resolve SA-6 with a known data source, or carry it as an accepted risk.', 'For each responsible-AI principle, cite evidence or name the gap.', 'Get the CEO’s signed acceptance of each remaining risk.'],
        usesForm: 'P5 Governance Pack',
        whatItMeans: 'A gap stated plainly is something a customer can plan around. A gap hidden behind “we follow responsible AI” is not.',
        frameworks: ['NIST_AI_RMF', 'ISO_42001'],
      },
      {
        id: 'sa-w4-gov-s2', title: 'Answer the three questions', description: 'Who is accountable, what rules apply, what happens when it is wrong.',
        instruction: 'Fill the Release v4 Package: one page answering the three questions, each answer citing a document and a ledger entry, plus the package index.',
        usesForm: 'Release v4 Package & Assurance Response',
        whatItMeans: 'This is the capstone: four weeks of evidence turned into answers a buyer can verify for themselves.',
        frameworks: ['SECAI', 'NIST_AI_RMF'],
      },
    ],
  },
];

export const SECAI_PLUS: Course = {
  id: 'secai-plus',
  title: 'SecAI+ Capstone: Four Releases',
  slug: 'secai-plus',
  vendor: 'CompTIA',
  certification: 'SecAI+ (CY0-001)',
  level: 'professional',
  audience: 'Secure an AI product end to end: attack it, defend it, watch it, govern it, release it.',
  description:
    'Secure the AI at the center of a facility-services company. Every week ships a complete release: attack cases with evidence, controls, monitoring, governance and a signed release note.',
  roles,
  weeks,
  gates,
  tasks,
  noGatekeeping: true,
  isSeed: true,
  version: 1,
  locked: false,
  topologyPicture: 'hub',
  teamCount: 12,
  teamCapacity: 6,
};
