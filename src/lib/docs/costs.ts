import type { Task, TaskCost } from '../types';
export type { TaskCost } from '../types';

/**
 * R106 — what every course costs, line by line: the exam fee, the lab (a
 * cloud account, second-hand kit, a server), the software, and what each
 * task spends while it runs. Written into the course document as part of
 * `content.cert` and summed into `index.json`, so the catalogue, the Guide
 * and the coverage sheet print one answer.
 *
 * Numbers are estimates in USD at the year noted; a cloud line is an hourly
 * rate and the task says how long it runs. Second-hand kit keeps the CCNA
 * guide's rule — an order of magnitude, not a price — so its lines carry a
 * band and a representative figure, marked approximate.
 */

export type CostKind = 'exam' | 'cloud' | 'hardware' | 'software' | 'lab';
export type CostPer = 'once' | 'hour' | 'month';

export interface CostLine {
  id: string;
  kind: CostKind;
  item: string;
  usd: number;
  per: CostPer;
  /** True when the figure is an order of magnitude (second-hand kit) or a free-tier estimate. */
  approx?: boolean;
  /** Which weeks of the course the line applies to; omitted = the whole course. */
  weeks?: number[];
  note: string;
}

export const FREE: TaskCost = { usd: 0, per: 'run', note: 'Free tier or no billable resource.' };

const line = (id: string, kind: CostKind, item: string, usd: number, per: CostPer, note: string, extra: Partial<CostLine> = {}): CostLine => ({ id, kind, item, usd, per, note, ...extra });

const HOME_LAB: CostLine[] = [
  line('vbox', 'software', 'VirtualBox or VMware Workstation Player', 0, 'once', 'Free for personal and classroom use.'),
  line('kali', 'software', 'Kali Linux and Ubuntu Server images', 0, 'once', 'Free downloads.'),
  line('win-eval', 'software', 'Windows Server evaluation', 0, 'once', 'Free 180-day evaluation; re-arm or rebuild after it.'),
];

const CLOUD_ENTRY = (platform: 'Azure' | 'AWS'): CostLine[] => [
  line('account', 'cloud', `${platform} account on the free tier`, 0, 'month', 'Twelve months of free-tier allowances cover every entry-course resource; the budget alerts at $4.', { approx: true }),
  line('budget', 'cloud', 'Budget guardrail', 5, 'month', 'The cap the course sets; the entry course should end well under it.', { approx: true }),
];

const CLOUD_ASSOCIATE = (platform: 'Azure' | 'AWS'): CostLine[] => [
  line('account', 'cloud', `${platform} account, free tier plus pay-as-you-go`, 0, 'month', 'The free tier still covers the small instance, the function and the table.', { approx: true }),
  line('lb', 'cloud', platform === 'AWS' ? 'Application Load Balancer' : 'Standard Load Balancer', platform === 'AWS' ? 0.0225 : 0.025, 'hour', 'Runs only during the week it is built and the drills; torn down at the end of each task.', { weeks: [2, 4] }),
  line('fleet', 'cloud', platform === 'AWS' ? 'Two t3.micro instances across two zones' : 'Two B1s instances in a scale set across two zones', platform === 'AWS' ? 0.0208 : 0.0208, 'hour', 'One is free-tier; the second is billed while the fleet runs.', { weeks: [2, 4] }),
  line('db', 'cloud', platform === 'AWS' ? 'RDS PostgreSQL db.t3.micro, Multi-AZ' : 'Azure Database for PostgreSQL flexible server D2ds_v4, zone-redundant HA', platform === 'AWS' ? 0.036 : 0.3, 'hour', 'Created in the data week and stopped or deleted the same day; the backups are kept for the restore drill.', { weeks: [3] }),
  line('endpoints', 'cloud', platform === 'AWS' ? 'VPC interface endpoints (SSM, S3 gateway)' : 'Private endpoint', platform === 'AWS' ? 0.01 : 0.01, 'hour', 'Per endpoint-hour; the gateway endpoint is free.', { weeks: [2] }),
  line('budget', 'cloud', 'Budget guardrail', 20, 'month', 'The cap the course sets for a team that tears down on time.', { approx: true }),
];

