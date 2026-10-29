import type { DeliverableData, DeliverableDef } from './types';
import { decisionBlocksOf, decisionKey } from './types';
import { withoutSeedRows } from './definitions';
import { formBase } from './recordCategories';
import { HOST_FIELDS, addressPart, cidrsOverlap, inSubnet, isCidr, isIpv4, parsePort } from './formContext';
import { PORTFOLIO_PLAN, portfolioId } from './portfolioPlan';

/**
 * R139 — the project record: what this team actually built, read out of the
 * forms they filled, as typed, keyed facts.
 *
 * A team's documents hold the real values of their project — the addresses,
 * prefixes, VLANs, ports, sizes, rules, accounts, exceptions, risks, changes,
 * incidents and decisions — but only as cells in forms. Nothing read them as a
 * whole, so nothing could notice that two hosts hold one address, that a VLAN
 * id is used twice, or that a published port leads to a host that never listens
 * on it; and nothing later in the course could ask the team about a value THEY
 * recorded. This module is that reading. `RECORD_FIELDS` names, per form, the
 * columns and fields that are facts worth keeping (cloud forms by their base id,
 * as `TROUBLE_GROUPS` does); `projectRecord` extracts them from the team's own
 * rows (the worked examples removed); `recordConflicts` finds what contradicts.
 *
 * The record is hidden from learners as a whole — a form shows its own
 * conflicts as hints (the Consistency category), and R141's instructor console
 * shows the rest. Nothing here touches a repository: it is a pure function of
 * the documents and the definitions, so a test can run it over every course's
 * seed rows.
 */

export type RecordKind =
  | 'host' | 'ipv4' | 'cidr' | 'vlan' | 'port' | 'dns' | 'size' | 'resource'
  | 'rule' | 'iam' | 'mfa' | 'exception' | 'risk'
  | 'flow' | 'dependency'
  | 'change' | 'incident'
  | 'decision';

export type RecordArea = 'infrastructure' | 'security' | 'architecture' | 'operations' | 'decisions';

export const RECORD_AREAS: readonly RecordArea[] = ['infrastructure', 'security', 'architecture', 'operations', 'decisions'];

export const AREA_OF_KIND: Record<RecordKind, RecordArea> = {
  host: 'infrastructure', ipv4: 'infrastructure', cidr: 'infrastructure', vlan: 'infrastructure', port: 'infrastructure', dns: 'infrastructure', size: 'infrastructure', resource: 'infrastructure',
  rule: 'security', iam: 'security', mfa: 'security', exception: 'security', risk: 'security',
  flow: 'architecture', dependency: 'architecture',
  change: 'operations', incident: 'operations',
  decision: 'decisions',
};

export const AREA_LABEL: Record<RecordArea, string> = {
  infrastructure: 'Infrastructure',
  security: 'Security',
  architecture: 'Architecture',
  operations: 'Operations',
  decisions: 'Decisions',
};

/** One fact a form records, by table column or by field. */
export interface RecordField {
  /** The form id, or the cloud base id (`network` for `azf_network` and `awsa_network`). */
  form: string;
  /** A table and its column … */
  group?: string;
  column?: string;
  /** … or a single field. */
  field?: string;
  kind: RecordKind;
  /** Three words or fewer; what the value is. */
  label: string;
  /** A sibling column whose value names the entry (the hardware table names the component beside what was found). */
  labelFrom?: string;
  /** The value must not repeat within its table (a VLAN id, a hostname, an address). */
  unique?: boolean;
  /** A `host` entry that DECLARES the machine (the architecture table), as opposed to one that refers to it. */
  declares?: boolean;
  /** For a `size` or `resource`: what it measures, so committed sizes can be set against discovered hardware. */
  of?: 'ram' | 'cpu' | 'disk' | 'power' | 'sku';
  /** For a `size`: the unit of the number. */
  unit?: 'GB' | 'vCPU' | 'W';
  /** For an `ipv4`: the prefix it must sit in — a sibling column, or a field of another form. */
  within?: { column?: string; form?: string; field?: string };
  /** For a table whose rows all belong to one machine (the host's published ports): the host's name, as the record keys it. */
  host?: string;
}

const inf = (form: string, group: string, column: string, kind: RecordKind, label: string, extra: Partial<RecordField> = {}): RecordField => ({ form, group, column, kind, label, ...extra });
const fld = (form: string, field: string, kind: RecordKind, label: string, extra: Partial<RecordField> = {}): RecordField => ({ form, field, kind, label, ...extra });

