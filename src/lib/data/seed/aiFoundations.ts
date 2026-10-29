import type { Course, RoleDef, Step, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';
import { withAiExtensions } from '../../docs/aiExtension';
import { withModules } from '../modules';

/**
 * Microsoft Azure AI Fundamentals — the Foundry Studio (AI-901).
 *
 * AI-900 retired on 30 June 2026; AI-901 is its live replacement, built around
 * Azure AI Foundry. A four-person studio stands up one small AI assistant and
 * takes it the whole way: name the AI workloads and what each can and cannot
 * do, weigh them against the responsible-AI principles, run a free local model
 * to learn grounding first-hand, then deploy a model in Foundry, add language
 * and vision, build an agent that extracts structured data, evaluate every
 * answer against the evidence, govern the risks, and hand the solution over.
 *
 * NO PAID RESOURCES REQUIRED. The hands-on model work runs on a free local
 * model (Ollama) on the student's own machine; the Azure AI Foundry steps use
 * the free tier and are stopped at the end of each week (see `costs.ts`). Every
 * proof step runs a real command and pastes the output back; nothing is a slide.
 *
 * THE RULE THE COURSE TEACHES: ground it, then check it. Every answer a model
 * gives is checked against the records it was given, the way Week 2's evaluation
 * log works a wrong answer one theory and one change at a time until it is
 * grounded — the same method A+ uses on a dead PC.
 *
 * TWO EXAM AREAS, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`,
 * like A+). Weeks 1-2 cover "Identify AI concepts and capabilities" (40-45%);
 * Weeks 3-4 cover "Implement AI solutions by using Microsoft Foundry" (55-60%).
 * Everyone does every task; the focus decides which record a member leads and
 * reviews. Week 0 is preparation (`setup: true`) and is never graded.
 */

const ROLES: RoleDef[] = [
  {
    id: 'concepts',
    name: 'AI Concepts (Capabilities Lead)',
    mission: 'Leads the capabilities map and the responsible-AI assessment: what each workload does and its risks.',
    color: '#0369a1',
    icon: 'Brain',
  },
  {
    id: 'build',
    name: 'Foundry Build (Solution Lead)',
    mission: 'Leads the build record: the deployed model, the chat app and the agent in Foundry.',
    color: '#15803d',
    icon: 'Boxes',
  },
  {
    id: 'language',
    name: 'Language & Vision (Services Lead)',
    mission: 'Leads the services log: text, speech, vision and the data read from a document.',
    color: '#b45309',
    icon: 'Languages',
  },
  {
    id: 'records',
    name: 'Studio Records (Governance Lead)',
    mission: 'Leads the records that outlive the studio: evaluation, the risk register, custody and handover.',
    color: '#7c3aed',
    icon: 'ClipboardList',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Set up the studio',
    theme: 'Accounts, a local model, and the team',
    objective: 'Open the Azure free account, get a local model running, pick your focus and make the studio folder.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'open-the-accounts', label: 'Open the accounts, with the budget guard', tasks: ['aif-w0-accounts'] },
      { id: 'run-a-model-locally', label: 'Run a model on your own machine', tasks: ['aif-w0-local'] },
      { id: 'know-the-team-and-folder', label: 'Know your team, focus and folder', tasks: ['aif-w0-orient'] },
    ],
    milestone: 'The free account has a $1 budget alert, a local model answers a prompt offline, and the studio folder names the team and the four focuses.',
  },
  {
    number: 1,
    title: 'Identify the AI',
    theme: 'What each workload is, and what it is for',
    objective: 'Name the workloads behind real features, read what a model is made of, and ground a local model.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Identify',
    difficulty: 2,
    objectives: [
      { id: 'name-the-workloads', label: 'Name the workloads behind the features', tasks: ['aif-w1-workloads'] },
      { id: 'read-the-model', label: 'Read what a language model is made of', tasks: ['aif-w1-components'] },
      { id: 'ground-a-local-model', label: 'Ground a local model in your notes', tasks: ['aif-w1-local'] },
    ],
    milestone: 'Every feature on the map is tagged with its AI workload, prompt and completion are shown as tokens, and a local model answers from the notes and cites them.',
  },
  {
    number: 2,
    title: 'Weigh the AI',
    theme: 'Responsible AI, and whether the answer is true',
    objective: 'Assess the assistant against the six responsible-AI principles, read how a model is trained, and ground a wrong answer.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Assess',
    difficulty: 3,
    objectives: [
      { id: 'assess-responsible-ai', label: 'Assess it against the six principles', tasks: ['aif-w2-responsible'] },
      { id: 'read-training-and-metrics', label: 'Read how it is trained and measured', tasks: ['aif-w2-ml'] },
      { id: 'work-a-wrong-answer', label: 'Work a wrong answer until it is grounded', tasks: ['aif-w2-eval'] },
    ],
    milestone: 'The six principles each have a finding and a mitigation, a model is scored against a labelled set, and one ungrounded answer is fixed with the theories that failed kept in the log.',
  },
  {
    number: 3,
    title: 'Build with Foundry',
    theme: 'Deploy a model, build the app, add the senses',
    objective: 'Deploy a model in Azure AI Foundry, build a grounded chat app on it, and add language and vision services.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Build',
    difficulty: 3,
    objectives: [
      { id: 'deploy-a-model', label: 'Deploy a model in Foundry', tasks: ['aif-w3-deploy'] },
      { id: 'build-a-grounded-app', label: 'Build a grounded chat app', tasks: ['aif-w3-app'] },
      { id: 'add-language-and-vision', label: 'Add language and vision', tasks: ['aif-w3-services'] },
    ],
    milestone: 'A model is deployed and answers through the SDK, the chat app answers only from the studio documents, and a speech and a vision call return what the course expects.',
  },
  {
    number: 4,
    title: 'Ship and hand over',
    theme: 'An agent, the governance, the handover',
    objective: 'Build an agent that extracts data, score the solution, write the risk register, and hand it over.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Hand over',
    difficulty: 3,
    objectives: [
      { id: 'build-an-agent', label: 'Build an agent that extracts data', tasks: ['aif-w4-agent'] },
      { id: 'govern-and-score', label: 'Govern the risks and score the solution', tasks: ['aif-w4-govern'] },
      { id: 'hand-it-over', label: 'Hand the solution over', tasks: ['aif-w4-handover'] },
    ],
    milestone: 'An agent reads fields out of a document into JSON, the risk register carries an owner and a mitigation for each risk, and the handover record hashes every artifact.',
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
  frameworks: ['NIST_AI_RMF'],
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
  frameworks: ['NIST_AI_RMF'],
  ...extra,
});

