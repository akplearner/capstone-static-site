import { describe, it, expect } from 'vitest';
import { applyIacTool, commandFor, iacToolOf, IAC_TOOL_KEY } from './iacTool';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { PROCEDURES } from './docs/serverProcedures';
import { scoreOutput } from './evidenceLedger';
import { GLOSSARY } from './glossary';

describe('applyIacTool — the OpenTofu form of a Terraform line', () => {
  it('is the identity for Terraform', () => {
    expect(applyIacTool('terraform init && terraform plan', 'terraform')).toBe('terraform init && terraform plan');
  });

  it('rewrites the binary where it is invoked', () => {
    expect(applyIacTool('terraform init && terraform plan', 'opentofu')).toBe('tofu init && tofu plan');
    expect(applyIacTool('terraform plan -out tools.plan && terraform apply tools.plan', 'opentofu')).toBe('tofu plan -out tools.plan && tofu apply tools.plan');
    expect(applyIacTool('terraform import proxmox_virtual_environment_vm.websrv pve-host/100', 'opentofu')).toBe('tofu import proxmox_virtual_environment_vm.websrv pve-host/100');
    expect(applyIacTool('terraform -version && ansible --version', 'opentofu')).toBe('tofu -version && ansible --version');
    expect(applyIacTool('terraform state list', 'opentofu')).toBe('tofu state list');
    expect(applyIacTool('$ terraform plan\n\nNo changes.', 'opentofu')).toBe('$ tofu plan\n\nNo changes.');
  });

  it('rewrites the version banner, so the Week-6 verify token matches what tofu prints', () => {
    expect(applyIacTool('Terraform v1.9.8\non linux_amd64', 'opentofu')).toBe('OpenTofu v1.9.8\non linux_amd64');
    expect(applyIacTool('Terraform v', 'opentofu')).toBe('OpenTofu v');
  });

  it('leaves everything OpenTofu shares with Terraform untouched', () => {
    const shared = [
      'pveum user add terraform@pve --comment "Terraform provider"',
      'pveum aclmod / -user terraform@pve -role Terraform',
      "export PROXMOX_VE_API_TOKEN='terraform@pve!provider=PASTE'",
      'terraform {\n  required_providers {',
      'cp terraform.tfvars.example terraform.tfvars',
      '*.tfstate\n.terraform/\n.terraform.lock.hcl',
      'cd ~/team07-infra/terraform && ls',
      'mkdir -p terraform ansible docs',
    ];
    for (const line of shared) expect(applyIacTool(line, 'opentofu')).toBe(line);
  });

  it('is idempotent', () => {
    const once = applyIacTool('terraform plan; Terraform v1.9.8', 'opentofu');
    expect(applyIacTool(once, 'opentofu')).toBe(once);
  });

  it('reads the choice from Lab access values, defaulting to Terraform', () => {
    expect(iacToolOf(undefined)).toBe('terraform');
    expect(iacToolOf({})).toBe('terraform');
    expect(iacToolOf({ [IAC_TOOL_KEY]: 'opentofu' })).toBe('opentofu');
    expect(iacToolOf({ [IAC_TOOL_KEY]: 'anything-else' })).toBe('terraform');
  });

  it('prefers an authored OpenTofu form over the derived one', () => {
    expect(commandFor({ cmd: 'apt install terraform', opentofu: 'apt install tofu' }, 'opentofu')).toBe('apt install tofu');
    expect(commandFor({ cmd: 'apt install terraform', opentofu: { cmd: 'apt install tofu' } }, 'opentofu')).toBe('apt install tofu');
    expect(commandFor({ cmd: 'apt install terraform', opentofu: 'apt install tofu' }, 'terraform')).toBe('apt install terraform');
    expect(commandFor({ cmd: 'terraform plan' }, 'opentofu')).toBe('tofu plan');
  });
});

/**
 * The content guard: every Server+ line a student can copy has a correct
 * OpenTofu form. A `terraform <subcommand>` that survives the rewrite, or a
 * HashiCorp install line with no authored OpenTofu twin, is a line that would
 * fail on a team that chose OpenTofu.
 */
describe('every Server+ Terraform line has an OpenTofu form', () => {
  const INVOKED = /\bterraform\s+(?:init|plan|apply|import|state|destroy|-version)\b/;
  const seedCommands = SERVER_PLUS.tasks.flatMap((t) => t.steps).flatMap((s) => s.commands ?? []);
  const procCommands = PROCEDURES.flatMap((p) => p.steps).filter((s): s is typeof s & { cmd: string } => !!s.cmd);

  it('no invoked terraform survives the rewrite in the seed', () => {
    const left = seedCommands.map((c) => commandFor(c, 'opentofu')).filter((c) => INVOKED.test(c));
    expect(left).toEqual([]);
  });

  it('no invoked terraform survives the rewrite in the guide', () => {
    const left = procCommands.map((s) => commandFor(s, 'opentofu')).filter((c) => INVOKED.test(c));
    expect(left).toEqual([]);
  });

  it('every HashiCorp install line carries an authored OpenTofu twin, and the twin is OpenTofu', () => {
    const installs = [...seedCommands, ...procCommands].filter((c) => /hashicorp/i.test(c.cmd));
    expect(installs.length).toBeGreaterThan(0);
    for (const c of installs) {
      expect(c.opentofu, c.cmd.slice(0, 60)).toBeTruthy();
      const twin = commandFor(c, 'opentofu');
      expect(twin).not.toMatch(/hashicorp/i);
      expect(twin).toMatch(/opentofu|tofu/);
    }
  });

  it('the Week-6 version check verifies under either tool', () => {
    const step = SERVER_PLUS.tasks.flatMap((t) => t.steps).find((s) => s.id === 'sp-w6-ops-s0');
    expect(step?.verify).toContain('Terraform v');
    const terraform = scoreOutput('Terraform v1.9.8\non linux_amd64\nansible [core 2.16.3]', step!.verify!);
    expect(terraform.allMatched).toBe(true);
    const tofuTokens = step!.verify!.map((v) => applyIacTool(v, 'opentofu'));
    const opentofu = scoreOutput('OpenTofu v1.8.8\non linux_amd64\nansible [core 2.16.3]', tofuTokens);
    expect(opentofu.allMatched).toBe(true);
  });

  it('the prose names both tools where it names one', () => {
    const tools = SERVER_PLUS.tasks.flatMap((t) => t.tools ?? []);
    expect(tools).not.toContain('Terraform');
    expect(tools).toContain('Terraform or OpenTofu');
    expect(GLOSSARY.OpenTofu).toMatch(/fork/);
    const w5 = PROCEDURES.find((p) => p.id === 'terraform-proxmox-provider');
    expect(w5?.title).toMatch(/OpenTofu/);
    expect(w5?.summary).toMatch(/pick one for the whole team/i);
  });
});
