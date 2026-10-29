import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the Azure AI Fundamentals Foundry Studio produces (AI-901).
 *
 * A four-person studio stands up one small AI assistant and documents it the
 * way a real delivery team would. Eight forms, one job each, in the order the
 * work happens:
 *
 *   1 Studio Setup & Access Register   accounts, budget guard, local model     W0
 *   2 AI Workloads & Capabilities Map  the workloads, strengths and limits     W1
 *   3 Responsible AI Assessment        the six principles ← the decision       W2
 *   4 Evaluation & Grounding Log       a wrong answer, worked to grounded      W2,4
 *   5 Foundry Build Record             the deployed model and the app          W3
 *   6 Language, Vision & Extraction    the senses and the agent                W3,4
 *   7 AI Governance & Risk Register    the risks, owners and mitigations       W4
 *   8 Handover & Solution Record       the solution as it is  ← capstone       W4
 *
 * FORM 4 IS THE ONE THE COURSE IS ABOUT. A model answer counts only once it has
 * been checked against the evidence, and a wrong answer is worked one theory and
 * one change at a time, with the failed theories kept — the same discipline A+
 * uses on a dead PC.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'ai-foundations'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });
const YN = ['Yes', 'No'];

/** The one decision of the studio: what to do with the assistant once the responsible-AI findings are in. */
const DEPLOY_DECISION: DecisionBlock = {
  id: 'deploy',
  title: 'The deployment decision',
  subject: 'architecture',
  prompt: 'The responsible-AI findings are in front of the team. What happens to this assistant?',
  options: [
    { id: 'ship', label: 'Ship it', help: 'The findings are low risk and mitigated; the assistant goes live as built.' },
    { id: 'ship-limited', label: 'Ship it with limits', help: 'Real risks remain; the assistant ships with a narrowed scope, a disclaimer and a human check.' },
    { id: 'hold', label: 'Hold it', help: 'A finding is serious and unmitigated; nothing ships until it is fixed.' },
  ],
  questions: [
    { field: 'deploy_why', label: 'Why that, from the findings', type: 'area', required: true, placeholder: 'All six principles have a mitigation with an owner; the one high finding (hallucination) is covered by grounding and a visible disclaimer.' },
    { field: 'deploy_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'Ship with no limits: the hallucination risk is real enough to warrant the disclaimer.' },
    { field: 'deploy_risk', label: 'The risk accepted', type: 'text', placeholder: 'A grounded answer can still be wrong if the source is wrong; the human check covers it.' },
  ],
};

const AI_FOUNDATIONS_FORMS: DeliverableDef[] = [
  // 1 — Studio Setup & Access Register ─────────────────────────────────────────
  {
    id: 'aif_setup',
    courseId: 'ai-foundations',
    num: 1,
    file: '01_Studio_Setup_and_Access_Register.md',
    title: 'Studio Setup & Access Register',
    owner: 'records',
    shared: true,
    folder: '00_Setup',
    standard: 'Account hygiene & cost governance · NIST AI RMF GOVERN-1 · NIST SP 800-53 AC-2',
    weeks: [0],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['aif_capabilities'],
    purpose:
      'What the studio runs on: the account with its budget guard, the local model on each machine, and who holds access. Written first, because an AI account with no budget alert is how a free-tier demo becomes a surprise bill.',
    howTo:
      'Record the subscription, turn on the budget alert, list the local model each member pulled, and name who owns the account and who may deploy.',
    buildSteps: [
      'The subscription id and that MFA is on.',
      'A $1 budget alert, with the email it goes to.',
      'The local model each member pulled, and its size.',
      'Who owns the account and who can deploy.',
      'The assistant name and the studio folder path.',
    ],
    meaning: 'A good setup record lets anyone say who can spend money and run a model, and proves the seatbelt was on before the car moved.',
    useIt: 'The capabilities map starts from it, and the handover closes the account against it.',
    pitfalls: [
      'A deployment with no budget alert behind it.',
      'A shared key pasted into the record. Locations and owners only.',
      'A personal email on a team account.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The account',
        fields: [
          { field: 'sub_id', label: 'Subscription id (last 12)', type: 'text', required: true, placeholder: '…000000000000' },
          { field: 'mfa', label: 'MFA is on for the account', type: 'select', required: true, options: YN },
          { field: 'budget', label: 'A $1 budget alert exists', type: 'select', required: true, options: YN },
          { field: 'budget_email', label: 'The budget alert goes to', type: 'text', required: true, placeholder: 'studio-t1@…' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'models',
          label: 'The local model each member runs',
          help: 'One row per machine. The model has to answer offline before Week 1.',
          columns: [
            c('member', 'Member', 'text', { placeholder: 'Sam' }),
            c('model', 'Model', 'text', { placeholder: 'llama3.2' }),
            c('size', 'Size', 'text', { placeholder: '2.0 GB' }),
            c('answers', 'Answers offline', 'select', { options: YN }),
          ],
          seed: [{ member: 'Sam', model: 'llama3.2', size: '2.0 GB', answers: 'Yes' }],
        },
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'owner', label: 'Account owner', type: 'text', required: true, placeholder: 'Priya' },
          { field: 'deployers', label: 'Who can deploy', type: 'text', required: true, placeholder: 'Priya, Sam' },
          { field: 'assistant', label: 'Assistant name', type: 'text', required: true, placeholder: 'studio-t1' },
          { field: 'folder', label: 'Studio folder path', type: 'text', required: true, placeholder: 'studio-t1/' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Concepts: Alex · Build: Sam · Language: Jo · Records: Priya' },
        ],
      },
    ],
    dod: [
      { label: 'The subscription is named with MFA on', when: { all: [{ fields: ['sub_id'] }, { field: 'mfa', equals: 'Yes' }] } },
      { label: 'A budget alert exists with an email', when: { all: [{ field: 'budget', equals: 'Yes' }, { fields: ['budget_email'] }] } },
      { label: 'Every member has a local model that answers offline', when: { group: 'models', atLeast: 1, every: { column: 'answers', equals: 'Yes' } } },
      { label: 'The team has an owner, deployers and four focuses', when: { fields: ['owner', 'deployers', 'focus'] } },
    ],
  },

  // 2 — AI Workloads & Capabilities Map ────────────────────────────────────────
  {
    id: 'aif_capabilities',
    courseId: 'ai-foundations',
    num: 2,
    file: '02_AI_Workloads_and_Capabilities_Map.md',
    title: 'AI Workloads & Capabilities Map',
    owner: 'concepts',
    shared: true,
    folder: '01_Identify',
    standard: 'AI workload identification · AI-901 area 1 · NIST AI RMF MAP-1',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['aif_responsible', 'aif_build'],
    purpose:
      'Every feature the team can name, tagged with the AI workload behind it, the Azure service that implements it, and what that workload can and cannot be trusted to do. The map the whole build is chosen from.',
    howTo:
      'Tag each feature with one workload and say why. Point each workload at a real Azure service. Write one strength and one limit for each. Record the parts of a model you saw in the local runs.',
    buildSteps: [
      'Ten features, each with one workload tag and the reason.',
      'Each workload pointed at its Azure service.',
      'One strength and one limit per workload.',
      'Tokens, context window, parameters and temperature, in the team’s words.',
      'At least one feature marked "not AI" with the reason.',
    ],
    meaning: 'Naming the workload is where the exam and the job both start; the wrong workload is the wrong service and the wrong cost.',
    useIt: 'The responsible-AI assessment weighs the workloads on it; the build record deploys the services it names.',
    pitfalls: [
      'Calling everything generative AI.',
      'Reading text from a photo and calling it NLP.',
      'A workload with no limit written down.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'features',
          label: 'Features and their workloads',
          help: 'One row per feature. "not AI" is a valid workload for a rule-based feature.',
          columns: [
            c('feature', 'Feature', 'text', { placeholder: 'Photo search by object' }),
            c('workload', 'Workload', 'select', { options: ['Machine learning', 'Generative AI', 'Computer vision', 'Natural language processing', 'Document intelligence', 'not AI'] }),
            c('service', 'Azure service', 'text', { placeholder: 'Azure AI Vision' }),
            c('why', 'Why that workload', 'text', { placeholder: 'It recognises objects in an image' }),
          ],
          seed: [{ feature: 'Spam filter', workload: 'Machine learning', service: 'Azure AI Language', why: 'Predicts a label from past examples' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'limits',
          label: 'Each workload: a strength and a limit',
          columns: [
            c('workload', 'Workload', 'text', { placeholder: 'Generative AI' }),
            c('strength', 'Good at', 'text', { placeholder: 'Drafting and summarising text' }),
            c('limit', 'Not to be trusted with', 'text', { placeholder: 'Facts it was not given; it will invent them' }),
          ],
          seed: [{ workload: 'Generative AI', strength: 'Drafting and summarising', limit: 'Facts it was not given' }],
        },
      },
      {
        kind: 'fields',
        title: 'The parts of a model',
        fields: [
          { field: 'token', label: 'What a token is', type: 'text', required: true, placeholder: 'A chunk of text the model reads and predicts one at a time' },
          { field: 'context', label: 'What the context window is', type: 'text', required: true, placeholder: 'How much text the model can hold in view at once' },
          { field: 'temperature', label: 'What temperature does', type: 'text', required: true, placeholder: 'How freely it varies; low for a grounded assistant' },
        ],
      },
    ],
    dod: [
      { label: 'At least eight features are tagged with a workload and a reason', when: { group: 'features', atLeast: 8, every: { filled: ['feature', 'workload', 'why'] } } },
      { label: 'At least one feature is marked "not AI"', when: { group: 'features', atLeast: 1, some: { column: 'workload', equals: 'not AI' } } },
      { label: 'Each workload has a strength and a limit', when: { group: 'limits', atLeast: 4, every: { filled: ['strength', 'limit'] } } },
      { label: 'The parts of a model are explained', when: { fields: ['token', 'context', 'temperature'] } },
    ],
  },

  // 3 — Responsible AI Assessment ──────────────────────────────────────────────
  {
    id: 'aif_responsible',
    courseId: 'ai-foundations',
    num: 3,
    file: '03_Responsible_AI_Assessment.md',
    title: 'Responsible AI Assessment',
    owner: 'concepts',
    shared: true,
    folder: '01_Identify',
    standard: 'Responsible AI principles · AI-901 area 1 · NIST AI RMF GOVERN-2 · ISO/IEC 42001',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['aif_governance'],
    purpose:
      'The assistant weighed against Microsoft’s six responsible-AI principles, each with a finding, a mitigation and an owner, and the deployment decision that follows from them.',
    howTo:
      'Write a finding for each principle that is specific to this assistant, a mitigation the team can do, and who owns it. Then record the decision: ship, ship with limits, or hold.',
    buildSteps: [
      'A finding per principle, specific to this assistant.',
      'A mitigation and an owner for each finding.',
      'The deployment decision, with the rejected option and the accepted risk.',
    ],
    meaning: 'Responsible AI is a slogan until it is a finding per principle with an owner. The decision is what the whole assessment is for.',
    useIt: 'The risk register carries its findings forward; the decision governs whether the solution ships.',
    pitfalls: [
      'A generic finding that would fit any assistant.',
      'A mitigation with no owner.',
      'A decision with no rejected option.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'principles',
          label: 'The six principles',
          help: 'One row per principle, each specific to this assistant.',
          columns: [
            c('principle', 'Principle', 'select', { options: ['Fairness', 'Reliability and safety', 'Privacy and security', 'Inclusiveness', 'Transparency', 'Accountability'] }),
            c('finding', 'Finding for this assistant', 'text', { placeholder: 'It may answer worse for non-native English' }),
            c('mitigation', 'Mitigation', 'text', { placeholder: 'Test prompts in three English varieties; add a fallback' }),
            c('mit_owner', 'Owner', 'text', { placeholder: 'Jo' }),
          ],
          seed: [{ principle: 'Reliability and safety', finding: 'A wrong answer with nobody checking', mitigation: 'Grounding plus a visible disclaimer', mit_owner: 'Priya' }],
        },
      },
      { kind: 'decision', block: DEPLOY_DECISION },
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date', type: 'date', required: true },
          { field: 'signoff', label: 'Assessed by (Concepts focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'All six principles have a finding, a mitigation and an owner', when: { group: 'principles', atLeast: 6, every: { filled: ['principle', 'finding', 'mitigation', 'mit_owner'] } } },
      decisionDod(DEPLOY_DECISION),
      { label: 'The assessment is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },

  // 4 — Evaluation & Grounding Log ─────────────────────────────────────────────
  {
    id: 'aif_eval',
    courseId: 'ai-foundations',
    num: 4,
    file: '04_Evaluation_and_Grounding_Log.md',
    title: 'Evaluation & Grounding Log',
    owner: 'records',
    shared: true,
    folder: '01_Identify',
    standard: 'Model evaluation & grounding · NIST AI RMF MEASURE-2 · one change per row',
    weeks: [2, 4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['aif_governance'],
    purpose:
      'Every answer the assistant got wrong, worked to grounded the method way: the symptom first, one theory and one change per row, the failed theories kept, and the final grounded answer that cites its source.',
    howTo:
      'Write the wrong answer exactly before any theory. Change one thing per row and record the result. Keep the rows that did not work. End with the grounded, cited answer.',
    buildSteps: [
      'The prompt, the wrong answer, and exactly why it is wrong.',
      'One theory per row, one change, the result.',
      'At least one theory that was wrong, kept.',
      'The final grounded answer, citing its source.',
    ],
    meaning: 'A log with no failed theories in it is a log nobody believes. The failures are the proof the team worked the answer, not guessed at it.',
    useIt: 'Its findings feed the risk register; the final score is recorded there.',
    pitfalls: [
      'Writing "it seemed off" instead of the exact wrong output.',
      'Changing three things at once, so nobody knows which fixed it.',
      'Deleting the theories that failed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The wrong answer',
        fields: [
          { field: 'prompt', label: 'The prompt', type: 'area', required: true, placeholder: 'When do backups run? (note supplied)' },
          { field: 'wrong', label: 'The wrong answer, exactly', type: 'area', required: true, placeholder: 'Backups run at 03:00 — invented; the note says 02:00' },
          { field: 'why_wrong', label: 'Why it is wrong', type: 'text', required: true, placeholder: 'Ungrounded: a time not in the note' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'attempts',
          label: 'The attempts — one change per row',
          help: 'Theory, the one change, the result. Keep the ones that failed.',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'The instruction was too loose' }),
            c('change', 'The one change', 'text', { placeholder: 'Add: answer only from the note' }),
            c('result', 'Result', 'select', { options: ['Grounded it', 'No change — theory wrong', 'Partly — new issue'] }),
          ],
          seed: [{ theory: 'Instruction too loose', change: 'Answer only from the note', result: 'Grounded it' }],
        },
      },
      {
        kind: 'fields',
        title: 'The grounded answer',
        fields: [
          { field: 'grounded', label: 'The final grounded answer', type: 'area', required: true, placeholder: 'Backups run at 02:00. [source: studio-notes.txt]' },
          { field: 'cites', label: 'It cites its source', type: 'select', required: true, options: YN },
          { field: 'score', label: 'Final score against the labelled set', type: 'text', placeholder: '5 of 5 correct' },
        ],
      },
    ],
    dod: [
      { label: 'The wrong answer is written exactly, with why', when: { fields: ['prompt', 'wrong', 'why_wrong'] } },
      { label: 'Every attempt is a row, and at least one theory was wrong', when: { group: 'attempts', atLeast: 2, some: { column: 'result', equals: 'No change — theory wrong' } } },
      { label: 'The final answer is grounded and cites its source', when: { all: [{ fields: ['grounded'] }, { field: 'cites', equals: 'Yes' }] } },
    ],
  },

  // 5 — Foundry Build Record ───────────────────────────────────────────────────
  {
    id: 'aif_build',
    courseId: 'ai-foundations',
    num: 5,
    file: '05_Foundry_Build_Record.md',
    title: 'Foundry Build Record',
    owner: 'build',
    shared: true,
    folder: '02_Build',
    standard: 'Model deployment & grounded application · AI-901 area 2 · NIST SP 800-53 CM-2',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['aif_services', 'aif_handover'],
    purpose:
      'The Azure half of the build: the Foundry project, the deployed model, and the grounded chat app that answers only from the studio documents and says when they are silent.',
    howTo:
      'Record the project and the deployment name, the endpoint without a key, and prove the app answers from the documents and refuses when they do not cover the question.',
    buildSteps: [
      'The project, the region and the deployment name.',
      'The endpoint, without the key.',
      'An answer the app gave from the documents.',
      'A question the app declined because the documents were silent.',
    ],
    meaning: 'A deployment that lists as Succeeded and an app that cites its source are the two proofs the Azure build works and is grounded.',
    useIt: 'The services and agent log builds on its endpoint; the handover records how to run and stop it.',
    pitfalls: [
      'A key pasted into the record.',
      'An app that answers from memory, not the documents.',
      'No proof the app refuses when it should.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The deployment',
        fields: [
          { field: 'project', label: 'Foundry project name', type: 'text', required: true, placeholder: 'studio-aifoundry' },
          { field: 'region', label: 'Region', type: 'text', required: true, placeholder: 'eastus' },
          { field: 'deployment', label: 'Deployment name and model', type: 'text', required: true, placeholder: 'chat · gpt-4o-mini' },
          { field: 'endpoint', label: 'Endpoint (no key)', type: 'text', required: true, placeholder: 'https://studio-aifoundry.openai.azure.com/' },
          { field: 'state', label: 'Deployment state', type: 'select', required: true, options: ['Succeeded', 'Failed', 'Pending'] },
        ],
      },
      {
        kind: 'fields',
        title: 'The grounded app',
        fields: [
          { field: 'answer', label: 'An answer from the documents (with source)', type: 'area', required: true, placeholder: 'Backups run at 02:00. [source: studio-notes.txt]' },
          { field: 'refusal', label: 'A question it declined', type: 'area', required: true, placeholder: 'Office wifi password → not covered in the studio documents' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Deployment changes — each with a rollback',
          help: 'Every change to the deployment, and how to undo it.',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'Swapped the model to gpt-4o-mini' }),
            c('reason', 'Reason', 'text', { placeholder: 'Lower cost, same quality for this task' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Redeploy the previous model name' }),
          ],
          seed: [{ change: 'Initial deployment', reason: 'Baseline', rollback: 'Delete the deployment' }],
        },
      },
    ],
    dod: [
      { label: 'A model is deployed and in the Succeeded state', when: { all: [{ fields: ['deployment'] }, { field: 'state', equals: 'Succeeded' }] } },
      { label: 'Every deployment change has a rollback', when: { group: 'changes', atLeast: 1, every: { filled: ['change', 'rollback'] } } },
      { label: 'The endpoint is recorded without a key', when: { fields: ['endpoint'] } },
      { label: 'The app answers from the documents and refuses when they are silent', when: { fields: ['answer', 'refusal'] } },
    ],
  },

  // 6 — Language, Vision & Extraction Log ───────────────────────────────────────
  {
    id: 'aif_services',
    courseId: 'ai-foundations',
    num: 6,
    file: '06_Language_Vision_and_Extraction_Log.md',
    title: 'Language, Vision & Extraction Log',
    owner: 'language',
    shared: true,
    folder: '02_Build',
    standard: 'AI services & structured extraction · AI-901 area 2 · NIST SP 800-53 SI-7',
    weeks: [3, 4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['aif_handover'],
    purpose:
      'The assistant’s senses: a language call, a vision call that reads text out of a picture, and the agent that reads a document into structured JSON with a missing field left null, not invented.',
    howTo:
      'Record the service endpoint, the sentiment or key phrases returned, the text read out of an image, and the agent’s JSON including a null for a field the document omits.',
    buildSteps: [
      'The AI Services endpoint.',
      'A language result for a sentence.',
      'The text read out of an image.',
      'The agent’s JSON, valid, with a null for a missing field.',
    ],
    meaning: 'Senses turn a chat model into a product: it can read a page, hear a sentence, and return fields another program can use.',
    useIt: 'The handover lists the services it depends on; the governance register weighs their risks.',
    pitfalls: [
      'OCR tagged as NLP.',
      'JSON with prose around it that will not parse.',
      'A missing field invented instead of null.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Language and vision',
        fields: [
          { field: 'endpoint', label: 'AI Services endpoint', type: 'text', required: true, placeholder: 'https://studio-ai.cognitiveservices.azure.com/' },
          { field: 'language', label: 'A language result (sentiment or key phrases)', type: 'text', required: true, placeholder: 'positive (0.92)' },
          { field: 'ocr', label: 'Text read out of an image', type: 'area', required: true, placeholder: 'DANGER / HIGH VOLTAGE [confidence 0.98]' },
        ],
      },
      {
        kind: 'fields',
        title: 'The extraction agent',
        fields: [
          { field: 'json', label: 'The agent’s JSON output', type: 'area', required: true, placeholder: '{"invoice_no": "A-1042", "total": "129.00", "due": null}' },
          { field: 'json_valid', label: 'The JSON parses', type: 'select', required: true, options: YN },
          { field: 'missing_null', label: 'A missing field comes back null, not invented', type: 'select', required: true, options: YN },
        ],
      },
    ],
    dod: [
      { label: 'A language and a vision call both returned a result', when: { fields: ['endpoint', 'language', 'ocr'] } },
      { label: 'The agent returns valid JSON', when: { all: [{ fields: ['json'] }, { field: 'json_valid', equals: 'Yes' }] } },
      { label: 'A missing field is null, not invented', when: { field: 'missing_null', equals: 'Yes' } },
    ],
  },

  // 7 — AI Governance & Risk Register ──────────────────────────────────────────
  {
    id: 'aif_governance',
    courseId: 'ai-foundations',
    num: 7,
    file: '07_AI_Governance_and_Risk_Register.md',
    title: 'AI Governance & Risk Register',
    owner: 'records',
    shared: true,
    folder: '03_Handover',
    standard: 'AI risk management · NIST AI RMF GOVERN & MANAGE · ISO/IEC 42001',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['aif_handover'],
    purpose:
      'The risks of the shipped solution, each with a likelihood, an impact, an owner and a mitigation, plus the final score and the cost, so the solution is somebody’s job after the demo ends.',
    howTo:
      'List each risk, rate it, give it an owner and a mitigation. Record the final evaluation score and the cost, and the plan to stop the solution.',
    buildSteps: [
      'Each risk with a likelihood, an impact, an owner and a mitigation.',
      'The final evaluation score against the Week 2 set.',
      'The cost of the solution and the plan to stop it.',
    ],
    meaning: 'Governance is the part of responsible AI that outlives the demo: a named owner per risk is what makes it work on Monday.',
    useIt: 'The handover carries it forward as the record of what the next team must watch.',
    pitfalls: [
      'A risk with no owner.',
      'A mitigation that is really a hope.',
      'No plan to stop the thing.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'The risk register',
          columns: [
            c('risk', 'Risk', 'text', { placeholder: 'The model gives a confident wrong answer' }),
            c('likelihood', 'Likelihood', 'select', { options: ['Low', 'Medium', 'High'] }),
            c('impact', 'Impact', 'select', { options: ['Low', 'Medium', 'High'] }),
            c('risk_owner', 'Owner', 'text', { placeholder: 'Priya' }),
            c('risk_mitigation', 'Mitigation', 'text', { placeholder: 'Grounding, a disclaimer and a human check' }),
          ],
          seed: [{ risk: 'Confident wrong answer', likelihood: 'Medium', impact: 'High', risk_owner: 'Priya', risk_mitigation: 'Grounding plus a human check' }],
        },
      },
      {
        kind: 'fields',
        title: 'Score and cost',
        fields: [
          { field: 'final_score', label: 'Final evaluation score', type: 'text', required: true, placeholder: '5 of 5 correct' },
          { field: 'cost', label: 'Cost of the solution', type: 'text', required: true, placeholder: '$0 — free tier, stopped at week end' },
          { field: 'stop_plan', label: 'How the solution is stopped', type: 'text', required: true, placeholder: 'Delete the deployment; keep the config in the record' },
        ],
      },
    ],
    dod: [
      { label: 'Every risk has a likelihood, impact, owner and mitigation', when: { group: 'risks', atLeast: 3, every: { filled: ['risk', 'likelihood', 'impact', 'risk_owner', 'risk_mitigation'] } } },
      { label: 'The final score and the cost are recorded', when: { fields: ['final_score', 'cost'] } },
      { label: 'There is a plan to stop the solution', when: { fields: ['stop_plan'] } },
    ],
  },

  // 8 — Handover & Solution Record ← capstone ──────────────────────────────────
  {
    id: 'aif_handover',
    courseId: 'ai-foundations',
    num: 8,
    file: '08_Handover_and_Solution_Record.md',
    title: 'Handover & Solution Record',
    owner: 'records',
    shared: true,
    capstone: true,
    folder: '03_Handover',
    standard: 'Solution handover & chain of custody · NIST SP 800-53 PL-2 · CM-8',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The solution as it really is, handed to whoever runs it next: what was built, how to run it and how to stop it, the services it depends on, the known limits, and a custody row with a hash for every artifact the course produced.',
    howTo:
      'Describe the solution in one page by reference to the other records. Say how to run it and, above all, how to stop it. List the known limits honestly. Hash every artifact into the custody log.',
    buildSteps: [
      'The solution now: the model, the app, the services, the agent.',
      'How to run it, and how to stop it so it cannot bill.',
      'The services and endpoints it depends on, without keys.',
      'Known limits: what it cannot do, and what to watch.',
      'The custody log: every prompt, transcript, image, JSON and output file, hashed.',
    ],
    meaning: 'The handover is the document the next team reads before touching the solution. Written honestly, it saves them the month you just spent.',
    useIt: 'It is the capstone: reviewed by the Build focus, approved by the Concepts focus, and issued with the solution.',
    pitfalls: [
      'Describing the plan rather than the solution as built.',
      'A key or a secret in the document. Locations only.',
      'No instruction to stop the deployment.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The solution now',
        fields: [
          { field: 'assistant', label: 'Assistant name', type: 'text', required: true, placeholder: 'studio-t1' },
          { field: 'built', label: 'What was built', type: 'area', required: true, placeholder: 'A grounded chat app on a gpt-4o-mini deployment, language and vision via AI Services, an extraction agent to JSON.' },
          { field: 'run', label: 'How to run it', type: 'area', required: true, placeholder: 'chat.py --grounding studio-notes.txt; agent.py <doc>; see the build record for the endpoint.' },
          { field: 'stop', label: 'How to stop it (so it cannot bill)', type: 'area', required: true, placeholder: 'az cognitiveservices account deployment delete …; the config stays in the build record.' },
        ],
      },
      {
        kind: 'fields',
        title: 'Depends on, and known limits',
        fields: [
          { field: 'depends', label: 'Services and endpoints (no keys)', type: 'area', required: true, placeholder: 'Foundry deployment chat; AI Services endpoint; local Ollama fallback.' },
          { field: 'limits', label: 'Known limits and what to watch', type: 'area', required: true, placeholder: 'Answers only from the supplied documents; a wrong source gives a wrong answer; watch the token cost if the free tier changes.' },
        ],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-1/grounding-run.txt', description: 'The first grounded local answer', collected_by: 'Language', datetime: '2026-10-26 10:10', location: 'studio-t1/week-1/', sha256: '7a1c…', transferred_to: 'Records', transferred_at: '2026-10-26 10:30', notes: 'for the evaluation log' },
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
      { label: 'The solution is described as built, with how to run it', when: { fields: ['assistant', 'built', 'run'] } },
      { label: 'There is an instruction to stop it so it cannot bill', when: { fields: ['stop'] } },
      { label: 'The services it depends on and its known limits are recorded', when: { fields: ['depends', 'limits'] } },
      { label: 'Every artifact is hashed into the custody log', when: everyEvidenceHashed('evidence') },
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const AI_FOUNDATIONS_DELIVERABLES: DeliverableDef[] = AI_FOUNDATIONS_FORMS;