const TASKS: Task[] = [
  // ── Week 0 — Set up the studio ──────────────────────────────────────────────
  {
    id: 'aif-w0-accounts',
    role: 'records',
    shared: true,
    week: 0,
    title: 'Open the accounts and guard the spend',
    objective: 'Open the Azure free account, set a $1 budget alert, and record who holds what.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['01_Studio_Setup_and_Access_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['Azure free account', 'Budgets and alerts', 'Least cost', 'Account hygiene'],
    tools: ['Azure portal', 'Azure CLI', 'Deliverables forms'],
    definitionOfDone: [
      'The free account is open and signed into the portal with MFA on',
      'A budget of $1 alerts by email before anything can run up a bill',
      'The register names who holds the account and who can deploy',
    ],
    steps: [
      note(
        'aif-w0-accounts-s1',
        'Open the free account and turn MFA on',
        'Azure portal',
        'Create the Azure free account for the studio and turn on multi-factor sign-in before anything else.',
        'The portal opens to a subscription the team owns, with MFA required at sign-in.',
        {
          usesForm: 'Studio Setup & Access Register',
          instructionList: [
            'Use a shared studio email the team agrees on, not a personal one.',
            'Complete the free-account sign-up; no paid tier is needed for this course.',
            'Turn on multi-factor sign-in for the account from the security settings.',
          ],
          whatItMeans: 'The account is the one thing a bill can grow on. MFA and a known owner are the first controls, before any model is deployed.',
        }
      ),
      run(
        'aif-w0-accounts-s2',
        'Set a $1 budget alert from the shell',
        'Azure portal · Cloud Shell',
        'Open Cloud Shell and create a $1 monthly budget that emails the studio before the free tier is ever exceeded.',
        [
          { cmd: 'az account show --query "{name:name, id:id, state:state}" -o table', explain: 'Confirms you are in the studio subscription before creating anything.', sample: 'Name                     Id                                    State\n-----------------------  ------------------------------------  --------\nAzure subscription 1     00000000-0000-0000-0000-000000000000  Enabled' },
          { cmd: 'az consumption budget list -o table 2>/dev/null || echo "no budget yet — create one in Cost Management"', explain: 'Lists budgets; create the $1 alert in Cost Management if none exists.', sample: 'no budget yet — create one in Cost Management' },
        ],
        ['Enabled', 'budget'],
        'A budget alert is the free-tier seatbelt: the email arrives long before a forgotten deployment can cost real money.',
        {
          usesForm: 'Studio Setup & Access Register',
          producesDeliverable: '01_Studio_Setup_and_Access_Register.md',
          outputHighlights: [{ text: 'Enabled', label: 'The subscription is live and yours.' }],
          fixes: [
            { symptom: 'az is not found in Cloud Shell?', fix: 'Use the Bash Cloud Shell from the portal top bar; the Azure CLI is built in there.' },
            { symptom: 'No permission to create a budget?', fix: 'The account owner creates it once in Cost Management, then everyone can read it.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'aif-w0-local',
    role: 'build',
    shared: true,
    week: 0,
    title: 'Run a model on your own machine',
    objective: 'Install Ollama, pull a small model, and prove it answers a prompt with no internet.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['01_Studio_Setup_and_Access_Register.md'],
    estimatedTime: '40 min',
    difficulty: 1,
    learn: ['Local inference', 'Model size and RAM', 'Prompt and completion', 'Offline AI'],
    tools: ['Ollama', 'Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'Ollama is installed and lists at least one pulled model',
      'The model answers a prompt from the command line',
      'The model and its size are recorded in the register',
    ],
    steps: [
      run(
        'aif-w0-local-s1',
        'Install Ollama and pull a small model',
        'Your own machine — a terminal',
        'Install Ollama from its official site, then pull a small model and list what you have.',
        [
          { cmd: 'ollama pull llama3.2 && ollama list', explain: 'Downloads a small model and lists the models now on disk with their sizes.', sample: 'NAME            ID            SIZE      MODIFIED\nllama3.2:latest a80c4f17acd5  2.0 GB    5 seconds ago' },
        ],
        ['llama3.2'],
        'A model small enough to run on a laptop teaches the shape of every larger one, and it runs with no account and no bill.',
        {
          usesForm: 'Studio Setup & Access Register',
          outputHighlights: [{ text: 'llama3.2', label: 'The model is on disk and ready to answer.' }],
          fixes: [
            { symptom: 'ollama is not found?', fix: 'Install it from the official download for your operating system, then open a new terminal.' },
            { symptom: 'The pull is very slow or fails?', fix: 'A smaller tag such as llama3.2:1b downloads faster on a thin connection.' },
          ],
        }
      ),
      run(
        'aif-w0-local-s2',
        'Prove it answers offline',
        'Your own machine — a terminal',
        'Ask the model one question from the command line and read the completion it writes back.',
        [
          { cmd: 'ollama run llama3.2 "In one sentence, what is a token in a language model?"', explain: 'Runs the model once and prints its completion to the terminal.', sample: 'A token is a chunk of text — often a word or part of a word — that a language model reads and predicts one at a time.' },
        ],
        ['token'],
        'The prompt goes in, the completion comes out: the whole loop of a language model, on your own machine, before a single Azure service is touched.',
        {
          usesForm: 'Studio Setup & Access Register',
          producesDeliverable: '01_Studio_Setup_and_Access_Register.md',
          outputHighlights: [{ text: 'token', label: 'The model answered the prompt locally.' }],
        }
      ),
    ],
  },
  {
    id: 'aif-w0-orient',
    role: 'concepts',
    shared: true,
    week: 0,
    title: 'Know your team, your focus and the folder',
    objective: 'Agree who leads which record, name the assistant, and make the studio folder every artifact goes in.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['01_Studio_Setup_and_Access_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'Naming', 'Evidence folders'],
    tools: ['Notes', 'Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'The assistant has a name in the pattern studio-t<team>',
      'The studio folder exists with a week-0 to week-4 layout',
    ],
    steps: [
      note(
        'aif-w0-orient-s1',
        'Pick the focus and name the assistant',
        'Anywhere — a team decision',
        'Agree who leads AI Concepts, Foundry Build, Language & Vision and Studio Records. Name the assistant studio-t and your team number, and write both into the register.',
        'Four names against four focuses, and an assistant name the whole team uses from now on.',
        {
          usesForm: 'Studio Setup & Access Register',
          whatItMeans: 'A focus is the record a member leads and reviews, not the only work they do. Everyone writes prompts and everyone pastes output.',
        }
      ),
      run(
        'aif-w0-orient-s2',
        'Make the studio folder',
        'Your own machine — a terminal',
        'Create the studio folder with a subfolder for each week. Every prompt, transcript and screenshot goes under the week it belongs to.',
        [
          { cmd: 'mkdir -p studio-t1/week-{0,1,2,3,4} && ls studio-t1', explain: 'Five week folders in one command, then reads them back. Replace t1 with your team number.', sample: 'week-0  week-1  week-2  week-3  week-4' },
        ],
        ['week-0', 'week-4'],
        'An artifact nobody can find is an artifact nobody can hash. The folder is the first custody control.',
        {
          usesForm: 'Studio Setup & Access Register',
          producesDeliverable: '01_Studio_Setup_and_Access_Register.md',
        }
      ),
    ],
  },

  // ── Week 1 — Identify the AI (exam area 1) ──────────────────────────────────
  {
    id: 'aif-w1-workloads',
    role: 'concepts',
    shared: true,
    week: 1,
    title: 'Name the workloads behind the features',
    objective: 'Take real product features and tag each with the AI workload behind it, and what that workload can and cannot do.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['02_AI_Workloads_and_Capabilities_Map.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['AI workloads', 'Machine learning vs generative AI', 'Computer vision', 'Natural language processing', 'Document intelligence'],
    tools: ['Deliverables forms', 'Notes'],
    definitionOfDone: [
      'Each feature is tagged with one AI workload and why',
      'Each workload has one thing it is good at and one limit',
      'At least one feature is marked "not AI" with the reason',
    ],
    steps: [
      note(
        'aif-w1-workloads-s1',
        'Tag ten features with their workload',
        'Deliverables forms',
        'List ten features you have used, and tag each with its AI workload: machine learning, computer vision, NLP, document intelligence or generative AI.',
        'Ten features, each with one workload tag and a sentence saying why it is that one.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          instructionList: [
            'Separate machine learning (predict from data) from generative AI (produce new content).',
            'Tag anything that reads text from a photo as computer vision or document intelligence, not NLP.',
            'Mark one rule-based feature as "not AI" and say why it is just logic.',
          ],
          whatItMeans: 'The exam, and the job, start with naming the workload correctly. The wrong workload means the wrong Azure service and the wrong cost.',
        }
      ),
      note(
        'aif-w1-workloads-s2',
        'Write one strength and one limit for each workload',
        'Deliverables forms',
        'For each of the five workloads, write one thing it does well and one thing it cannot be trusted to do.',
        'Each workload has a strength and a limit, in the team\u2019s own words.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          whatItMeans: 'Knowing the limit of a workload is what stops a team from pointing generative AI at a problem that needs a database query.',
        }
      ),
      run(
        'aif-w1-workloads-s3',
        'Confirm the Azure service for each workload',
        'Azure portal · Cloud Shell',
        'List the Azure AI service kinds available, so each workload on the map points at a real service you can create.',
        [
          { cmd: 'az cognitiveservices account list-kinds -o table', explain: 'Lists the Azure AI service kinds, one per line, so each workload maps to a creatable service.', sample: 'Result\n----------------------\nComputerVision\nFace\nSpeechServices\nTextAnalytics\nFormRecognizer\nOpenAI\nAIServices' },
        ],
        ['ComputerVision', 'AIServices'],
        'Every workload on the map has to land on a real Azure service; this is the list those names come from.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          producesDeliverable: '02_AI_Workloads_and_Capabilities_Map.md',
          outputHighlights: [{ text: 'AIServices', label: 'The multi-service resource most of the course uses.' }],
          fixes: [{ symptom: 'The command returns an error about the provider?', fix: 'Run `az provider register --namespace Microsoft.CognitiveServices` once, then try again.' }],
        }
      ),
    ],
  },
  {
    id: 'aif-w1-components',
    role: 'build',
    shared: true,
    week: 1,
    title: 'Read what a language model is made of',
    objective: 'See a prompt become tokens and a completion, and read the parts of a model: parameters, context window and temperature.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['02_AI_Workloads_and_Capabilities_Map.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Tokens', 'Context window', 'Parameters', 'Temperature', 'Embeddings'],
    tools: ['Ollama', 'Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'A prompt is shown broken into tokens, with the count',
      'The same prompt is run at two temperatures and the difference recorded',
      'The context-window and parameter size of the local model are recorded',
    ],
    steps: [
      run(
        'aif-w1-components-s1',
        'Show the model details and its sizes',
        'Your own machine — a terminal',
        'Read the local model\u2019s parameter count and context length from Ollama and record them.',
        [
          { cmd: 'ollama show llama3.2 | grep -Ei "parameters|context|quantization"', explain: 'Prints the model\u2019s parameter count, context window and quantization.', sample: '    parameters            3.2B\n    context length        131072\n    quantization          Q4_K_M' },
        ],
        ['parameters', 'context'],
        'Parameters are what the model learned; the context window is how much it can read at once. Both decide what it can do and what it costs.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          outputHighlights: [{ text: 'context length        131072', label: 'How many tokens the model can hold in view at once.' }],
        }
      ),
      run(
        'aif-w1-components-s2',
        'Run the same prompt hot and cold',
        'Your own machine — a terminal',
        'Run one prompt at temperature 0 and again at temperature 1, and record how the answers differ.',
        [
          { cmd: 'ollama run llama3.2 --format json <<< \'{"prompt":"Name a colour.","options":{"temperature":0}}\'; echo "--- now hot ---"; ollama run llama3.2 "Name a colour. Be creative."', explain: 'The first run is deterministic; the second is free to vary. Compare the two.', sample: 'blue\n--- now hot ---\nHow about "vermilion"? It is a vivid reddish-orange.' },
        ],
        ['---'],
        'Temperature is the one dial that turns a model from a lookup into a brainstorm. For a grounded assistant you want it low.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          producesDeliverable: '02_AI_Workloads_and_Capabilities_Map.md',
        }
      ),
      note(
        'aif-w1-components-s3',
        'Write the parts in the team\u2019s words',
        'Deliverables forms',
        'In the map, write one plain sentence each for tokens, context window, parameters and temperature, using what you just saw.',
        'Four parts of a model, each explained from the run you just did, not from a textbook.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          whatItMeans: 'A team that can say what a token and a context window are will not be surprised by a truncated answer or a bill by the token later.',
        }
      ),
    ],
  },
  {
    id: 'aif-w1-local',
    role: 'language',
    shared: true,
    week: 1,
    title: 'Ground a local model in your notes',
    objective: 'Give the local model a short note and make it answer only from that note, citing it, rather than from memory.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['02_AI_Workloads_and_Capabilities_Map.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Grounding', 'Context stuffing', 'Hallucination', 'Citations'],
    tools: ['Ollama', 'Terminal', 'Deliverables forms'],
    prerequisites: ['A local model that runs (Week 0)', 'A short plain-text note the model has never seen'],
    definitionOfDone: [
      'The model answers a question correctly from the supplied note',
      'The model is shown refusing or hedging when the note does not cover the question',
      'Both runs are saved to the week-1 folder',
    ],
    steps: [
      run(
        'aif-w1-local-s1',
        'Answer from the note, not from memory',
        'Your own machine — a terminal',
        'Write a two-line note the model could not know, then ask a question about it with the note pasted in as the only context.',
        [
          { cmd: 'printf \'Studio rule: backups run at 02:00 and are kept 30 days.\\nAsk only about this note.\\nQuestion: when do backups run?\\n\' | ollama run llama3.2', explain: 'Feeds the note plus the question; the answer should come from the note.', sample: 'Backups run at 02:00, and they are kept for 30 days.' },
        ],
        ['02:00'],
        'Grounding means the model answers from the text you gave it, so the answer can be checked. This is the whole idea behind the chat app in Week 3.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          outputHighlights: [{ text: '02:00', label: 'The answer came from the note, not from training.' }],
        }
      ),
      run(
        'aif-w1-local-s2',
        'Catch it when the note does not cover the question',
        'Your own machine — a terminal',
        'Ask the model something the note does not answer, and see whether it admits it or makes something up.',
        [
          { cmd: 'printf \'Studio rule: backups run at 02:00 and are kept 30 days.\\nAnswer only from this note; if it is not covered, say so.\\nQuestion: what is the restore time?\\n\' | ollama run llama3.2', explain: 'The note says nothing about restore time; a grounded answer says so rather than inventing a figure.', sample: 'The note does not say what the restore time is.' },
        ],
        ['not'],
        'A model that invents a restore time is hallucinating. Telling it to answer only from the note, and to say when it cannot, is the cheapest guardrail there is.',
        {
          usesForm: 'AI Workloads & Capabilities Map',
          producesDeliverable: '02_AI_Workloads_and_Capabilities_Map.md',
          fixes: [{ symptom: 'The model invents a restore time anyway?', fix: 'Make the instruction stricter: "If the note does not contain the answer, reply exactly: not in the note." Small models obey a sharp rule better than a soft one.' }],
        }
      ),
    ],
  },

  // ── Week 2 — Weigh the AI (exam area 1) ─────────────────────────────────────
  {
    id: 'aif-w2-responsible',
    role: 'concepts',
    shared: true,
    week: 2,
    title: 'Assess it against the six principles',
    objective: 'Walk the assistant through Microsoft\u2019s six responsible-AI principles and write a finding and a mitigation for each.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['03_Responsible_AI_Assessment.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Fairness', 'Reliability and safety', 'Privacy and security', 'Inclusiveness', 'Transparency', 'Accountability'],
    tools: ['Deliverables forms'],
    definitionOfDone: [
      'Each of the six principles has a finding specific to this assistant',
      'Each finding has a mitigation the team can actually do',
      'The deployment decision is recorded with the option rejected and the risk accepted',
    ],
    steps: [
      note(
        'aif-w2-responsible-s1',
        'Write a finding for each of the six principles',
        'Deliverables forms',
        'For fairness, reliability and safety, privacy and security, inclusiveness, transparency and accountability, write one finding about this specific assistant.',
        'Six findings, each naming a real risk of this assistant, not a generic sentence.',
        {
          usesForm: 'Responsible AI Assessment',
          instructionList: [
            'Fairness: who could get a worse answer, and why?',
            'Reliability and safety: what happens when the model is wrong and nobody checks?',
            'Privacy: what data goes into the prompt, and where does it go?',
            'Transparency: does the user know they are talking to an AI, and its limits?',
          ],
          whatItMeans: 'Responsible AI is a section of the exam and the first question a real customer asks. A finding per principle turns a slogan into a checklist.',
        }
      ),
      note(
        'aif-w2-responsible-s2',
        'Write a mitigation for each finding',
        'Deliverables forms',
        'Beside each finding, write the one mitigation the team will put in place, and who owns it.',
        'Six mitigations, each doable this month, each with an owner.',
        {
          usesForm: 'Responsible AI Assessment',
          whatItMeans: 'A finding with no mitigation is a complaint. The mitigation and the owner are what turn the assessment into work that gets done.',
        }
      ),
      note(
        'aif-w2-responsible-s3',
        'Record the deployment decision',
        'Deliverables forms',
        'With the findings in front of the team, record the decision: ship it, ship it with limits, or hold it. Name the option rejected and the risk accepted.',
        'A recorded decision with its reason, the rejected option and the accepted risk.',
        {
          usesForm: 'Responsible AI Assessment',
          producesDeliverable: '03_Responsible_AI_Assessment.md',
          whatItMeans: 'The decision is the drafter\u2019s to make and to own. Writing the rejected option is what proves a choice was made, not defaulted into.',
        }
      ),
    ],
  },
  {
    id: 'aif-w2-ml',
    role: 'build',
    shared: true,
    week: 2,
    title: 'Read how it is trained and measured',
    objective: 'See the shape of a training set and a metric, so "accuracy" and "evaluation" mean something concrete.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['03_Responsible_AI_Assessment.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Training and test split', 'Labels', 'Accuracy and precision', 'Overfitting', 'Evaluation set'],
    tools: ['Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'A small labelled set is written, with the label for each row',
      'The model is scored against it and the score recorded',
      'One wrong prediction is read and explained',
    ],
    steps: [
      run(
        'aif-w2-ml-s1',
        'Write a tiny labelled test set',
        'Your own machine — a terminal',
        'Write five short messages, each labelled spam or ham, as the known-answer set you will score the model against.',
        [
          { cmd: 'printf \'win a prize now\\tspam\\nlunch at noon?\\tham\\nclaim your refund\\tspam\\nproject due friday\\tham\\nfree gift card\\tspam\\n\' | tee labels.tsv | wc -l', explain: 'Writes five labelled rows to a file and prints the row count.', sample: '5' },
        ],
        ['5'],
        'A labelled set is the only thing that turns "it seems good" into a number. Five rows is enough to teach the shape.',
        {
          usesForm: 'Responsible AI Assessment',
          outputHighlights: [{ text: '5', label: 'Five known answers to score against.' }],
        }
      ),
      run(
        'aif-w2-ml-s2',
        'Score the model and read a miss',
        'Your own machine — a terminal',
        'Ask the model to label each message, compare to the known answer, and count how many it got right.',
        [
          { cmd: 'while IFS=$\'\\t\' read -r msg want; do got=$(ollama run llama3.2 "Reply with one word, spam or ham: $msg"); printf \'%s\\twant=%s\\tgot=%s\\n\' "$msg" "$want" "$got"; done < labels.tsv', explain: 'Runs each row through the model and prints the wanted vs the predicted label.', sample: 'win a prize now\twant=spam\tgot=spam\nlunch at noon?\twant=ham\tgot=ham\nclaim your refund\twant=spam\tgot=spam\nproject due friday\twant=ham\tgot=ham\nfree gift card\twant=spam\tgot=spam' },
        ],
        ['want=', 'got='],
        'This is evaluation in miniature: a prediction beside a known answer. Accuracy is just how many of these lines match.',
        {
          usesForm: 'Responsible AI Assessment',
          producesDeliverable: '03_Responsible_AI_Assessment.md',
          fixes: [{ symptom: 'The model replies with a sentence, not one word?', fix: 'Tighten the prompt: "Reply with exactly one word: spam or ham." Record that prompt change as part of the result.' }],
        }
      ),
    ],
  },
  {
    id: 'aif-w2-eval',
    role: 'records',
    shared: true,
    week: 2,
    title: 'Work a wrong answer until it is grounded',
    objective: 'Take an answer the model got wrong and work it the method way: one theory, one change, one result per row, until it is grounded.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['04_Evaluation_and_Grounding_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Root-cause for AI answers', 'Prompt vs context vs model', 'One change at a time', 'Grounding fixes'],
    tools: ['Ollama', 'Terminal', 'Deliverables forms'],
    prerequisites: ['A model answer that is wrong or ungrounded, from Week 1 or 2'],
    definitionOfDone: [
      'The wrong answer is written exactly, before any theory',
      'Every attempt is a row: theory, the one change, the result',
      'At least one theory was wrong and the row says so',
      'The fixed answer is grounded and cites the note',
    ],
    steps: [
      note(
        'aif-w2-eval-s1',
        'Write the wrong answer exactly',
        'Deliverables forms',
        'Before any theory, write the prompt, the answer the model gave, and exactly why it is wrong or ungrounded.',
        'The log opens with the prompt, the wrong answer and why it is wrong, and no theory yet.',
        {
          usesForm: 'Evaluation & Grounding Log',
          whatItMeans: 'The method starts with the symptom written down. For an AI answer the symptom is the exact wrong output, not "it seems off".',
        }
      ),
      run(
        'aif-w2-eval-s2',
        'Change one thing per row and record the result',
        'Your own machine — a terminal',
        'Write one theory for why it is wrong, change exactly one thing to test it, and record the result. A wrong theory gets its own row.',
        [
          { cmd: 'ollama run llama3.2 "Answer only from this note; if missing, say not in the note. Note: backups run 02:00. Q: when do backups run?"', explain: 'Tests one theory: the earlier answer drifted because the instruction was loose. Tighten it and re-run.', sample: 'Backups run at 02:00.' },
        ],
        ['02:00'],
        'One change per row is what makes the log trustworthy: you can always say which change fixed it. The same method A+ uses on hardware.',
        {
          usesForm: 'Evaluation & Grounding Log',
          outputHighlights: [{ text: '02:00', label: 'The tightened instruction grounded the answer.' }],
          fixes: [
            { symptom: 'Changing the prompt did not help?', fix: 'Change the next single thing: add the note to context, or lower temperature. One change per row.' },
          ],
        }
      ),
      note(
        'aif-w2-eval-s3',
        'Record the grounded answer and the failed theories',
        'Deliverables forms',
        'Write the final grounded answer, confirm it cites the note, and keep the rows for the theories that did not work.',
        'The log ends with a grounded, cited answer and keeps every theory that failed on the way.',
        {
          usesForm: 'Evaluation & Grounding Log',
          producesDeliverable: '04_Evaluation_and_Grounding_Log.md',
          whatItMeans: 'A log with no failed theories in it is a log nobody believes. The failures are the proof the team actually worked the problem.',
        }
      ),
    ],
  },

  // ── Week 3 — Build with Foundry (exam area 2) ───────────────────────────────
  {
    id: 'aif-w3-deploy',
    role: 'build',
    shared: true,
    week: 3,
    title: 'Deploy a model in Foundry',
    objective: 'Create an Azure AI Foundry project, deploy a model, and call it once from the shell.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['05_Foundry_Build_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Azure AI Foundry', 'Model deployment', 'Endpoints and keys', 'Keyless access'],
    tools: ['Azure AI Foundry', 'Azure CLI', 'Deliverables forms'],
    prerequisites: ['The Azure free account with a budget alert (Week 0)'],
    definitionOfDone: [
      'A Foundry project exists and a model is deployed in it',
      'The deployment answers one call from the shell',
      'The endpoint is recorded and no key is pasted into the record',
    ],
    cost: { usd: 0, per: 'run', note: 'Free-tier model; stop the deployment at week end.' },
    steps: [
      note(
        'aif-w3-deploy-s1',
        'Create the project and deploy a model',
        'Azure AI Foundry portal',
        'In Azure AI Foundry, create a project, then deploy a small chat model from the catalogue into it.',
        'A Foundry project holds one deployed chat model with a deployment name the team chose.',
        {
          usesForm: 'Foundry Build Record',
          instructionList: [
            'Create the project in a region the free tier supports.',
            'Deploy a small chat model; note the deployment name, you call it by that.',
            'Prefer keyless (Entra) access over a pasted key where the portal offers it.',
          ],
          whatItMeans: 'Foundry is where the course\u2019s Azure half lives: a project is the box a deployment, data and an agent all sit in.',
        }
      ),
      run(
        'aif-w3-deploy-s2',
        'Call the deployment once',
        'Azure portal · Cloud Shell',
        'List your deployments and send one test prompt to confirm the model answers through the endpoint.',
        [
          { cmd: 'az cognitiveservices account deployment list -g studio-rg -n studio-aifoundry -o table', explain: 'Lists the deployments in the project; your deployment name should appear.', sample: 'Name          Model            Version   State\n------------  ---------------  --------  ---------\nchat          gpt-4o-mini      2024-07   Succeeded' },
        ],
        ['Succeeded'],
        'A deployment that lists as Succeeded is the proof the model is live and callable before any app is written against it.',
        {
          usesForm: 'Foundry Build Record',
          producesDeliverable: '05_Foundry_Build_Record.md',
          outputHighlights: [{ text: 'Succeeded', label: 'The model is deployed and ready to call.' }],
          fixes: [
            { symptom: 'The deployment is not listed?', fix: 'Check the resource group and account name match the portal; the names are case-sensitive.' },
            { symptom: 'A quota error on deploy?', fix: 'Pick a smaller model or a different region; the free tier has per-region quota.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'aif-w3-app',
    role: 'build',
    shared: true,
    week: 3,
    title: 'Build a grounded chat app',
    objective: 'Write a tiny chat client that answers only from the studio documents, the grounding you proved locally in Week 1.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['05_Foundry_Build_Record.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 3,
    learn: ['Chat completions', 'System prompt', 'Grounding with your data', 'Refusing when unsure'],
    tools: ['Python', 'Ollama', 'Deliverables forms'],
    prerequisites: ['A deployed model (this week) or the local model (Week 0) as a fallback'],
    definitionOfDone: [
      'The app answers a question from the studio documents',
      'The app says when the documents do not cover a question',
      'The transcript is saved to the week-3 folder',
    ],
    cost: { usd: 0, per: 'run', note: 'Falls back to the free local model if the Foundry free tier is exhausted.' },
    steps: [
      run(
        'aif-w3-app-s1',
        'Answer from the documents',
        'Your own machine — a terminal',
        'Run the chat client with a studio document as context and ask a question it answers.',
        [
          { cmd: 'python chat.py --grounding studio-notes.txt --ask "when do backups run?"', explain: 'Loads the document as the only context and answers from it.', sample: 'Backups run at 02:00 and are kept for 30 days. [source: studio-notes.txt]' },
        ],
        ['source'],
        'A grounded app is just the Week 1 trick wired up: the document goes in the context, the model answers from it, and the answer cites it.',
        {
          usesForm: 'Foundry Build Record',
          outputHighlights: [{ text: 'source', label: 'The answer cites the document it came from.' }],
          fixes: [{ symptom: 'No Azure quota left?', fix: 'Point the client at the local Ollama model; the grounding logic is identical.' }],
        }
      ),
      run(
        'aif-w3-app-s2',
        'Refuse when the documents are silent',
        'Your own machine — a terminal',
        'Ask the app something the documents do not cover and confirm it declines rather than inventing an answer.',
        [
          { cmd: 'python chat.py --grounding studio-notes.txt --ask "what is the office wifi password?"', explain: 'The documents do not cover this; a grounded app says so.', sample: 'That is not covered in the studio documents.' },
        ],
        ['not covered'],
        'The refusal is the feature. An assistant that admits what it does not know is one a customer can trust with the answers it does give.',
        {
          usesForm: 'Foundry Build Record',
          producesDeliverable: '05_Foundry_Build_Record.md',
        }
      ),
    ],
  },
  {
    id: 'aif-w3-services',
    role: 'language',
    shared: true,
    week: 3,
    title: 'Add language and vision',
    objective: 'Call a language service and a vision service, so the assistant can read text aloud and read text out of a picture.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['06_Language_Vision_and_Extraction_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Azure AI Language', 'Azure AI Vision', 'OCR', 'Sentiment and key phrases'],
    tools: ['Azure AI Services', 'Azure CLI', 'Deliverables forms'],
    prerequisites: ['An Azure AI Services (multi-service) resource'],
    definitionOfDone: [
      'A language call returns sentiment or key phrases for a sentence',
      'A vision call returns the text read out of an image',
      'Both responses are saved to the week-3 folder',
    ],
    cost: { usd: 0, per: 'run', note: 'Free tier (F0) of Azure AI Services covers the course calls.' },
    steps: [
      run(
        'aif-w3-services-s1',
        'Read sentiment from a sentence',
        'Azure portal · Cloud Shell',
        'Send one sentence to the Language service and read back its sentiment.',
        [
          { cmd: 'az cognitiveservices account show -g studio-rg -n studio-ai --query "properties.endpoint" -o tsv', explain: 'Prints the endpoint the language and vision calls use. Confirms the resource is ready.', sample: 'https://studio-ai.cognitiveservices.azure.com/' },
        ],
        ['https://'],
        'One multi-service resource gives you language and vision behind one endpoint, which is the cheapest way to add senses to the assistant.',
        {
          usesForm: 'Language, Vision & Extraction Log',
          outputHighlights: [{ text: 'https://', label: 'The endpoint both services answer on.' }],
          fixes: [{ symptom: 'The resource is not found?', fix: 'Create an Azure AI Services (multi-service) resource on the F0 free tier first, then re-run.' }],
        }
      ),
      run(
        'aif-w3-services-s2',
        'Read text out of an image',
        'Your own machine — a terminal',
        'Send an image of some text to the Vision read endpoint and confirm the text comes back.',
        [
          { cmd: 'python ocr.py sign.jpg | tee week-3/ocr-result.txt', explain: 'Sends the image to the Vision read API and prints the text it recognised.', sample: 'DANGER\nHIGH VOLTAGE\n[confidence 0.98]' },
        ],
        ['confidence'],
        'Reading text out of a photo is computer vision, not NLP: the same map tag you wrote in Week 1, now a working call.',
        {
          usesForm: 'Language, Vision & Extraction Log',
          producesDeliverable: '06_Language_Vision_and_Extraction_Log.md',
        }
      ),
    ],
  },

  // ── Week 4 — Ship and hand over (exam area 2) ───────────────────────────────
  {
    id: 'aif-w4-agent',
    role: 'build',
    shared: true,
    week: 4,
    title: 'Build an agent that extracts data',
    objective: 'Build a small agent that reads a document and returns the fields as structured JSON, not prose.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['06_Language_Vision_and_Extraction_Log.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['Agents', 'Tools and function calling', 'Structured output', 'Document intelligence'],
    tools: ['Azure AI Foundry', 'Python', 'Deliverables forms'],
    prerequisites: ['A deployed model (Week 3) or the local model as a fallback'],
    definitionOfDone: [
      'The agent returns the document fields as valid JSON',
      'A field missing from the document comes back null, not invented',
      'The JSON is saved to the week-4 folder',
    ],
    cost: { usd: 0, per: 'run', note: 'Runs on the free tier or the local model.' },
    steps: [
      run(
        'aif-w4-agent-s1',
        'Extract the fields as JSON',
        'Your own machine — a terminal',
        'Run the agent over an invoice-like text and confirm it returns the fields as valid JSON.',
        [
          { cmd: 'python agent.py invoice.txt | tee week-4/fields.json && python -c "import json,sys;json.load(open(\'week-4/fields.json\'));print(\'valid json\')"', explain: 'Runs the extraction agent, saves the JSON, then proves it parses.', sample: '{"invoice_no": "A-1042", "total": "129.00", "due": "2026-07-01"}\nvalid json' },
        ],
        ['valid json'],
        'Structured output is what turns a chat model into a tool another program can use: fields, not a paragraph a human must re-read.',
        {
          usesForm: 'Language, Vision & Extraction Log',
          outputHighlights: [{ text: 'valid json', label: 'The agent returned parseable structured data.' }],
          fixes: [{ symptom: 'The JSON will not parse?', fix: 'Add "Return only JSON, no prose" to the system prompt and re-run; strip any markdown fences in code.' }],
        }
      ),
      run(
        'aif-w4-agent-s2',
        'Make a missing field null, not invented',
        'Your own machine — a terminal',
        'Run the agent over a document that omits a field and confirm that field is null rather than guessed.',
        [
          { cmd: 'python agent.py invoice-no-due.txt | python -c "import json,sys;d=json.load(sys.stdin);print(\'due:\',d[\'due\'])"', explain: 'The due date is missing from this document; a careful agent returns null.', sample: 'due: None' },
        ],
        ['due:'],
        'An agent that invents a due date is the document-intelligence version of a hallucination. Null is the honest answer and the safe one.',
        {
          usesForm: 'Language, Vision & Extraction Log',
          producesDeliverable: '06_Language_Vision_and_Extraction_Log.md',
        }
      ),
    ],
  },
  {
    id: 'aif-w4-govern',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Govern the risks and score the solution',
    objective: 'Write the risk register for the solution and score it against the evaluation set one last time.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['07_AI_Governance_and_Risk_Register.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['AI risk register', 'Owners and mitigations', 'Content safety', 'Cost governance'],
    tools: ['Deliverables forms'],
    definitionOfDone: [
      'Each risk has a likelihood, an impact, an owner and a mitigation',
      'The final evaluation score is recorded against the Week 2 set',
      'The cost of the solution is recorded, and the plan to stop it',
    ],
    steps: [
      note(
        'aif-w4-govern-s1',
        'Write the risk register',
        'Deliverables forms',
        'List the solution\u2019s risks \u2014 a wrong answer, a leaked prompt, an unexpected bill \u2014 and give each a likelihood, an impact, an owner and a mitigation.',
        'A risk register where every row has an owner and a mitigation, not just a worry.',
        {
          usesForm: 'AI Governance & Risk Register',
          whatItMeans: 'Governance is the part of responsible AI that outlives the demo: a named owner for each risk is what makes it somebody\u2019s job on Monday.',
        }
      ),
      run(
        'aif-w4-govern-s2',
        'Score the solution one last time',
        'Your own machine — a terminal',
        'Run the Week 2 labelled set against the shipped solution and record the final score beside the earlier one.',
        [
          { cmd: 'bash score.sh labels.tsv | tee week-4/final-score.txt', explain: 'Runs the labelled set and prints the final accuracy of the shipped solution.', sample: 'scored 5 rows: 5 correct (100%)' },
        ],
        ['correct'],
        'Scoring the shipped thing against the same set, not a new one, is the only honest way to say it got better or worse.',
        {
          usesForm: 'AI Governance & Risk Register',
          producesDeliverable: '07_AI_Governance_and_Risk_Register.md',
          outputHighlights: [{ text: 'correct', label: 'The final measured accuracy of the solution.' }],
        }
      ),
    ],
  },
  {
    id: 'aif-w4-handover',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Hand the solution over',
    objective: 'Assemble the handover record: what was built, how it is run and stopped, and a hashed custody row for every artifact.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['08_Handover_and_Solution_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Handover', 'Runbook', 'Chain of custody', 'Hashing evidence'],
    tools: ['Terminal', 'Deliverables forms'],
    prerequisites: ['Every other record of the course, filled'],
    definitionOfDone: [
      'The record says what was built, how to run it and how to stop it',
      'Every artifact has a custody row with its hash',
      'The solution is stopped so it cannot run up a bill after handover',
    ],
    steps: [
      note(
        'aif-w4-handover-s1',
        'Write what was built and how to run it',
        'Deliverables forms',
        'Write the solution in one page: the model, the app, the services, the agent, how to run it and, above all, how to stop it.',
        'A one-page record a new team could run the solution from, including how to turn it off.',
        {
          usesForm: 'Handover & Solution Record',
          whatItMeans: 'A handover that does not say how to stop the thing is how a free-tier demo becomes a surprise invoice.',
        }
      ),
      run(
        'aif-w4-handover-s2',
        'Hash every artifact for custody',
        'Your own machine — a terminal',
        'Hash every file in the studio folder so the handover carries a custody row that proves what was delivered.',
        [
          { cmd: 'find studio-t1 -type f -exec sha256sum {} + | tee week-4/custody.txt | wc -l && echo "custody.txt written"', explain: 'Hashes every artifact and counts them, writing the custody list for the record.', sample: '17\ncustody.txt written' },
        ],
        ['custody.txt'],
        'A hash is what lets anyone, months later, prove the file in hand is the file delivered. It is the last control of the course.',
        {
          usesForm: 'Handover & Solution Record',
          producesDeliverable: '08_Handover_and_Solution_Record.md',
          outputHighlights: [{ text: 'custody.txt', label: 'Every artifact hashed into one custody list.' }],
        }
      ),
      run(
        'aif-w4-handover-s3',
        'Stop the solution so it cannot bill',
        'Azure portal · Cloud Shell',
        'Delete or stop the Foundry deployment and the AI Services resource so nothing runs after handover, and confirm it is gone.',
        [
          { cmd: 'az cognitiveservices account deployment delete -g studio-rg -n studio-aifoundry --deployment-name chat && echo "deployment stopped"', explain: 'Removes the deployment so it cannot answer or bill, then confirms.', sample: 'deployment stopped' },
        ],
        ['stopped'],
        'Stopping the deployment is the responsible-AI principle of accountability made concrete: the team leaves nothing running it is not watching.',
        {
          usesForm: 'Handover & Solution Record',
          fixes: [{ symptom: 'You want to keep it for the portfolio demo?', fix: 'Keep the resource but delete the deployment; the config stays in the record and nothing bills by the token.' }],
        }
      ),
    ],
  },
];

export const AI_FOUNDATIONS: Course = withModules(withAiExtensions(withPortfolioStep({
  id: 'ai-foundations',
  title: 'Azure AI Fundamentals — the Foundry Studio',
  slug: 'ai-foundations',
  description:
    'Stand up one small AI assistant on Azure AI Foundry and a free local model: name the workloads, weigh the responsible-AI principles, ground every answer, add language, vision and an agent, then hand it over. Built for AI-901.',
  vendor: 'Microsoft',
  certification: 'Azure AI Fundamentals (AI-901)',
  level: 'entry',
  audience:
    'Build, evaluate and hand over one small AI assistant as a four-person studio — everyone writes prompts, pastes the proof and fills every record; the focus decides which record you lead.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  // One shared studio: every member works every task, and the focus is the
  // record they lead and review.
  sharedTrack: true,
  // No week locks. A team waiting on an Azure quota still works the weeks it can.
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  // The studio picture: the local model, the Foundry project and its senses,
  // the evidence, and the records lane. Drawn from `aiFoundationsContent.ts`.
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Set up', detail: 'The account with a budget guard, a local model, the folder.' },
    { label: 'Identify', detail: 'Name the workloads, read the model, ground a local answer.' },
    { label: 'Assess', detail: 'The six responsible-AI principles, and whether the answer is true.' },
    { label: 'Build', detail: 'Deploy a model, build a grounded app, add language and vision.' },
    { label: 'Ship', detail: 'An agent that extracts data, the risk register, a final score.' },
    { label: 'Hand over', detail: 'The runbook, custody for every artifact, and the solution stopped.' },
  ],
  isSeed: true,
  version: 1,
})));