/**
 * The registry. Every course has entries; the cloud quarters share theirs by
 * base id. A column is listed when a later week could reasonably ask "what did
 * you record here, and why" or when two rows of it could contradict.
 */
export const RECORD_FIELDS: RecordField[] = [
  // security-plus
  inf('asset_inventory', 'assets', 'hostname', 'host', 'Host', { unique: true, declares: true }),
  inf('asset_inventory', 'assets', 'ip', 'ipv4', 'Address', { unique: true }),
  inf('asset_inventory', 'assets', 'service', 'port', 'Service port'),
  fld('scope_roe', 'network_scope', 'cidr', 'Scope prefix'),
  inf('risk_register', 'risks', 'threat', 'risk', 'Risk', { labelFrom: 'asset' }),
  inf('hardening_baseline', 'controls', 'control', 'rule', 'Hardening control'),
  inf('change_log', 'changes', 'change', 'change', 'Change'),
  fld('incident_report', 'title', 'incident', 'Incident'),
  inf('security_policy', 'policies', 'rule', 'rule', 'Policy rule', { labelFrom: 'area' }),
  inf('pentest_report', 'findings', 'title', 'risk', 'Finding'),
  // mssp
  fld('mssp_engagement', 'system_boundary', 'resource', 'System boundary'),
  inf('mssp_detection_rules', 'rules', 'logsource', 'resource', 'Log source', { labelFrom: 'name' }),
  inf('mssp_evidence_packet', 'evidence', 'artifact', 'resource', 'Evidence artifact', { labelFrom: 'control' }),
  inf('mssp_soa', 'controls', 'control', 'rule', 'Applicable control'),
  inf('mssp_control_matrix', 'controls', 'control', 'rule', 'Mapped control'),
  inf('mssp_control_matrix', 'changes', 'change', 'change', 'Change'),
  inf('mssp_gap_assessment', 'gaps', 'gap', 'risk', 'Gap'),
  inf('mssp_detection_rules', 'rules', 'name', 'rule', 'Detection rule', { unique: true }),
  inf('mssp_internal_audit', 'findings', 'finding', 'exception', 'Audit finding'),
  // cysa-plus
  inf('cysa_soc_monitoring', 'changes', 'change', 'change', 'Change'),
  inf('cysa_sensor_deployment', 'sensors', 'host', 'host', 'Monitored host', { declares: true }),
  inf('cysa_coverage_validation', 'sources', 'host', 'host', 'Log source host'),
  fld('cysa_threat_investigation', 'suspicious_ip', 'incident', 'Suspicious address'),
  fld('cysa_incident_response', 'attacker_ip', 'incident', 'Attacker address'),
  inf('cysa_ioc_database', 'iocs', 'value', 'incident', 'Indicator', { labelFrom: 'type' }),
  inf('cysa_vulnerability_assessment', 'findings', 'cve', 'risk', 'Vulnerability', { labelFrom: 'finding' }),
  inf('cysa_alert_triage', 'alerts', 'alert', 'incident', 'Alert'),
  // server-plus
  inf('srv_business_reqs', 'machines', 'hostname', 'host', 'Machine', { unique: true, declares: true }),
  inf('srv_business_reqs', 'machines', 'zone', 'vlan', 'Zone'),
  inf('srv_hardware', 'discovery', 'found', 'resource', 'Discovered', { labelFrom: 'component' }),
  fld('srv_bringup', 'hv_hostname', 'host', 'Hypervisor host', { declares: true }),
  fld('srv_bringup', 'hv_address', 'ipv4', 'Hypervisor address'),
  fld('srv_bringup', 'remote_host_ip', 'ipv4', 'Remote-access address'),
  fld('srv_bringup', 'raid_level', 'resource', 'RAID level'),
  inf('srv_bringup', 'access', 'login', 'iam', 'Account', { labelFrom: 'person' }),
  inf('srv_bringup', 'vms', 'hostname', 'host', 'Virtual machine', { unique: true }),
  inf('srv_bringup', 'vms', 'vcpu', 'size', 'vCPU', { of: 'cpu', unit: 'vCPU' }),
  inf('srv_bringup', 'vms', 'ram_gb', 'size', 'RAM', { of: 'ram', unit: 'GB' }),
  inf('srv_bringup', 'vms', 'disk_gb', 'size', 'Disk', { of: 'disk', unit: 'GB' }),
  inf('srv_rack_assets', 'elevation', 'device', 'resource', 'Rack device'),
  inf('srv_rack_assets', 'elevation', 'power_draw', 'size', 'Power draw', { of: 'power', unit: 'W' }),
  inf('srv_rack_assets', 'assets', 'asset_id', 'resource', 'Asset', { unique: true, labelFrom: 'name' }),
  inf('srv_ip_plan', 'addresses', 'hostname', 'host', 'Host'),
  inf('srv_ip_plan', 'addresses', 'address', 'ipv4', 'Address', { unique: true }),
  inf('srv_ip_plan', 'addresses', 'dns', 'dns', 'DNS server'),
  inf('srv_ip_plan', 'published', 'host_port', 'port', 'Published port', { unique: true, host: 'pve-host' }),
  inf('srv_ip_plan', 'published', 'to', 'dependency', 'Forwarded to'),
  inf('srv_ip_plan', 'proof', 'to', 'flow', 'Path tested', { labelFrom: 'from' }),
  inf('srv_standards', 'baseline', 'host', 'host', 'Baselined host'),
  inf('srv_standards', 'ports', 'port', 'port', 'Listening port'),
  inf('srv_standards', 'hardening', 'control', 'rule', 'Hardening control'),
  inf('srv_standards', 'policies', 'policy', 'rule', 'Policy'),
  inf('srv_operations', 'changes', 'change', 'change', 'Change'),
  inf('srv_operations', 'patches', 'patch', 'change', 'Patch', { labelFrom: 'system' }),
  inf('srv_operations', 'alerts', 'alert', 'incident', 'Alert'),
  inf('srv_as_built', 'backups', 'what', 'resource', 'Backup'),
  inf('srv_as_built', 'tooling', 'host', 'host', 'Tooling host'),
  // ccna
  inf('ccna_kit', 'devices', 'name', 'host', 'Device', { unique: true, declares: true }),
  inf('ccna_lld', 'vlans', 'vlan', 'vlan', 'VLAN', { unique: true }),
  inf('ccna_lld', 'vlans', 'prefix', 'cidr', 'Prefix', { unique: true }),
  inf('ccna_lld', 'vlans', 'gateway', 'ipv4', 'Gateway', { unique: true, within: { column: 'prefix' } }),
  inf('ccna_lld', 'ports', 'device', 'host', 'Device'),
  inf('ccna_build_log', 'changes', 'device', 'host', 'Device changed'),
  inf('ccna_build_log', 'changes', 'what', 'change', 'Change', { labelFrom: 'device' }),
  inf('ccna_validation', 'tests', 'test', 'flow', 'Test', { labelFrom: 'from' }),
  inf('ccna_security', 'rules', 'rule', 'rule', 'ACL rule'),
  inf('ccna_security', 'hardening', 'control', 'rule', 'Hardening control'),
  inf('ccna_hld', 'decisions', 'decision', 'decision', 'Design decision'),
  inf('ccna_ops', 'changes', 'what', 'change', 'Change'),
  inf('ccna_ops', 'backups', 'device', 'host', 'Backed-up device'),
  fld('ccna_monitoring', 'inc_ref', 'incident', 'Incident'),
  // a-plus
  fld('ap_intake', 'hostname', 'host', 'Machine', { declares: true }),
  inf('ap_asset', 'parts', 'part', 'resource', 'Part', { labelFrom: 'model' }),
  fld('ap_fault', 'symptom', 'incident', 'Fault'),
  inf('ap_os', 'fw_changes', 'setting', 'change', 'Firmware change'),
  fld('ap_os', 'ip', 'ipv4', 'Address'),
  fld('ap_os', 'dns', 'dns', 'DNS server'),
  inf('ap_backup', 'images', 'name', 'resource', 'Image', { unique: true }),
  inf('ap_tickets', 'tickets', 'ref', 'incident', 'Ticket', { unique: true }),
  inf('ap_security', 'diff', 'service', 'rule', 'Service decision', { labelFrom: 'side' }),
  inf('ap_handover', 'known_issues', 'issue', 'risk', 'Known issue'),
  // network-plus
  inf('np_design', 'vlans', 'vlan', 'vlan', 'VLAN', { unique: true }),
  inf('np_design', 'vlans', 'prefix', 'cidr', 'Prefix', { unique: true }),
  inf('np_design', 'vlans', 'gateway', 'ipv4', 'Gateway', { unique: true, within: { column: 'prefix' } }),
  inf('np_design', 'mgmt', 'device', 'host', 'Device', { unique: true, declares: true }),
  inf('np_design', 'mgmt', 'address', 'ipv4', 'Management address', { unique: true }),
  fld('np_ports', 'wan_router', 'ipv4', 'WAN address'),
  inf('np_ports', 'ports', 'device', 'host', 'Device'),
  inf('np_config', 'changes', 'device', 'host', 'Device changed'),
  inf('np_config', 'changes', 'what', 'change', 'Change', { labelFrom: 'device' }),
  inf('np_verify', 'matrix', 'to', 'flow', 'Path tested', { labelFrom: 'from' }),
  fld('np_changes', 'chg_what', 'change', 'Change'),
  inf('np_changes', 'faults', 'ref', 'incident', 'Fault', { unique: true }),
  inf('np_bom', 'bom', 'item', 'resource', 'Ordered item'),
  inf('np_handover', 'risks', 'risk', 'risk', 'Risk'),
  // secai-plus
  inf('secai_system_map', 'models', 'model', 'resource', 'Model', { unique: true }),
  inf('secai_system_map', 'models', 'host', 'host', 'Model host'),
  inf('secai_system_map', 'tools', 'tool', 'resource', 'Tool'),
  inf('secai_control_set', 'controls', 'control', 'rule', 'Control'),
  inf('secai_control_set', 'access', 'subject', 'iam', 'Access subject', { labelFrom: 'object' }),
  inf('secai_control_set', 'changes', 'change', 'change', 'Change'),
  inf('secai_attack_casebook', 'cases', 'case', 'incident', 'Attack case'),
  inf('secai_governance_pack', 'risks', 'risk', 'risk', 'Risk'),
  inf('secai_governance_pack', 'weaknesses', 'id', 'exception', 'Weakness', { unique: true, labelFrom: 'condition' }),
  // cissp
  inf('cissp_d1', 'risks', 'risk', 'risk', 'Risk'),
  inf('cissp_d1', 'weaknesses', 'id', 'exception', 'Weakness', { unique: true, labelFrom: 'condition' }),
  inf('cissp_d2', 'assets', 'asset', 'resource', 'Asset', { unique: true }),
  inf('cissp_d3', 'shared', 'control', 'rule', 'Shared control'),
  inf('cissp_d4', 'flows', 'to', 'flow', 'Flow', { labelFrom: 'from' }),
  inf('cissp_d4', 'flows', 'port', 'port', 'Flow port'),
  inf('cissp_d5', 'access', 'role', 'iam', 'Role', { labelFrom: 'system' }),
  fld('cissp_d5', 'mfa', 'mfa', 'MFA rule'),
  inf('cissp_d8', 'changes', 'change', 'change', 'Change'),
  inf('cissp_controls', 'controls', 'id', 'rule', 'Control', { unique: true }),
  // cloud quarters, by base
  fld('foundation', 'region', 'resource', 'Region'),
  fld('foundation', 'group_name', 'resource', 'Resource group'),
  fld('foundation', 'net_name', 'resource', 'Network'),
  fld('foundation', 'net_cidr', 'cidr', 'Network prefix'),
  fld('foundation', 'subnet_cidr', 'cidr', 'First subnet'),
  inf('foundation', 'access', 'who', 'iam', 'Team access', { labelFrom: 'gets' }),
  inf('foundation', 'access', 'mfa', 'mfa', 'MFA', { labelFrom: 'who' }),
  inf('sad', 'components', 'name', 'resource', 'Component', { unique: true, labelFrom: 'service' }),
  fld('sad', 'vm_name', 'host', 'Virtual machine', { declares: true }),
  fld('sad', 'vm_size', 'size', 'VM size', { of: 'sku' }),
  fld('sad', 'vm_private_ip', 'ipv4', 'VM private address', { within: { form: 'foundation', field: 'subnet_cidr' } }),
  fld('api', 'db_name', 'resource', 'Table'),
  inf('api', 'endpoints', 'path', 'flow', 'Endpoint', { labelFrom: 'method' }),
  fld('api', 'team_group', 'iam', 'Team group'),
  fld('api', 'mfa', 'mfa', 'MFA'),
  fld('incident', 'inc_symptom', 'incident', 'Incident'),
  inf('incident', 'changes', 'change', 'change', 'Change'),
  inf('access', 'matrix', 'principal', 'iam', 'Principal', { labelFrom: 'role' }),
  inf('network', 'plan', 'name', 'resource', 'Subnet', { unique: true }),
  inf('network', 'plan', 'cidr', 'cidr', 'Subnet prefix', { unique: true, labelFrom: 'name' }),
  inf('network', 'rules', 'port', 'rule', 'Rule port', { labelFrom: 'dir' }),
  inf('network', 'rules', 'source', 'rule', 'Rule source', { labelFrom: 'port' }),
  inf('network', 'paths', 'path', 'flow', 'Request path'),
  fld('server', 'size_now', 'size', 'Instance size', { of: 'sku' }),
  fld('server', 'db_engine', 'resource', 'Database engine'),
  fld('server', 'queue_name', 'resource', 'Queue'),
  inf('server', 'changes', 'change', 'change', 'Change'),
  inf('dr', 'bia', 'asset', 'resource', 'Protected asset', { labelFrom: 'criticality' }),
  inf('iac', 'inventory', 'name', 'resource', 'Templated resource', { unique: true, labelFrom: 'type' }),
  inf('iac', 'params', 'name', 'resource', 'Parameter', { unique: true }),
  fld('change', 'rfc_what', 'change', 'Request for change'),
  inf('change', 'runs', 'run', 'change', 'Pipeline run', { labelFrom: 'stage' }),
  inf('governance', 'findings', 'finding', 'exception', 'Finding', { labelFrom: 'severity' }),
  inf('governance', 'slos', 'sli', 'resource', 'SLO', { labelFrom: 'target' }),
  inf('handover', 'catalogue', 'service', 'resource', 'Service', { unique: true, labelFrom: 'url' }),
  inf('handover', 'risks', 'risk', 'risk', 'Risk'),
  inf('handover', 'scenarios', 'scenario', 'incident', 'Scenario', { labelFrom: 'result' }),
  // R142: every course's Portfolio — the repository is the one resource a later week asks after.
  ...PORTFOLIO_PLAN.map((p) => fld(portfolioId(p), 'repo_url', 'resource', 'Repository')),
];

