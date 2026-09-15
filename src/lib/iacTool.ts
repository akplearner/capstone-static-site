/**
 * Terraform or OpenTofu — the student's choice, applied to every command.
 *
 * The Server+ advanced track teaches infrastructure as code with Terraform.
 * OpenTofu is the open-source fork: the same HCL, the same bpg/proxmox
 * provider, the same file and state names, the same `terraform {}` block in
 * the code. What differs is the binary at the prompt (`tofu`), the version
 * banner (`OpenTofu v…`), and where it installs from. So the content is
 * authored once, for Terraform, and this module derives the OpenTofu form at
 * render time — except the install line, which is authored twice (see
 * `opentofu` on a command entry).
 *
 * Pure: no React, no storage. `labAccess.ts` reads the choice from the
 * student's Lab access values and exposes `useIacTool`.
 */

export type IacTool = 'terraform' | 'opentofu';

/** The `LabAccess.values` key the Lab access panel writes the choice under. */
export const IAC_TOOL_KEY = 'IAC_TOOL';

export const IAC_TOOLS: Record<IacTool, { name: string; binary: string; versionLine: string; docs: string }> = {
  terraform: { name: 'Terraform', binary: 'terraform', versionLine: 'Terraform v', docs: 'https://developer.hashicorp.com/terraform/install' },
  opentofu: { name: 'OpenTofu', binary: 'tofu', versionLine: 'OpenTofu v', docs: 'https://opentofu.org/docs/intro/install/' },
};

export function iacToolOf(values: Record<string, string> | undefined): IacTool {
  return values?.[IAC_TOOL_KEY] === 'opentofu' ? 'opentofu' : 'terraform';
}

/**
 * The binary, only when it is being INVOKED: `terraform` followed by a
 * subcommand or a flag. Everything else that spells the word is shared with
 * OpenTofu and must survive untouched — the `terraform@pve` user, the
 * `Terraform` role, the `terraform {` block, `terraform.tfvars`, `.terraform/`,
 * the `terraform/` folder in the repository.
 */
const INVOCATION = /\bterraform(?=\s+(?:init|plan|apply|import|state|destroy|fmt|validate|output|show|providers|refresh|taint|untaint|workspace|login|version|-version|-v|-help)\b)/g;

/** Rewrite a command, an expected output or a verify token for the chosen tool. */
export function applyIacTool(text: string, tool: IacTool): string {
  if (tool !== 'opentofu' || !text) return text;
  return text.replace(INVOCATION, IAC_TOOLS.opentofu.binary).split(IAC_TOOLS.terraform.versionLine).join(IAC_TOOLS.opentofu.versionLine);
}

/** A command that may carry an authored OpenTofu form (the install line). */
export interface IacCommandLike {
  cmd: string;
  opentofu?: string | { cmd: string };
}

/** The line to show: the authored OpenTofu form when there is one, else the derived one. */
export function commandFor(entry: IacCommandLike, tool: IacTool): string {
  if (tool === 'opentofu' && entry.opentofu) {
    return typeof entry.opentofu === 'string' ? entry.opentofu : entry.opentofu.cmd;
  }
  return applyIacTool(entry.cmd, tool);
}