const CLOUD_PROFESSIONAL = (platform: 'Azure' | 'AWS'): CostLine[] => [
  line('account', 'cloud', `${platform} account, pay-as-you-go`, 0, 'month', 'The inherited environment, deployed from the template for the drills and deleted after.', { approx: true }),
  line('stacks', 'cloud', 'A dev and a prod stack of the environment', 0.05, 'hour', 'Two copies of the fleet and the database while a pipeline run or a drill is in flight.', { approx: true, weeks: [1, 2, 3, 4] }),
  line('ci', 'software', 'GitHub Actions', 0, 'month', 'Free minutes on a public or small private repository cover the course.'),
  line('budget', 'cloud', 'Budget guardrail', 20, 'month', 'The cap the course sets; a forgotten prod stack is the way to exceed it.', { approx: true }),
];

export const COURSE_COSTS: Record<string, CostLine[]> = {
  'security-plus': HOME_LAB,
  'cysa-plus': [
    line('soc', 'lab', 'The shared Wazuh SOC and team pods', 0, 'month', 'Built by the course; a home student rebuilds it on VirtualBox for free.'),
    ...HOME_LAB,
  ],
  mssp: [line('lab', 'lab', 'The Security+ range reused as the client estate', 0, 'month', 'No new resources; the engagement is documents and the existing lab.')],
  'server-plus': [
    line('server', 'hardware', 'A second-hand rack server (the one the course diagnoses)', 250, 'once', 'Order of magnitude; a 1U or 2U server with two disks and an IPMI port.', { approx: true }),
    line('switch', 'hardware', 'A managed gigabit switch and cables', 60, 'once', 'Order of magnitude, second-hand.', { approx: true }),
    line('disks', 'hardware', 'Two 1 TB disks for the array', 60, 'once', 'New or second-hand; the array needs two.', { approx: true }),
    line('pbs', 'software', 'Proxmox VE and Proxmox Backup Server', 0, 'once', 'Free, community repositories.'),
    line('win-eval', 'software', 'Windows Server evaluation', 0, 'once', 'Free 180-day evaluation.'),
  ],
  'ai-foundations': [
    line('azure', 'cloud', 'Azure AI Foundry and AI Services, free tier', 0, 'month', 'The free tier covers the course; the deployment is stopped at week end so nothing bills.'),
    line('local', 'software', 'Ollama and a small local model', 0, 'once', 'Free download; runs on the student machine with no account.'),
  ],
  'docker-dca': [
    line('docker', 'software', 'Docker Engine and Compose', 0, 'once', 'Free; runs on the student machine, no paid cloud needed.'),
    line('registry', 'software', 'A local registry container', 0, 'once', 'Runs locally; the whole stack is torn down at the end so nothing lingers.'),
  ],
  'kubernetes-cka': [
    line('kind', 'software', 'kind, kubectl and helm', 0, 'once', 'Free; a whole cluster runs in Docker on the student machine, no paid cloud needed.'),
    line('cluster', 'software', 'A local kind cluster', 0, 'once', 'Runs locally; the cluster is deleted at the end so nothing lingers.'),
  ],
  'nvidia-ai-infrastructure': [
    line('tools', 'software', 'Python, awk and a shell', 0, 'once', 'Free; every GPU number is computed on a laptop from the spec table, no GPU needed.'),
    line('local', 'software', 'Ollama and a small local model', 0, 'once', 'Free download; runs on the student CPU to show inference, with no account.'),
  ],
  'aws-ai-practitioner': [
    line('bedrock', 'cloud', 'Amazon Bedrock, Comprehend and Textract, on-demand', 0, 'month', 'On-demand calls kept tiny; a cent or two at most, torn down at the end so nothing bills.'),
    line('local', 'software', 'Ollama and a small local model', 0, 'once', 'Free download; runs on the student machine with no account.'),
  ],
  'aws-security-specialty': [
    line('aws', 'cloud', 'AWS free tier (IAM, VPC, KMS, S3, CloudTrail, CloudWatch)', 0, 'month', 'Every proof runs on the free tier, with --dry-run where a change would cost, and resources are removed at the end.'),
    line('findings', 'software', 'The sample GuardDuty/CloudTrail findings shipped with the course', 0, 'once', 'Detection is read from a provided JSON file with jq; no paid detection service is stood up.'),
  ],
  'a-plus': [
    line('pc', 'hardware', 'A used desktop PC per team (the one the course rebuilds)', 100, 'once', 'Order of magnitude; donated or second-hand, any make that opens with a screwdriver.', { approx: true }),
    line('drive', 'hardware', 'A spare SATA or NVMe drive', 40, 'once', 'For the rebuild if the SMART check fails the fitted one.', { approx: true }),
    line('usb', 'hardware', 'Two USB 3 sticks of at least 32 GB', 10, 'once', 'The live system and the installer.', { approx: true }),
    line('images', 'hardware', 'An external drive for the disk images', 40, 'once', 'At least twice the PC disk; three images are kept.', { approx: true }),
    line('tools', 'hardware', 'A #2 screwdriver and an anti-static strap', 10, 'once', 'The bench kit.', { approx: true }),
    line('sw', 'software', 'Windows evaluation media, a Linux live image and Clonezilla', 0, 'once', 'Free downloads; the course checks each hash.'),
  ],
  'network-plus': [
    line('pt', 'software', 'Cisco Packet Tracer', 0, 'once', 'Free with a Cisco Networking Academy account; the whole graded course runs in it.'),
    line('laptop', 'hardware', 'A laptop that runs the simulator', 0, 'once', 'Any laptop from the last decade; nothing to buy.'),
    line('kit', 'hardware', 'The CCNA kit for the optional Week 5, borrowed or shared', 0, 'once', 'Optional; the course is passed in the simulator. The CCNA cost sheet bands the kit.'),
  ],
  ccna: [
    line('kit-l2', 'hardware', 'Two managed Layer-2 switches (low band)', 40, 'once', 'Second-hand; the kit guide bands it rather than pricing it.', { approx: true }),
    line('kit-l3', 'hardware', 'A router or Layer-3 switch (medium band)', 120, 'once', 'Second-hand; a considered purchase, or emulate it.', { approx: true }),
    line('kit-ap', 'hardware', 'An access point (optional, Week 4)', 40, 'once', 'Optional; the WLAN week can run on a lightweight AP.', { approx: true }),
    line('console', 'hardware', 'A console cable', 10, 'once', 'USB-to-RJ45.', { approx: true }),
    line('emulate', 'software', 'Packet Tracer or CML as the alternative', 0, 'once', 'Free (Packet Tracer) where the kit is borrowed or shared.'),
  ],
  'secai-plus': [
    line('hub', 'lab', 'The Service Hub stand-in and a model endpoint', 0, 'month', 'Runs locally or on a free API tier; the cases are rate-limited by design.'),
    ...HOME_LAB.slice(0, 1),
  ],
  cissp: [line('lab', 'lab', 'Paper exercises on the Ridgeline case', 0, 'month', 'Documents and a config scan of the lab you already have; nothing is bought.')],
  'azure-fundamentals': CLOUD_ENTRY('Azure'),
  'azure-administrator': CLOUD_ASSOCIATE('Azure'),
  'azure-devops': CLOUD_PROFESSIONAL('Azure'),
  'aws-cloud-practitioner': CLOUD_ENTRY('AWS'),
  'aws-solutions-architect': CLOUD_ASSOCIATE('AWS'),
  'aws-devops': CLOUD_PROFESSIONAL('AWS'),
};