/** The registry entries that read a form, by its id or its cloud base. */
export function recordFieldsOf(def: Pick<DeliverableDef, 'id'>): RecordField[] {
  const base = formBase(def.id);
  return RECORD_FIELDS.filter((f) => f.form === def.id || f.form === base);
}

export interface RecordEntry {
  /** `<form>.<group>[<row>].<column>`, `<form>.<field>` or `<form>.decision:<block>`. */
  key: string;
  kind: RecordKind;
  area: RecordArea;
  /** The value as typed, trimmed. */
  value: string;
  /** The registry label, or the sibling column's value when `labelFrom` names one. */
  label: string;
  form: string;
  group?: string;
  row?: number;
  column?: string;
  field?: string;
  /** The machine this value belongs to, when the row names one. */
  host?: string;
  /** The registry entry that produced it. */
  spec?: RecordField;
  /** For a decision: who chose and when, from the form's `:by` and `:at` fields. */
  enteredBy?: string;
  enteredAt?: number;
}

export interface ProjectRecord {
  entries: RecordEntry[];
  byArea: Record<RecordArea, RecordEntry[]>;
  /** Machines the team declared, as typed (the architecture tables). */
  hosts: string[];
}

const trim = (v: string | undefined) => (v ?? '').trim();

/** The machine a row names: its hostref column, or a column named for a host. */
function hostOfRow(row: Record<string, string>, columns: { field: string; type: string }[]): string | undefined {
  const col = columns.find((c) => c.type === 'hostref') ?? columns.find((c) => HOST_FIELDS.includes(c.field));
  const v = col ? trim(row[col.field]) : '';
  return v || undefined;
}

