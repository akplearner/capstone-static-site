import type { Level } from '../types';

/**
 * The catalog grid: one entry per vendor × credential we list.
 *
 * Most cells have no capstone authored yet — they are `coming-soon` roadmap
 * markers, deliberately NOT `Course` objects (a Course must have non-empty
 * roles/weeks/gates/tasks or its page breaks, so an empty one is a landmine).
 * The three real capstones are `available` and carry a `courseId` that resolves
 * to a seed course; everything else is a promise on the map.
 *
 * Every credential here is framed as capstone / home-lab / portfolio work — the
 * thing you build and can show, never an exam to sit.
 */
export type CatalogStatus = 'available' | 'coming-soon';

export interface CatalogEntry {
  id: string;
  vendorId: string;
  /** The credential this entry represents, e.g. 'Security+' or 'CCNA'. */
  certName: string;
  level: Level;
  status: CatalogStatus;
  /** Set only when `status === 'available'`: the seed course this opens. */
  courseId?: string;
  /** One-line "what you'll build" for the card. */
  blurb: string;
}

export const CATALOG: CatalogEntry[] = [
  // ── CompTIA — the Foundation Quarry ────────────────────────────────────────
  {
    id: 'comptia-a-plus',
    vendorId: 'comptia',
    certName: 'A+',
    level: 'entry',
    status: 'coming-soon',
    blurb: 'Build and document a working endpoint from bare hardware.',
  },
  {
    id: 'comptia-network-plus',
    vendorId: 'comptia',
    certName: 'Network+',
    level: 'entry',
    status: 'coming-soon',
    blurb: 'Stand up and map a small multi-subnet network.',
  },
  {
    id: 'comptia-security-plus',
    vendorId: 'comptia',
    certName: 'Security+',
    level: 'associate',
    status: 'available',
    courseId: 'security-plus',
    blurb: 'Run a live offensive + defensive range as Red, Blue, or GRC.',
  },
  {
    id: 'comptia-server-plus',
    vendorId: 'comptia',
    certName: 'Server+',
    level: 'associate',
    status: 'available',
    courseId: 'server-plus',
    blurb: 'Deploy a client server room as an MSP — assess, build, secure, hand over.',
  },
  {
    id: 'comptia-cysa-plus',
    vendorId: 'comptia',
    certName: 'CySA+',
    level: 'professional',
    status: 'available',
    courseId: 'cysa-plus',
    blurb: 'Operate a SOC on a live Wazuh stack — monitor, hunt, respond.',
  },
  {
    id: 'comptia-pentest-plus',
    vendorId: 'comptia',
    certName: 'PenTest+',
    level: 'professional',
    status: 'coming-soon',
    blurb: 'Run a scoped engagement end to end and write the report.',
  },
  {
    id: 'comptia-securityx',
    vendorId: 'comptia',
    certName: 'SecurityX (CASP+)',
    level: 'expert',
    status: 'coming-soon',
    blurb: 'Architect and defend an enterprise security programme.',
  },
  {
    id: 'comptia-secai-plus',
    vendorId: 'comptia',
    certName: 'SecAI+',
    level: 'professional',
    status: 'available',
    courseId: 'secai-plus',
    blurb: 'Secure an AI product: attack it, defend it, watch it, govern it, release it.',
  },

  // ── Cisco — the Copper Network Canyon ──────────────────────────────────────
  {
    id: 'cisco-ccst',
    vendorId: 'cisco',
    certName: 'CCST',
    level: 'entry',
    status: 'coming-soon',
    blurb: 'Wire up and verify your first switched network.',
  },
  {
    id: 'cisco-ccna',
    vendorId: 'cisco',
    certName: 'CCNA',
    level: 'associate',
    status: 'available',
    courseId: 'ccna',
    blurb: 'Run the network for a growing company — design, build, operate, hand over.',
  },
  {
    id: 'cisco-ccnp-security',
    vendorId: 'cisco',
    certName: 'CCNP Security',
    level: 'professional',
    status: 'coming-soon',
    blurb: 'Deploy firewalls, VPNs and segmentation across the canyon.',
  },
  {
    id: 'cisco-ccie-security',
    vendorId: 'cisco',
    certName: 'CCIE Security',
    level: 'expert',
    status: 'coming-soon',
    blurb: 'Design and defend a full enterprise security fabric.',
  },

  // ── ISC2 — the Obsidian Security Vault ─────────────────────────────────────
  {
    id: 'isc2-cc',
    vendorId: 'isc2',
    certName: 'CC (Certified in Cybersecurity)',
    level: 'entry',
    status: 'coming-soon',
    blurb: 'Apply the core controls to a small environment.',
  },
  {
    id: 'isc2-cissp',
    vendorId: 'isc2',
    certName: 'CISSP',
    level: 'expert',
    status: 'available',
    courseId: 'cissp',
    blurb: 'Build a security programme across all eight domains, six releases to federal-ready.',
  },
  {
    id: 'isc2-ccsp',
    vendorId: 'isc2',
    certName: 'CCSP',
    level: 'expert',
    status: 'coming-soon',
    blurb: 'Design and govern a secure cloud platform.',
  },

  // ── Microsoft — the Azure Crystal Basin ────────────────────────────────────
  {
    id: 'ms-az-900',
    vendorId: 'microsoft',
    certName: 'AZ-900',
    level: 'entry',
    status: 'available',
    courseId: 'azure-fundamentals',
    blurb: 'Build a small company in Azure: network, VM, website, serverless counter. Start here.',
  },
  {
    id: 'ms-sc-900',
    vendorId: 'microsoft',
    certName: 'SC-900',
    level: 'entry',
    status: 'coming-soon',
    blurb: 'Tour identity, compliance and security across Microsoft 365 + Azure.',
  },
  {
    id: 'ms-az-104',
    vendorId: 'microsoft',
    certName: 'AZ-104',
    level: 'associate',
    status: 'available',
    courseId: 'azure-administrator',
    blurb: 'Run it like production: identity, networking, server admin, backup.',
  },
  {
    id: 'ms-sc-200',
    vendorId: 'microsoft',
    certName: 'SC-200',
    level: 'associate',
    status: 'coming-soon',
    blurb: 'Run detection and response in Microsoft Sentinel + Defender.',
  },
  {
    id: 'ms-az-400',
    vendorId: 'microsoft',
    certName: 'AZ-400',
    level: 'expert',
    status: 'available',
    courseId: 'azure-devops',
    blurb: 'Codify it, deploy it from a pipeline, govern it, hand it over.',
  },
  {
    id: 'ms-az-500',
    vendorId: 'microsoft',
    certName: 'AZ-500',
    level: 'professional',
    status: 'coming-soon',
    blurb: 'Harden identity, network and data across an Azure estate.',
  },

  // ── AWS — the Ember Cloud Range ────────────────────────────────────────────
  {
    id: 'aws-cloud-practitioner',
    vendorId: 'aws',
    certName: 'Cloud Practitioner (CLF-C02)',
    level: 'entry',
    status: 'available',
    courseId: 'aws-cloud-practitioner',
    blurb: 'Build a small company in AWS: VPC, instance, website, serverless counter. Start here.',
  },
  {
    id: 'aws-saa',
    vendorId: 'aws',
    certName: 'Solutions Architect – Associate (SAA-C03)',
    level: 'associate',
    status: 'available',
    courseId: 'aws-solutions-architect',
    blurb: 'Run it like production: IAM, private subnet, instance admin, backup.',
  },
  {
    id: 'aws-devops-pro',
    vendorId: 'aws',
    certName: 'DevOps Engineer – Professional (DOP-C02)',
    level: 'professional',
    status: 'available',
    courseId: 'aws-devops',
    blurb: 'Codify it, deploy it from a pipeline, check it with Config, hand it over.',
  },
  {
    id: 'aws-security-specialty',
    vendorId: 'aws',
    certName: 'Security – Specialty',
    level: 'professional',
    status: 'coming-soon',
    blurb: 'Lock down IAM, logging and data protection across accounts.',
  },

  // ── Linux — the Emerald System Caverns ─────────────────────────────────────
  {
    id: 'linux-essentials',
    vendorId: 'linux',
    certName: 'Linux Essentials',
    level: 'entry',
    status: 'coming-soon',
    blurb: 'Live in the shell — files, permissions and processes.',
  },
  {
    id: 'linux-lpic-1',
    vendorId: 'linux',
    certName: 'LPIC-1 / Linux+',
    level: 'associate',
    status: 'coming-soon',
    blurb: 'Administer and automate a real Linux server.',
  },
  {
    id: 'linux-rhce',
    vendorId: 'linux',
    certName: 'RHCE',
    level: 'professional',
    status: 'coming-soon',
    blurb: 'Automate a fleet with Ansible and prove it converges.',
  },

  // ── Engagements — the Obsidian Audit Vault ─────────────────────────────────
  {
    id: 'engagement-soc2-iso27001',
    vendorId: 'engagement',
    certName: 'SOC 2 + ISO 27001',
    level: 'professional',
    // Unlocked in R84 (the instructor's no-unnecessary-locks rule): the seed is
    // complete — 5 weeks, 16 tasks, 8 deliverables, 4 gates — so the card and
    // the seed agree that it is open. helpers.test.ts keeps them agreeing.
    status: 'available',
    courseId: 'mssp',
    blurb: 'Run a real client engagement to audit-ready evidence.',
  },
];