export function costsFor(courseId: string): CostLine[] {
  return COURSE_COSTS[courseId] ?? [];
}

export interface CostSummary {
  examFeeUsd: number;
  /** One-off purchases (kit, a server). */
  onceUsd: number;
  /** Fixed monthly lines (budget guardrails are counted as the ceiling). */
  monthlyUsd: number;
  /** What the tasks spend while they run, summed over the course. */
  tasksUsd: number;
}

/** The hours a task's billable resource runs: its estimated time, rounded up to the hour, or one hour. */
const hoursOf = (t: Pick<Task, 'estimatedTime'>) => Math.max(1, Math.ceil(Number(/^(\d+) min$/.exec(t.estimatedTime ?? '')?.[1] ?? 60) / 60));

/** What one task costs over its run, from its own cost line. */
export function taskCostUsd(t: Pick<Task, 'estimatedTime' | 'cost'>): number {
  const c = t.cost;
  if (!c || !c.usd) return 0;
  if (c.per === 'hour') return c.usd * hoursOf(t);
  return c.usd;
}

export function costSummary(lines: CostLine[], examFeeUsd: number, tasks: Pick<Task, 'estimatedTime' | 'cost'>[]): CostSummary {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    examFeeUsd,
    onceUsd: round(lines.filter((l) => l.per === 'once').reduce((n, l) => n + l.usd, 0)),
    monthlyUsd: round(lines.filter((l) => l.per === 'month').reduce((n, l) => n + l.usd, 0)),
    tasksUsd: round(tasks.reduce((n, t) => n + taskCostUsd(t), 0)),
  };
}