/**
 * Read the record out of a team's documents. Pure: the same documents and
 * definitions always give the same record. Seed rows (the worked examples) are
 * not the team's facts and are left out, as the rubric leaves them out.
 */
export function projectRecord(docs: Record<string, DeliverableData>, defs: DeliverableDef[]): ProjectRecord {
  const entries: RecordEntry[] = [];
  const hosts: string[] = [];
  for (const def of defs) {
    const raw = docs[def.id];
    if (!raw) continue;
    const data = withoutSeedRows(def, raw);
    for (const spec of recordFieldsOf(def)) {
      if (spec.field) {
        const value = trim(data.fields?.[spec.field]);
        if (!value) continue;
        const entry: RecordEntry = { key: `${def.id}.${spec.field}`, kind: spec.kind, area: AREA_OF_KIND[spec.kind], value, label: spec.label, form: def.id, field: spec.field, spec };
        if (spec.host) entry.host = spec.host;
        if (spec.kind === 'host') { entry.host = value; if (spec.declares) hosts.push(value); }
        entries.push(entry);
        continue;
      }
      if (!spec.group || !spec.column) continue;
      const section = def.sections.find((s) => s.kind === 'group' && s.group.group === spec.group);
      const columns = section?.kind === 'group' ? section.group.columns : [];
      const rows = data.groups?.[spec.group] ?? [];
      rows.forEach((row, i) => {
        const value = trim(row[spec.column!]);
        if (!value) return;
        const label = spec.labelFrom ? trim(row[spec.labelFrom]) || spec.label : spec.label;
        const entry: RecordEntry = { key: `${def.id}.${spec.group}[${i}].${spec.column}`, kind: spec.kind, area: AREA_OF_KIND[spec.kind], value, label, form: def.id, group: spec.group, row: i, column: spec.column, spec };
        const host = spec.host ?? (spec.kind === 'host' ? value : hostOfRow(row, columns));
        if (host) entry.host = host;
        if (spec.kind === 'host' && spec.declares) hosts.push(value);
        entries.push(entry);
      });
    }
    // Every decision block is a decision, with who chose and when.
    for (const block of decisionBlocksOf(def)) {
      const k = decisionKey(block.id);
      const value = trim(data.fields?.[k]);
      if (!value) continue;
      const at = Number(data.fields?.[`${k}:at`]);
      entries.push({
        key: `${def.id}.${k}`, kind: 'decision', area: 'decisions', value, label: block.title, form: def.id, field: k,
        enteredBy: trim(data.fields?.[`${k}:by`]) || undefined, enteredAt: Number.isFinite(at) && at > 0 ? at : undefined,
      });
    }
  }
  const byArea = Object.fromEntries(RECORD_AREAS.map((a) => [a, entries.filter((e) => e.area === a)])) as Record<RecordArea, RecordEntry[]>;
  const seen = new Set<string>();
  return { entries, byArea, hosts: hosts.filter((h) => { const k = h.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }) };
}

