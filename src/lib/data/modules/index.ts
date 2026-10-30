import type { Course, Step, Task, WeekDef, WeekObjective, Track } from '../../types';

/**
 * R144 — attachable modules: the non-certification topics of the owner's
 * blueprint (RAG engineering, AI agents and MCP, local LLM serving, AI
 * security validation, the enterprise AI architecture capstone piece), built
 * as self-contained advanced weeks a course carries on top of its exam.
 *
 * The owner's rule: a topic with no exam of its own "has to be a module that
 * can be added to a course but separate from being a course." So a module is
 * not a `Course`; it is a set of advanced weeks (each tagged `ai` or `cyber`,
 * so it is tracked and priced as premium) attached to real courses by
 * `MODULE_PLAN`. `attachModules` appends the weeks and their shared tasks;
 * `moduleSkills`/`modulePractices` emit the registry fragments the ontology
 * joins on, so a course cannot carry a module task without publishing what it
 * teaches. Every step is authored to the strict contract, so a module attaches
 * cleanly even to SecAI+ and CISSP.
 *
 * Modules carry no forms (the course's own Portfolio is the deployable
 * artifact); they add premium, optional weeks of hands-on AI and AI-security
 * work. A module week is never graded, so it holds no stone and earns no mark.
 */

/** A module task, before it is bound to a course (the course prefix makes its id). */
export interface ModuleTask {
  key: string;
  title: string;
  objective: string;
  /** The command the first step runs, with its illustrative output and the token that proves it. */
  cmd: string;
  explain: string;
  sample: string;
  flags: { flag: string; meaning: string }[];
  verify: string;
  /** The second step's one-line instruction and its result sentence. */
  check: string;
  checkActions: [string, string, string];
  result: string;
  instruction: string;
  actions: [string, string, string];
  whatItMeans1: string;
  whatItMeans2: string;
  skills: string[];
  practices: string[];
  tools: string[];
  learn: string[];
}

export interface ModuleWeek {
  title: string;
  theme: string;
  objective: string;
  difficulty: 1 | 2 | 3 | 4;
  tasks: ModuleTask[];
}

export interface CourseModule {
  id: string;
  title: string;
  track: Track;
  blurb: string;
  /** The official page every step of the module cites, and what to look for there. */
  doc: { title: string; url: string; lookFor: string };
  weeks: ModuleWeek[];
}

