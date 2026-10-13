import { describe, it, expect } from 'vitest';
import { COURSE_TOOL_DEFAULTS, TASK_TOOL_OVERRIDES, TOOLS, TOOL_STRING_EXCEPTIONS, WHERE_TOOLS, commandHead, toolForHead, toolOf, toolsOfString, toolsOfTask, toolsOfWhere } from './tools';
import { COURSE_TOOLS } from './manual';
import { SEED_COURSES } from '../content/dto';
import type { Task } from '../types';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

describe('R107 — the tool register', () => {
  it('ids, aliases and command heads are unique and labels are short', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    const aliases = new Map<string, string>();
    const commands = new Map<string, string>();
    for (const t of TOOLS) {
      expect(t.id).toMatch(/^tool\.[a-z0-9][a-z0-9-]*$/);
      expect(words(t.label), `${t.id} label ≤ 4 words`).toBeLessThanOrEqual(4);
      expect(t.aliases.length, `${t.id} has an alias`).toBeGreaterThan(0);
      expect(t.label).not.toMatch(/—|\p{Extended_Pictographic}/u);
      for (const a of t.aliases) {
        expect(aliases.get(a.toLowerCase()), `alias "${a}" on ${t.id} and ${aliases.get(a.toLowerCase())}`).toBeUndefined();
        aliases.set(a.toLowerCase(), t.id);
      }
      for (const c of t.commands ?? []) {
        expect(commands.get(c), `command "${c}" on ${t.id} and ${commands.get(c)}`).toBeUndefined();
        commands.set(c, t.id);
      }
    }
  });

  it('every where prefix, course default and task override names a tool that exists', () => {
    for (const [k, ids] of Object.entries(WHERE_TOOLS)) for (const id of ids) expect(toolOf(id), `${k} → ${id}`).toBeTruthy();
    for (const [c, ids] of Object.entries(COURSE_TOOL_DEFAULTS)) for (const id of ids) expect(toolOf(id), `${c} → ${id}`).toBeTruthy();
    for (const [c, tasks] of Object.entries(TASK_TOOL_OVERRIDES)) {
      const course = SEED_COURSES.find((x) => x.id === c);
      expect(course, c).toBeTruthy();
      for (const [taskId, ids] of Object.entries(tasks)) {
        expect(course!.tasks.some((t) => t.id === taskId), `${c}/${taskId}`).toBe(true);
        for (const id of ids) expect(toolOf(id), `${c}/${taskId} → ${id}`).toBeTruthy();
      }
    }
    expect(toolsOfWhere('Azure portal · or Cloud Shell')).toEqual(['tool.azure-portal', 'tool.azure-cloud-shell']);
    expect(toolsOfWhere('Azure portal — Advisor, then Service Health')).toEqual(['tool.azure-portal']);
    expect(toolsOfWhere('Your lab machine · terminal (OpenBao dev server)')).toEqual(['tool.linux-shell', 'tool.openbao']);
    expect(toolsOfWhere('Team meeting')).toEqual([]);
  });

  it('commandHead finds the first command on a line and nothing on a flag or a comment', () => {
    expect(commandHead('sudo ufw allow 22')).toBe('ufw');
    expect(commandHead('RG=rg-x; az group create')).toBe('az');
    expect(commandHead('VPC=$(aws ec2 describe-vpcs --query x)')).toBe('aws');
    expect(commandHead('export FOO=bar && terraform init')).toBe('terraform');
    expect(commandHead('$ nmap -sV 10.0.0.1')).toBe('nmap');
    expect(commandHead('-A INPUT -p tcp --dport 22 -j ACCEPT')).toBeNull();
    expect(commandHead('# a comment')).toBeNull();
    expect(commandHead('')).toBeNull();
    expect(toolForHead('Get-WinEvent')).toBe('tool.event-viewer');
    expect(toolForHead('Install-WindowsFeature')).toBe('tool.powershell');
    expect(toolForHead('frobnicate')).toBeUndefined();
  });

  it('a tools[] string resolves to one tool, two tools, a command head, or an explained exception', () => {
    expect(toolsOfString('nmap')).toEqual(['tool.nmap']);
    expect(toolsOfString('Nmap')).toEqual(['tool.nmap']);
    expect(toolsOfString('whois / dig')).toEqual(['tool.whois', 'tool.dig']);
    expect(toolsOfString('Terraform or OpenTofu')).toEqual(['tool.terraform', 'tool.opentofu']);
    expect(toolsOfString('PowerShell (Get-WinEvent)')).toEqual(['tool.powershell']);
    expect(toolsOfString('show vlan brief')).toEqual(['tool.cisco-ios']);
    expect(toolsOfString('NIST CSF')).toEqual([]);
    expect(TOOL_STRING_EXCEPTIONS['NIST CSF']).toBeTruthy();
    expect(toolsOfString('a thing nobody wrote')).toEqual([]);
  });

  it('the quick-reference card has a tool line per course and every name on it resolves', () => {
    for (const c of SEED_COURSES) {
      const line = COURSE_TOOLS[c.id];
      expect(line, `${c.id} has a tool line`).toBeTruthy();
      for (const name of line.split(' · ')) {
        expect(toolsOfString(name).length > 0 || !!TOOL_STRING_EXCEPTIONS[name], `${c.id}: "${name}" resolves`).toBe(true);
      }
    }
  });

  it('toolsOfTask unions the strings, the command heads, the where lines and the overrides, and falls back to the course default', () => {
    const task = (over: Partial<Task>): Task => ({ id: 't', role: 'blue', week: 1, title: 'T', objective: '', steps: [], frameworks: [], deliverables: [], ...over });
    const step = (over: Partial<Task['steps'][number]>) => ({ id: 's', title: 'S', description: '', whatItMeans: '', frameworks: [], ...over });
    expect(toolsOfTask({ id: 'security-plus' }, task({ tools: ['nmap', 'NIST CSF'], steps: [step({ command: 'sudo ufw allow 22', where: 'Your Ubuntu server — SSH in' })] }))).toEqual(['tool.linux-shell', 'tool.ssh', 'tool.nmap', 'tool.ufw']);
    expect(toolsOfTask({ id: 'ccna' }, task({ steps: [step({ description: 'read the design' })] }))).toEqual(['tool.cisco-ios']);
    expect(toolsOfTask({ id: 'security-plus' }, task({ steps: [step({ commands: [{ cmd: 'RG=x; az group create' }, { cmd: 'cat x | grep y' }] })] }))).toEqual(['tool.linux-shell', 'tool.azure-cli']);
  });
});