export function emptyRecord(): ProjectRecord {
  return { entries: [], byArea: Object.fromEntries(RECORD_AREAS.map((a) => [a, [] as RecordEntry[]])) as Record<RecordArea, RecordEntry[]>, hosts: [] };
}

/* ── conflicts ───────────────────────────────────────────────────────────── */

export type ConflictRule =
  | 'duplicate-value' | 'duplicate-address' | 'address-outside-prefix' | 'prefixes-overlap'
  | 'port-reused' | 'undeclared-host' | 'ram-over-committed' | 'cpu-over-committed' | 'published-port-not-listening';

export interface RecordConflict {
  /** Stable for the same facts: `conflict:<rule>:<keys>`. */
  id: string;
  rule: ConflictRule;
  /** `error` contradicts the record; `warn` is worth a look. */
  severity: 'error' | 'warn';
  /** The record keys involved, the first being the one the conflict is about. */
  keys: string[];
  /** The forms involved, so a form can show its own. */
  forms: string[];
  /** One sentence, no second person; what contradicts what. */
  message: string;
}

const lower = (s: string) => s.trim().toLowerCase();

/** The first number before "GB" in a discovery line, or the first number at all. */
export function gbOf(text: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*(?:GB|GiB|G)\b/i.exec(text) ?? /(\d+(?:\.\d+)?)\s*(?:TB|TiB|T)\b/i.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return /T/i.test(m[0].slice(m[1].length)) ? n * 1024 : n;
}