const NIST_AI = { title: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', lookFor: 'the Map and Manage functions: know the AI system, and keep a person accountable for it.' };
const OWASP_LLM = { title: 'OWASP Top 10 for LLM Applications', url: 'https://genai.owasp.org/', lookFor: 'the ten risks: prompt injection, insecure output, data leakage, and how each is tested.' };

const mt = (t: ModuleTask): ModuleTask => t;

export const MODULES: Record<string, CourseModule> = {
  'rag-engineering': {
    id: 'rag-engineering', title: 'RAG engineering', track: 'ai', doc: NIST_AI,
    blurb: 'Connect a model to your own documents: embeddings, a vector store, retrieval and an honest evaluation.',
    weeks: [
      {
        title: 'Index your documents', theme: 'Embeddings and a vector store', objective: 'Load a folder of records into a vector store and query it for the right passage.', difficulty: 3,
        tasks: [
          mt({ key: 'index', title: 'Index a document set', objective: 'Chunk a folder of records, embed the chunks and load them into a local vector store.',
            instruction: 'Embed your records into a vector store.', actions: ['Collect a folder of the team records as plain text.', 'Run the indexer to chunk and embed them.', 'Confirm the store reports the chunk count.'],
            cmd: 'python index.py ./records && python -c "import chromadb;print(chromadb.PersistentClient(\'db\').get_collection(\'records\').count(),\'chunks\')"', explain: 'Chunks and embeds the records, then prints how many chunks the store holds.', sample: '42 chunks', flags: [{ flag: 'index.py ./records', meaning: 'Reads the folder, splits each file and embeds the pieces.' }, { flag: 'get_collection().count()', meaning: 'Prints the number of stored chunks.' }], verify: 'chunks',
            whatItMeans1: 'A vector store holds the meaning of each passage, so a question can find the passage that answers it.',
            check: 'Query the store and read the top passage.', checkActions: ['Ask the store a question the records answer.', 'Read the passages it returns, nearest first.', 'Confirm the top passage is the right one.'], result: 'The store returns the passage that answers the question, nearest first.',
            whatItMeans2: 'Retrieval is only as good as the chunks: too large and it is vague, too small and it loses context.',
            skills: ['comp.ai.vector-store', 'comp.ai.rag-pipeline'], practices: ['practice.redaction-before-write'], tools: ['Python', 'Chroma'], learn: ['Embeddings', 'Chunking', 'Vector stores'] }),
          mt({ key: 'retrieve', title: 'Answer from the passages', objective: 'Pass the retrieved passages to a local model and keep the answer grounded in them.',
            instruction: 'Answer a question from the retrieved passages.', actions: ['Retrieve the top passages for a question.', 'Pass them to the model as the only context.', 'Check the answer quotes the passages.'],
            cmd: 'python rag.py "what is the backup schedule?" | tee answer.txt && grep -qi source answer.txt && echo grounded', explain: 'Retrieves passages, answers from them, and confirms the answer cites a source.', sample: 'grounded', flags: [{ flag: 'rag.py "..."', meaning: 'Retrieves then answers, context first.' }, { flag: 'grep -qi source', meaning: 'Checks the answer names where it came from.' }], verify: 'grounded',
            whatItMeans1: 'Grounding means the model answers from the passages, not from memory, so the answer can be checked.',
            check: 'Compare the answer to the record.', checkActions: ['Open the record the passage came from.', 'Check each claim against that record.', 'Reject any claim the record does not support.'], result: 'Every claim in the answer traces to a passage in your records.',
            whatItMeans2: 'A citation is what separates a grounded answer from a guess; without it, the answer cannot be trusted.',
            skills: ['comp.ai.rag-pipeline', 'comp.ai.verify-ai-output'], practices: ['practice.human-in-the-loop'], tools: ['Python', 'Ollama'], learn: ['Retrieval', 'Grounding', 'Citations'] }),
        ],
      },
      {
        title: 'Evaluate the answers', theme: 'An honest pass line', objective: 'Measure the pipeline against a question set and set a pass line before you trust it.', difficulty: 4,
        tasks: [
          mt({ key: 'evalset', title: 'Build a question set', objective: 'Write questions with known answers from your records, and run the pipeline against them.',
            instruction: 'Write questions with known answers.', actions: ['Write ten questions your records answer.', 'Record the correct answer for each.', 'Run the pipeline over the set.'],
            cmd: 'python eval.py questions.jsonl && cat eval_report.txt', explain: 'Runs each question through the pipeline and writes a report of correct and wrong answers.', sample: 'correct 8 of 10', flags: [{ flag: 'eval.py questions.jsonl', meaning: 'Runs every question and scores the answer.' }, { flag: 'cat eval_report.txt', meaning: 'Prints the score and the misses.' }], verify: 'correct',
            whatItMeans1: 'An evaluation set turns a demo into a measurement: you can say how often the pipeline is right.',
            check: 'Read the misses and fix the cause.', checkActions: ['Open each wrong answer.', 'Decide if retrieval or the prompt failed.', 'Change one thing and run again.'], result: 'Each miss has a cause: the wrong passage retrieved, or a prompt that let the model guess.',
            whatItMeans2: 'A miss is information: it says the chunking, the retrieval or the prompt needs one change, not all three.',
            skills: ['comp.ai.verify-ai-output', 'comp.ai.rag-pipeline'], practices: ['practice.pass-line-suites'], tools: ['Python'], learn: ['Evaluation sets', 'Measuring accuracy', 'Root cause'] }),
          mt({ key: 'passline', title: 'Set the pass line', objective: 'Decide the accuracy the pipeline must reach before it is used, and record why.',
            instruction: 'Set the pass line and record it.', actions: ['Choose the accuracy the use demands.', 'State what a wrong answer would cost.', 'Record the line and the reason.'],
            cmd: 'python eval.py questions.jsonl --threshold 0.8 && echo "pass line met"', explain: 'Fails the run unless the pipeline reaches the threshold, so the line is enforced, not hoped for.', sample: 'pass line met', flags: [{ flag: '--threshold 0.8', meaning: 'The run fails below eighty percent correct.' }, { flag: 'echo', meaning: 'Prints only when the line is met.' }], verify: 'pass line met',
            whatItMeans1: 'A pass line set before the run is a control; one set after the result is an excuse.',
            check: 'Record the decision.', checkActions: ['Write the pass line into the record.', 'Note what a wrong answer would cost.', 'Note who signs off on using it.'], result: 'The record states the pass line, the cost of a wrong answer and who accepted it.',
            whatItMeans2: 'Deciding the cost of a wrong answer first is what makes the pass line defensible to a reviewer.',
            skills: ['comp.ai.verify-ai-output', 'comp.ai.prompt-for-the-task'], practices: ['practice.pass-line-suites'], tools: ['Python'], learn: ['Thresholds', 'Risk acceptance', 'Sign-off'] }),
        ],
      },
    ],
  },
  'ai-agents-mcp': {
    id: 'ai-agents-mcp', title: 'AI agents and MCP', track: 'ai', doc: NIST_AI,
    blurb: 'Give a model tools it can call, expose one over the model context protocol, and keep the agent on a short leash.',
    weeks: [
      {
        title: 'An agent with tools', theme: 'Tool calling, scoped', objective: 'Give a model two tools it can call, and log every call it makes.', difficulty: 3,
        tasks: [
          mt({ key: 'tools', title: 'Give the agent tools', objective: 'Define two tools the model may call, each with a scoped credential and a log line.',
            instruction: 'Define two tools the agent can call.', actions: ['Write a read-only search tool.', 'Write a tool that files a ticket.', 'Log every call with its arguments.'],
            cmd: 'python agent.py "find the open incidents" && tail -n1 agent.log', explain: 'Runs the agent on a task and prints the last logged tool call so you can see what it did.', sample: 'CALL search(query="open incidents") -> 3 results', flags: [{ flag: 'agent.py "..."', meaning: 'Runs the agent against the task.' }, { flag: 'tail -n1 agent.log', meaning: 'Shows the most recent tool call.' }], verify: 'CALL',
            whatItMeans1: 'An agent is a model that can act; the log is what lets you see and limit what it did.',
            check: 'Read the call log.', checkActions: ['Open the agent log.', 'Confirm each call names its tool and arguments.', 'Confirm no call exceeded its scope.'], result: 'Every tool call is logged with its arguments, and none reached beyond its scope.',
            whatItMeans2: 'A tool with a scoped credential is the difference between an agent that helps and one that does harm.',
            skills: ['comp.ai.agent-tools', 'comp.ai.verify-ai-output'], practices: ['practice.agent-least-privilege'], tools: ['Python', 'Ollama'], learn: ['Tool calling', 'Scoped credentials', 'Action logs'] }),
          mt({ key: 'leash', title: 'Keep it on a leash', objective: 'Require a human to approve the ticket tool, and prove the approval is enforced.',
            instruction: 'Require approval before a write.', actions: ['Mark the ticket tool as needing approval.', 'Run a task that would file a ticket.', 'Confirm it waits for a yes.'],
            cmd: 'echo n | python agent.py "file a ticket for the outage" && grep -q "denied by human" agent.log && echo held', explain: 'Runs a task that wants to write, answers no, and confirms the agent stopped.', sample: 'held', flags: [{ flag: 'echo n |', meaning: 'Answers no at the approval prompt.' }, { flag: 'grep denied', meaning: 'Confirms the write was refused.' }], verify: 'held',
            whatItMeans1: 'A human checkpoint on a write is the control that keeps an agent from acting on a bad plan.',
            check: 'Record the guardrail.', checkActions: ['Note which tools need approval.', 'Note which run without it.', 'Record who approves a write.'], result: 'The record names the tools that need approval and who gives it.',
            whatItMeans2: 'An agent that can write without a human check is one bad prompt away from a real incident.',
            skills: ['comp.ai.agent-tools', 'comp.ai.verify-ai-output'], practices: ['practice.human-in-the-loop'], tools: ['Python'], learn: ['Human approval', 'Write guardrails', 'Audit'] }),
        ],
      },
      {
        title: 'Expose a tool over MCP', theme: 'The model context protocol', objective: 'Serve one tool over MCP so any client can call it the same way.', difficulty: 4,
        tasks: [
          mt({ key: 'mcp', title: 'Serve a tool over MCP', objective: 'Wrap the search tool as an MCP server and list its tools from a client.',
            instruction: 'Serve the search tool over MCP.', actions: ['Wrap the tool as an MCP server.', 'Start the server.', 'List its tools from a client.'],
            cmd: 'python mcp_server.py & sleep 1 && python mcp_client.py --list', explain: 'Starts the MCP server, then lists the tools it offers so you can see the contract.', sample: 'tools: search', flags: [{ flag: 'mcp_server.py &', meaning: 'Starts the server in the background.' }, { flag: '--list', meaning: 'Asks the server what tools it offers.' }], verify: 'search',
            whatItMeans1: 'MCP is one contract for tools, so a tool written once works in any client that speaks it.',
            check: 'Call the tool from the client.', checkActions: ['Call the search tool over MCP.', 'Read the result the server returns.', 'Confirm it matches the direct call.'], result: 'The MCP client gets the same result the direct call gave.',
            whatItMeans2: 'A shared protocol is what lets a tool be reused across agents instead of rewritten for each.',
            skills: ['comp.ai.mcp-connector', 'comp.ai.agent-tools'], practices: ['practice.agent-least-privilege'], tools: ['Python'], learn: ['MCP', 'Tool contracts', 'Reuse'] }),
          mt({ key: 'audit', title: 'Audit the agent', objective: 'Replay the agent log as a timeline and confirm every action had a reason.',
            instruction: 'Replay the agent as a timeline.', actions: ['Read the agent log in order.', 'Mark each action with its prompt.', 'Flag any action with no reason.'],
            cmd: 'python replay.py agent.log && grep -c CALL agent.log', explain: 'Replays the log as a timeline and counts the tool calls so the run can be audited.', sample: '4', flags: [{ flag: 'replay.py', meaning: 'Prints the actions in order with their prompts.' }, { flag: 'grep -c CALL', meaning: 'Counts the tool calls.' }], verify: '4',
            whatItMeans1: 'An agent timeline is the evidence a reviewer reads to decide whether the agent can be trusted.',
            check: 'Record the audit.', checkActions: ['Note the number of tool calls.', 'Note any action without a clear reason.', 'Record the fix for each.'], result: 'The audit lists every action, its reason and any gap, with a fix.',
            whatItMeans2: 'An action with no traceable reason is the one a reviewer stops on; the audit finds it before they do.',
            skills: ['comp.ai.agent-tools', 'comp.ai.verify-ai-output'], practices: ['practice.human-in-the-loop'], tools: ['Python'], learn: ['Replay', 'Audit trail', 'Review'] }),
        ],
      },
    ],
  },
  'local-llm-serving': {
    id: 'local-llm-serving', title: 'Local LLM serving', track: 'ai', doc: NIST_AI,
    blurb: 'Run a model on your own hardware behind an API, and size the memory it needs before you load it.',
    weeks: [
      {
        title: 'Serve a model locally', theme: 'An API on your own hardware', objective: 'Serve a quantised model behind an API and size the memory it needs.', difficulty: 3,
        tasks: [
          mt({ key: 'serve', title: 'Serve a model behind an API', objective: 'Run a quantised model as a local service and call it over HTTP.',
            instruction: 'Serve a model and call it over HTTP.', actions: ['Pull a small quantised model.', 'Start it as a local service.', 'Call the API with a prompt.'],
            cmd: 'ollama serve & sleep 2 && curl -s localhost:11434/api/generate -d \'{"model":"llama3.2","prompt":"ping","stream":false}\' | python -c "import sys,json;print(json.load(sys.stdin)[\'done\'] and \'served\')"', explain: 'Starts the model service and calls it once over HTTP to prove it answers.', sample: 'served', flags: [{ flag: 'ollama serve &', meaning: 'Runs the model as a local API.' }, { flag: 'curl .../api/generate', meaning: 'Sends one prompt over HTTP.' }], verify: 'served',
            whatItMeans1: 'A model behind an API runs on your own hardware, so your data never leaves the building.',
            check: 'Record the endpoint.', checkActions: ['Note the API address and port.', 'Note the model and its quantisation.', 'Note who may call it.'], result: 'The record names the endpoint, the model, its quantisation and who may call it.',
            whatItMeans2: 'Quantisation trades a little accuracy for a model that fits the hardware you actually have.',
            skills: ['comp.ai.serve-model', 'comp.ai.local-assistant'], practices: ['practice.least-privilege'], tools: ['Ollama', 'Python'], learn: ['Model serving', 'Quantisation', 'Local APIs'] }),
          mt({ key: 'size', title: 'Size the memory', objective: 'Work out the memory a model needs from its parameters and quantisation, and check it against the hardware.',
            instruction: 'Size the model against the hardware.', actions: ['Read the model parameter count.', 'Work out the memory at its quantisation.', 'Check it against the available memory.'],
            cmd: 'python gpumem.py --params 3e9 --bits 4 && free -g | awk \'/Mem/{print $2"G total"}\'', explain: 'Estimates the memory the model needs, then prints the memory the machine has.', sample: '~1.5G needed\\n16G total', flags: [{ flag: '--params 3e9 --bits 4', meaning: 'Three billion parameters at four-bit quantisation.' }, { flag: 'free -g', meaning: 'Prints the machine memory in gigabytes.' }], verify: 'total',
            whatItMeans1: 'Sizing before loading is what stops a model that will not fit from taking a machine down.',
            check: 'Record the sizing.', checkActions: ['Note the memory the model needs.', 'Note the memory available.', 'Note the headroom left.'], result: 'The record shows the memory needed, the memory available and the headroom.',
            whatItMeans2: 'Headroom matters: a model that just fits leaves nothing for the requests it has to serve.',
            skills: ['comp.ai.gpu-sizing', 'comp.ai.serve-model'], practices: ['practice.right-sizing'], tools: ['Python'], learn: ['Memory sizing', 'Parameters and bits', 'Headroom'] }),
        ],
      },
    ],
  },
  'ai-security-validation': {
    id: 'ai-security-validation', title: 'AI security validation', track: 'cyber', doc: OWASP_LLM,
    blurb: 'Attack an AI system the way an adversary would: prompt injection, data leakage and a suite that proves the guardrails hold.',
    weeks: [
      {
        title: 'Attack the model', theme: 'Prompt injection and leakage', objective: 'Prove a prompt injection and a data leak against a model, with evidence.', difficulty: 4,
        tasks: [
          mt({ key: 'inject', title: 'Prove a prompt injection', objective: 'Make the model ignore its instructions with an injected prompt, and capture the proof.',
            instruction: 'Prove an injection against the model.', actions: ['Write a prompt that overrides the system rule.', 'Send it to the model.', 'Capture the response as evidence.'],
            cmd: 'python attack.py --case injection | tee evidence/injection.txt && grep -qi "ignored" evidence/injection.txt && echo proven', explain: 'Runs the injection case and confirms the model ignored its instruction, saving the proof.', sample: 'proven', flags: [{ flag: '--case injection', meaning: 'Runs the prompt-injection attack case.' }, { flag: 'tee evidence/...', meaning: 'Saves the response as evidence.' }], verify: 'proven',
            whatItMeans1: 'A prompt injection makes a model follow the attacker instead of you; the saved response is the proof.',
            check: 'Map it to OWASP.', checkActions: ['Find the matching OWASP LLM risk.', 'Note the technique in ATLAS.', 'Record the evidence file and its hash.'], result: 'The case maps to an OWASP LLM risk and an ATLAS technique, with hashed evidence.',
            whatItMeans2: 'Mapping to a published list is what lets a finding be compared, ranked and taken seriously.',
            skills: ['comp.ai-attack.prompt-injection', 'comp.ai-attack.map-to-atlas'], practices: ['practice.authorised-testing', 'practice.evidence-hashing'], tools: ['Python', 'garak'], learn: ['Prompt injection', 'OWASP LLM', 'ATLAS'] }),
          mt({ key: 'leak', title: 'Prove a data leak', objective: 'Get the model to reveal something it should not, and record the containment.',
            instruction: 'Prove a data leak, then contain it.', actions: ['Ask the model for withheld data.', 'Capture the leak as evidence.', 'Add a filter that blocks it.'],
            cmd: 'python attack.py --case leak | tee evidence/leak.txt; python attack.py --case leak --guard | grep -qi blocked && echo contained', explain: 'Proves the leak, then runs it again behind a guard and confirms the guard blocks it.', sample: 'contained', flags: [{ flag: '--case leak', meaning: 'Runs the data-leakage attack case.' }, { flag: '--guard', meaning: 'Runs it again behind the output filter.' }], verify: 'contained',
            whatItMeans1: 'A leak proven and then contained is a closed finding; a leak only proven is still open.',
            check: 'Record the finding.', checkActions: ['Note what leaked and how.', 'Note the guard that now blocks it.', 'Record the retest that confirms it.'], result: 'The finding records the leak, the guard and the retest that closed it.',
            whatItMeans2: 'An output filter is the control; the retest is what proves the control actually holds.',
            skills: ['comp.ai-attack.sensitive-disclosure', 'comp.ai-attack.reproduce'], practices: ['practice.input-guardrails', 'practice.retest-to-closure'], tools: ['Python', 'LLM Guard'], learn: ['Data leakage', 'Output filters', 'Retest'] }),
        ],
      },
      {
        title: 'A suite that holds', theme: 'Regression for guardrails', objective: 'Turn every proven attack into a test the pipeline runs, so a removed guardrail fails the build.', difficulty: 4,
        tasks: [
          mt({ key: 'suite', title: 'Automate the attack suite', objective: 'Run every attack case as a suite with a pass line, and fail on a regression.',
            instruction: 'Run the attacks as a suite.', actions: ['Collect the proven cases into a suite.', 'Set the pass line: all contained.', 'Run the suite.'],
            cmd: 'python suite.py --all && echo "suite green"', explain: 'Runs every attack case and passes only when all of them are contained.', sample: 'suite green', flags: [{ flag: '--all', meaning: 'Runs every case in the suite.' }, { flag: 'echo', meaning: 'Prints only when all cases are contained.' }], verify: 'suite green',
            whatItMeans1: 'A suite turns a one-off test into a control: a guardrail someone removes fails the build.',
            check: 'Prove the regression catch.', checkActions: ['Disable one guard.', 'Run the suite.', 'Confirm it fails on that case.'], result: 'With a guard disabled the suite fails on exactly that case.',
            whatItMeans2: 'A regression test that never fails proves nothing; disabling a guard is how you know it works.',
            skills: ['comp.ai-attack.automate-suite', 'comp.ai-attack.reproduce'], practices: ['practice.pass-line-suites', 'practice.regression-tests-for-guardrails'], tools: ['Python', 'Git'], learn: ['Attack suites', 'Regression', 'Guardrails'] }),
          mt({ key: 'report', title: 'Report the validation', objective: 'Write the validation up: cases, outcomes, residual risk and the retest plan.',
            instruction: 'Report the validation result.', actions: ['List each case and its outcome.', 'State the residual risk.', 'State when the suite runs next.'],
            cmd: 'python suite.py --report | tee validation.md && grep -qi contained validation.md && echo reported', explain: 'Writes the validation report of cases and outcomes, then confirms it holds the contained cases.', sample: 'reported', flags: [{ flag: '--report', meaning: 'Writes the report of cases and outcomes.' }, { flag: 'grep -qi contained', meaning: 'Confirms the report records the contained cases.' }], verify: 'reported',
            whatItMeans1: 'The report is what a customer or an auditor reads to decide the AI system is safe to use.',
            check: 'Record the residual risk.', checkActions: ['Note any case not fully contained.', 'Note the plan for it.', 'Record who accepted the residual risk.'], result: 'The report states the residual risk and who accepted it.',
            whatItMeans2: 'Residual risk stated and accepted is honest; residual risk hidden is the finding an auditor opens with.',
            skills: ['comp.ai-attack.paper-cases', 'comp.ai-attack.automate-suite'], practices: ['practice.customer-assurance', 'practice.corrective-action'], tools: ['Python'], learn: ['Validation reports', 'Residual risk', 'Assurance'] }),
        ],
      },
    ],
  },
  'enterprise-ai-architect': {
    id: 'enterprise-ai-architect', title: 'Enterprise AI architect', track: 'ai', doc: NIST_AI,
    blurb: 'Bring it together: a hybrid AI platform with local and cloud models, an agent layer, RAG and the controls that govern it.',
    weeks: [
      {
        title: 'Design the hybrid platform', theme: 'Local, cloud and the gateway', objective: 'Draw a hybrid AI platform: a gateway in front of local and cloud models, with a fallback.', difficulty: 4,
        tasks: [
          mt({ key: 'gateway', title: 'Put a gateway in front', objective: 'Route requests through one gateway that chooses a local or a cloud model and falls back.',
            instruction: 'Route models through one gateway.', actions: ['Register a local and a cloud model.', 'Route a request through the gateway.', 'Prove the fallback on a failure.'],
            cmd: 'litellm --config gateway.yaml & sleep 2 && curl -s localhost:4000/health | grep -qi healthy && echo routed', explain: 'Starts the gateway and confirms it is healthy and ready to route to either model.', sample: 'routed', flags: [{ flag: '--config gateway.yaml', meaning: 'Registers the local and cloud models.' }, { flag: '/health', meaning: 'Confirms the gateway is up.' }], verify: 'routed',
            whatItMeans1: 'One gateway in front of every model is where cost, access and fallback are decided in one place.',
            check: 'Record the routing.', checkActions: ['Note which model is the default.', 'Note the fallback and its trigger.', 'Note who may call the gateway.'], result: 'The record names the default model, the fallback and who may call it.',
            whatItMeans2: 'A fallback from cloud to local is what keeps the platform answering when a provider is down.',
            skills: ['comp.ai.serve-model', 'comp.arch.trust-boundaries'], practices: ['practice.redundant-paths', 'practice.least-privilege'], tools: ['LiteLLM', 'Python'], learn: ['AI gateway', 'Hybrid routing', 'Fallback'] }),
          mt({ key: 'layers', title: 'Layer the platform', objective: 'Place the agent layer, the RAG layer and the models in zones with named flows between them.',
            instruction: 'Place the layers in zones.', actions: ['Draw the agent, RAG and model layers.', 'Name the flow between each.', 'Mark the trust boundary each crosses.'],
            cmd: 'python validate_arch.py platform.yaml && echo "layers valid"', explain: 'Checks the architecture file: every layer in a zone, every flow named, no undefined hop.', sample: 'layers valid', flags: [{ flag: 'validate_arch.py', meaning: 'Checks zones, flows and boundaries.' }, { flag: 'echo', meaning: 'Prints only when the architecture is complete.' }], verify: 'layers valid',
            whatItMeans1: 'Layers in named zones with named flows are what let a reviewer follow a request end to end.',
            check: 'Record the architecture.', checkActions: ['Note each layer and its zone.', 'Note each flow and its boundary.', 'Note the data each flow carries.'], result: 'The record shows each layer, its zone, and the flows across each boundary.',
            whatItMeans2: 'A boundary a flow crosses unnamed is the gap an attacker uses and an auditor finds.',
            skills: ['comp.arch.trust-boundaries', 'comp.arch.default-deny-zones'], practices: ['practice.segmentation', 'practice.architecture-decision-records'], tools: ['Python'], learn: ['Layered architecture', 'Zones and flows', 'Boundaries'] }),
        ],
      },
      {
        title: 'Govern the platform', theme: 'Audit, identity and cost', objective: 'Put the controls on the platform: identity at the gateway, an audit log and a cost ceiling.', difficulty: 4,
        tasks: [
          mt({ key: 'govern', title: 'Govern access and cost', objective: 'Require identity at the gateway, log every call and cap the monthly spend.',
            instruction: 'Add identity, audit and a cost cap.', actions: ['Require a token at the gateway.', 'Log every call with its caller.', 'Set a monthly spend cap.'],
            cmd: 'curl -s localhost:4000/chat -H "Authorization: Bearer bad" | grep -qi "401\\|unauthorized" && echo "identity enforced"', explain: 'Calls the gateway with a bad token and confirms it is refused, so identity is enforced.', sample: 'identity enforced', flags: [{ flag: 'Authorization: Bearer bad', meaning: 'Sends an invalid token.' }, { flag: 'grep 401', meaning: 'Confirms the call is refused.' }], verify: 'identity enforced',
            whatItMeans1: 'Identity at the gateway is what turns a shared model into one with an accountable caller for every request.',
            check: 'Record the controls.', checkActions: ['Note the identity the gateway requires.', 'Note where the audit log goes.', 'Note the spend cap and its alert.'], result: 'The record names the identity control, the audit log and the spend cap.',
            whatItMeans2: 'An audit log and a spend cap are the two controls leadership asks for before an AI platform goes live.',
            skills: ['comp.ai.mcp-connector', 'comp.arch.rule-base'], practices: ['practice.mfa-everywhere', 'practice.budget-guardrails'], tools: ['LiteLLM', 'Python'], learn: ['Gateway identity', 'Audit logging', 'Cost caps'] }),
          mt({ key: 'handover', title: 'Hand the platform over', objective: 'Assemble the platform runbook: how to run it, recover it, and what is still open.',
            instruction: 'Assemble the platform runbook.', actions: ['List the services and their owners.', 'Write the recovery steps.', 'List what is still open.'],
            cmd: 'python runbook.py platform.yaml > runbook.md && grep -q "## Recovery" runbook.md && echo "runbook built"', explain: 'Builds the runbook from the architecture and confirms it has a recovery section before handover.', sample: 'runbook built', flags: [{ flag: 'runbook.py', meaning: 'Builds the runbook from the architecture.' }, { flag: 'grep "## Recovery"', meaning: 'Confirms the recovery section exists.' }], verify: 'runbook built',
            whatItMeans1: 'A runbook is what lets a new team run the platform on Monday without the team that built it.',
            check: 'Record the handover.', checkActions: ['Confirm every service has a runbook entry.', 'Confirm the recovery steps are tested.', 'Record the open risks.'], result: 'The handover covers every service, a tested recovery and the open risks.',
            whatItMeans2: 'An untested recovery step is a promise, not a plan; the handover says which have been run.',
            skills: ['comp.arch.component-list', 'comp.ai.serve-model'], practices: ['practice.as-built-documentation', 'practice.runbooks-written'], tools: ['Python'], learn: ['Runbooks', 'Recovery', 'Handover'] }),
        ],
      },
    ],
  },
};

/** Which modules attach to which course, and the id prefix the course's tasks use. */
export const MODULE_PLAN: Record<string, { prefix: string; modules: string[] }> = {
  'security-plus': { prefix: 'sec', modules: ['ai-security-validation'] },
  'cysa-plus': { prefix: 'cysa', modules: ['ai-security-validation'] },
  mssp: { prefix: 'mssp', modules: ['ai-security-validation'] },
  'secai-plus': { prefix: 'secai', modules: ['ai-security-validation'] },
  cissp: { prefix: 'cissp', modules: ['ai-security-validation', 'enterprise-ai-architect'] },
  'server-plus': { prefix: 'srv', modules: ['local-llm-serving'] },
  'ai-foundations': { prefix: 'aif', modules: ['rag-engineering', 'ai-agents-mcp'] },
  'docker-dca': { prefix: 'dca', modules: ['local-llm-serving', 'rag-engineering'] },
  'kubernetes-cka': { prefix: 'cka', modules: ['local-llm-serving', 'ai-agents-mcp'] },
  'nvidia-ai-infrastructure': { prefix: 'nca', modules: ['local-llm-serving', 'rag-engineering'] },
  'aws-ai-practitioner': { prefix: 'awsai', modules: ['rag-engineering', 'ai-agents-mcp'] },
  'aws-security-specialty': { prefix: 'scs', modules: ['ai-security-validation', 'local-llm-serving'] },
  ccna: { prefix: 'ccna', modules: ['local-llm-serving'] },
  'azure-fundamentals': { prefix: 'azf', modules: ['local-llm-serving', 'rag-engineering'] },
  'azure-administrator': { prefix: 'aza', modules: ['local-llm-serving', 'rag-engineering'] },
  'azure-devops': { prefix: 'azd', modules: ['rag-engineering', 'ai-agents-mcp'] },
  'aws-cloud-practitioner': { prefix: 'awsf', modules: ['local-llm-serving', 'rag-engineering'] },
  'aws-solutions-architect': { prefix: 'awsa', modules: ['local-llm-serving', 'rag-engineering'] },
  'aws-devops': { prefix: 'awsd', modules: ['rag-engineering', 'ai-agents-mcp'] },
};

/** The task id uses the module-local week index (not the course week), so the registry can build the same ids without the course. */
export const moduleTaskId = (prefix: string, moduleId: string, moduleWeekIndex: number, key: string) => `${prefix}-${moduleId}-w${moduleWeekIndex}-${key}`;

function buildTask(prefix: string, mod: CourseModule, moduleWeekIndex: number, courseWeek: number, roleId: string, mw: ModuleWeek, t: ModuleTask): Task {
  const id = moduleTaskId(prefix, mod.id, moduleWeekIndex, t.key);
  const s1: Step = {
    id: `${id}-s1`, title: t.title, description: t.objective.length > 90 ? `${t.objective.slice(0, 88)}…` : t.objective,
    where: 'Your own machine — a terminal', instruction: t.instruction, instructionList: t.actions,
    commands: [{ cmd: t.cmd, explain: t.explain, sample: t.sample, flags: t.flags }],
    expectedOutput: t.sample, outputKind: 'console', outputHighlights: [{ text: t.verify, label: 'what proves it worked' }], verify: [t.verify],
    whatItMeans: t.whatItMeans1, docs: [mod.doc],
    fixes: [
      { symptom: 'The command is not found', fix: 'Install the tool it names from its official site, then open a new terminal.' },
      { symptom: 'The output does not match', fix: 'Re-read the instruction, check the file paths, and run the one command again.' },
    ],
    frameworks: [mod.track === 'cyber' ? 'OWASP_LLM' : 'NIST_AI_RMF'],
  };
  const s2: Step = {
    id: `${id}-s2`, title: t.check, description: t.result.length > 90 ? `${t.result.slice(0, 88)}…` : t.result,
    where: 'Deliverables tab, then the terminal', instruction: t.check, instructionList: t.checkActions,
    expectedOutput: t.result, outputKind: 'result', whatItMeans: t.whatItMeans2, docs: [mod.doc],
    fixes: [
      { symptom: 'There is nothing to compare against', fix: 'Open the record the work produced and check each claim against it.' },
      { symptom: 'The check disagrees with the output', fix: 'Trust the evidence: record what the output actually shows, not what you expected.' },
    ],
    frameworks: [mod.track === 'cyber' ? 'OWASP_LLM' : 'NIST_AI_RMF'],
  };
  return {
    id, role: roleId, week: courseWeek, title: t.title, objective: t.objective, steps: [s1, s2],
    frameworks: [mod.track === 'cyber' ? 'OWASP_LLM' : 'NIST_AI_RMF'], deliverables: [],
    estimatedTime: '45 min', difficulty: mw.difficulty, learn: t.learn, tools: t.tools,
    definitionOfDone: [`${t.title} is done and recorded`, 'The result is checked against the evidence'],
    shared: true,
  };
}

/** The course with its planned modules appended as tracked advanced weeks. Pure; re-applying is a no-op. */
export function withModules<T extends Pick<Course, 'id' | 'tasks' | 'weeks' | 'roles' | 'modules'>>(course: T): T {
  const plan = MODULE_PLAN[course.id];
  if (!plan || course.modules?.length) return course;
  const roleId = course.roles[0].id;
  let nextWeek = Math.max(0, ...course.weeks.map((w) => w.number)) + 1;
  const weeks: WeekDef[] = [...course.weeks];
  const tasks: Task[] = [...course.tasks];
  for (const moduleId of plan.modules) {
    const mod = MODULES[moduleId];
    mod.weeks.forEach((mw, mwi) => {
      const courseWeek = nextWeek++;
      const weekTasks = mw.tasks.map((t) => buildTask(plan.prefix, mod, mwi + 1, courseWeek, roleId, mw, t));
      tasks.push(...weekTasks);
      const objectives: WeekObjective[] = weekTasks.map((wt, i) => ({ id: `${plan.prefix}-${mod.id}-w${courseWeek}-obj${i + 1}`, label: mw.tasks[i].title, tasks: [wt.id] }));
      weeks.push({
        number: courseWeek, title: `${mod.title}: ${mw.title}`, theme: mw.theme, objective: mw.objective,
        runs: `Week ${courseWeek}`, advanced: true, track: mod.track, difficulty: mw.difficulty,
        milestone: mw.objective, objectives,
      });
    });
  }
  return { ...course, weeks, tasks, modules: plan.modules };
}

/** One registry fragment, built by reading a chosen key off every module task of every course. */
function moduleRegistry(pick: (t: ModuleTask) => string[]): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  for (const [courseId, plan] of Object.entries(MODULE_PLAN)) {
    const map: Record<string, string[]> = {};
    for (const moduleId of plan.modules) {
      MODULES[moduleId].weeks.forEach((mw, mwi) => {
        for (const t of mw.tasks) map[moduleTaskId(plan.prefix, moduleId, mwi + 1, t.key)] = pick(t);
      });
    }
    out[courseId] = map;
  }
  return out;
}

/** `{ course: { taskId: skillIds } }` for TASK_SKILLS. */
export const moduleSkills = (): Record<string, Record<string, string[]>> => moduleRegistry((t) => t.skills);
/** `{ course: { taskId: practiceIds } }` for TASK_PRACTICES. */
export const modulePractices = (): Record<string, Record<string, string[]>> => moduleRegistry((t) => t.practices);