/** Threads if the line says so ("16C / 32T", "32 threads"), else cores, else the first number. */
export function threadsOf(text: string): number | null {
  const t = /(\d+)\s*(?:T\b|threads?)/i.exec(text);
  if (t) return Number(t[1]);
  const c = /(\d+)\s*(?:C\b|cores?)/i.exec(text);
  if (c) return Number(c[1]);
  const n = /(\d+)/.exec(text);
  return n ? Number(n[1]) : null;
}

/** "websrv:80" → { host, port }; null when the cell is not of that shape. */
export function hostPortOf(value: string): { host: string; port: number } | null {
  const m = /^\s*([A-Za-z0-9_.-]+)\s*:\s*(\d{1,5})\s*(?:\/\w+)?\s*$/.exec(value);
  if (!m) return null;
  return { host: m[1], port: Number(m[2]) };
}

/** The port number of a cell that may carry more than the port ("80/tcp HTTP"). */
function portNumber(value: string): number | null {
  const first = value.trim().split(/\s+/)[0] ?? '';
  return parsePort(first)?.port ?? null;
}

function conflict(rule: ConflictRule, severity: RecordConflict['severity'], entries: RecordEntry[], message: string): RecordConflict {
  const keys = entries.map((e) => e.key);
  return { id: `conflict:${rule}:${keys.join('+')}`, rule, severity, keys, forms: [...new Set(entries.map((e) => e.form))], message };
}

/**
 * What contradicts, across the whole record. Every rule reads the entries only,
 * so a test can state each positively and negatively with a hand-built record.
 */
export function recordConflicts(record: ProjectRecord): RecordConflict[] {
  const out: RecordConflict[] = [];
  const { entries } = record;

  // 1. A value marked unique repeats within its table (a VLAN id, a hostname, an asset id).
  const groupsSeen = new Map<string, RecordEntry[]>();
  for (const e of entries) {
    if (!e.spec?.unique || !e.group) continue;
    const k = `${e.form}.${e.group}.${e.column}=${lower(e.value)}`;
    groupsSeen.set(k, [...(groupsSeen.get(k) ?? []), e]);
  }
  for (const dupes of groupsSeen.values()) {
    if (dupes.length < 2) continue;
    // An address held by two different machines is rule 2's, which names the machines.
    if (dupes[0].kind === 'ipv4' && new Set(dupes.map((e) => lower(e.host ?? ''))).size > 1) continue;
    const rule: ConflictRule = dupes[0].kind === 'ipv4' ? 'duplicate-address' : 'duplicate-value';
    out.push(conflict(rule, 'error', dupes, `${dupes[0].label} ${dupes[0].value} appears ${dupes.length} times in the same table.`));
  }

  // 2. One address on two machines, across every form.
  const byAddress = new Map<string, RecordEntry[]>();
  for (const e of entries) {
    if (e.kind !== 'ipv4' || !isIpv4(addressPart(e.value))) continue;
    const k = addressPart(e.value);
    byAddress.set(k, [...(byAddress.get(k) ?? []), e]);
  }
  for (const [addr, list] of byAddress) {
    const hosts = new Set(list.map((e) => lower(e.host ?? '')).filter(Boolean));
    if (hosts.size < 2) continue;
    out.push(conflict('duplicate-address', 'error', list, `Address ${addr} is recorded on ${[...hosts].join(' and ')}.`));
  }

  // 3. An address outside the prefix it must sit in (a sibling column, or a field of another form).
  for (const e of entries) {
    if (e.kind !== 'ipv4' || !e.spec?.within || !isIpv4(addressPart(e.value))) continue;
    let prefix: RecordEntry | undefined;
    if (e.spec.within.column && e.group !== undefined && e.row !== undefined) {
      prefix = entries.find((p) => p.form === e.form && p.group === e.group && p.row === e.row && p.column === e.spec!.within!.column);
    } else if (e.spec.within.field) {
      const base = e.spec.within.form;
      prefix = entries.find((p) => p.field === e.spec!.within!.field && (p.form === base || formBase(p.form) === base));
    }
    if (!prefix || !isCidr(prefix.value)) continue;
    if (!inSubnet(addressPart(e.value), prefix.value)) {
      out.push(conflict('address-outside-prefix', 'error', [e, prefix], `${e.label} ${e.value} is outside ${prefix.value}.`));
    }
  }

  // 4. Two prefixes in one table overlap (sibling subnets, VLAN prefixes).
  const cidrsByGroup = new Map<string, RecordEntry[]>();
  for (const e of entries) {
    if (e.kind !== 'cidr' || !e.group || !isCidr(e.value)) continue;
    const k = `${e.form}.${e.group}.${e.column}`;
    cidrsByGroup.set(k, [...(cidrsByGroup.get(k) ?? []), e]);
  }
  for (const list of cidrsByGroup.values()) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      if (lower(list[i].value) === lower(list[j].value)) continue; // the duplicate rule names it
      if (cidrsOverlap(list[i].value, list[j].value)) out.push(conflict('prefixes-overlap', 'error', [list[i], list[j]], `Prefixes ${list[i].value} and ${list[j].value} overlap.`));
    }
  }

  // 5. One port twice on one machine.
  const portsByHost = new Map<string, RecordEntry[]>();
  for (const e of entries) {
    if (e.kind !== 'port' || !e.host) continue;
    const n = portNumber(e.value);
    if (n === null) continue;
    const k = `${lower(e.host)}:${n}`;
    portsByHost.set(k, [...(portsByHost.get(k) ?? []), e]);
  }
  for (const [k, list] of portsByHost) {
    const distinctRows = new Set(list.map((e) => `${e.form}.${e.group}[${e.row}]`));
    if (distinctRows.size < 2) continue;
    out.push(conflict('port-reused', 'error', list, `Port ${k.split(':')[1]} is assigned ${distinctRows.size} times on ${list[0].host}.`));
  }

  // 6. A machine referred to but never declared — only once the team has declared any.
  if (record.hosts.length > 0) {
    const declared = new Set(record.hosts.map(lower));
    const flagged = new Set<string>();
    for (const e of entries) {
      if (e.kind !== 'host' || e.spec?.declares || !e.value) continue;
      if (declared.has(lower(e.value)) || flagged.has(lower(e.value))) continue;
      if (/\s/.test(e.value.trim()) || isIpv4(addressPart(e.value))) continue; // "Campus LAN" is a place, an address is not a name
      flagged.add(lower(e.value));
      out.push(conflict('undeclared-host', 'warn', [e], `${e.value} is named here but not declared among the team's machines.`));
    }
  }

  // 7. Sizes committed above the discovered hardware: RAM over capacity is a contradiction; vCPU past twice the threads is worth a look.
  const capacity = (of: 'ram' | 'cpu') => entries.find((e) => e.kind === 'resource' && e.spec?.labelFrom && new RegExp(of === 'ram' ? 'memory|ram' : 'cpu|processor', 'i').test(e.label));
  const sizes = (of: 'ram' | 'cpu' | 'disk') => entries.filter((e) => e.kind === 'size' && e.spec?.of === of && /^\d+(\.\d+)?$/.test(e.value));
  const ramCap = capacity('ram');
  const ram = sizes('ram');
  if (ramCap && ram.length) {
    const cap = gbOf(ramCap.value);
    const sum = ram.reduce((n, e) => n + Number(e.value), 0);
    if (cap !== null && sum > cap) out.push(conflict('ram-over-committed', 'error', [...ram, ramCap], `${sum} GB of RAM is committed to the machines; the host reports ${cap} GB.`));
  }
  const cpuCap = capacity('cpu');
  const cpu = sizes('cpu');
  if (cpuCap && cpu.length) {
    const cap = threadsOf(cpuCap.value);
    const sum = cpu.reduce((n, e) => n + Number(e.value), 0);
    if (cap !== null && sum > 2 * cap) out.push(conflict('cpu-over-committed', 'warn', [...cpu, cpuCap], `${sum} vCPUs are committed to the machines; the host reports ${cap} threads.`));
  }

  // 8. A published port forwards to a host and port no listening-port row records — once the ports table has rows.
  const listening = entries.filter((e) => e.kind === 'port' && e.host && e.form !== entries.find((d) => d.kind === 'dependency')?.form);
  if (listening.length > 0) {
    for (const e of entries) {
      if (e.kind !== 'dependency') continue;
      const hp = hostPortOf(e.value);
      if (!hp) continue;
      const found = listening.some((l) => lower(l.host!) === lower(hp.host) && portNumber(l.value) === hp.port);
      if (!found) out.push(conflict('published-port-not-listening', 'warn', [e], `${e.value} is published, but no listening port ${hp.port} is recorded on ${hp.host}.`));
    }
  }

  return out;
}

/** The conflicts that touch one form. */
export function conflictsOnForm(conflicts: RecordConflict[], formId: string): RecordConflict[] {
  return conflicts.filter((c) => c.forms.includes(formId));
}
