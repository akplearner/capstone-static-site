/**
 * The platform's click-through agreements (R86): what every account must
 * acknowledge before using the platform, each versioned so a material change
 * re-asks everyone once.
 *
 * PURE DATA — the gate renders it, the acceptance log stores (id, version,
 * time), the admin metrics read the log. Bump `version` only for a change a
 * person would want to re-read; fixing a typo is not that.
 *
 * The full Terms and Privacy documents live at /legal/terms and
 * /legal/privacy; their entries here are the acknowledgement summaries with a
 * link, so the gate stays readable and the long form stays one click away.
 */

export interface AgreementSection {
  heading: string;
  body: string;
}

export interface Agreement {
  id: string;
  version: number;
  title: string;
  /** One line under the title — what saying yes means. */
  summary: string;
  sections: AgreementSection[];
  /** Full document, where one exists beyond the sections. */
  link?: string;
}

export const AGREEMENTS: Agreement[] = [
  {
    id: 'terms',
    version: 1,
    title: 'Terms of Service & No-Guarantee Acknowledgement',
    summary: 'This is educational material — it does not promise you a certification or an exam pass.',
    link: '/legal/terms',
    sections: [
      {
        heading: 'No exam or certification guarantee',
        body:
          'Capstone Quarry provides guided capstone projects and a record of the work you verify. Completing a capstone does not award any certification, and the platform makes NO guarantee — express or implied — that you will pass any exam (Security+, CySA+, Server+, CCNA or any other). Your result depends on your own study and the exam body. Capstone Quarry is not affiliated with, endorsed by, or a substitute for CompTIA, Cisco, ISO, AICPA or any certification body.',
      },
      {
        heading: 'What a “verified” step means',
        body:
          'When pasted output matches a step’s expected tokens, the platform records that a match occurred, hashes the text and timestamps it. That is the entire claim — it is a record of work, not a credential.',
      },
      {
        heading: 'The service, as-is',
        body:
          'The platform is provided as-is, without warranty. Content, features and courses may change, and access may be suspended for accounts that break these terms.',
      },
    ],
  },
  {
    id: 'aup',
    version: 1,
    title: 'Acceptable Use Policy',
    summary: 'Security techniques stay inside your authorized lab — nowhere else, ever.',
    sections: [
      {
        heading: 'Authorized targets only',
        body:
          'The courses teach offensive and defensive techniques. You may apply them ONLY against lab systems you own or that your team’s signed Scope & Rules of Engagement authorizes. Scanning, attacking or accessing any other system, network or account — including school, employer or public systems — is prohibited and may be a crime under computer-misuse laws in your jurisdiction. You alone are responsible for staying inside the law.',
      },
      {
        heading: 'Your account is yours',
        body:
          'One person per account. Do not share credentials, submit another person’s work as your own, or interfere with other students’ data or labs.',
      },
    ],
  },
  {
    id: 'lab',
    version: 1,
    title: 'Your Devices, Your Lab',
    summary: 'You run the lab; the platform is not responsible for your equipment, network or costs.',
    sections: [
      {
        heading: 'You are responsible for your environment',
        body:
          'Labs run on YOUR devices, networks, virtual machines and (optionally) cloud accounts. You are responsible for providing them, securing them, backing up your data, and any costs they incur — including cloud charges, bandwidth, and wear on hardware.',
      },
      {
        heading: 'The platform is not liable for lab issues',
        body:
          'Capstone Quarry, its operators and instructors are not responsible for damage to, data loss on, misconfiguration of, or outages in your lab environment or any device or network it touches, nor for issues arising from software the courses instruct you to install (hypervisors, security tools, operating systems). Lab exercises intentionally involve powerful tools — snapshot your machines and work on systems you can afford to rebuild.',
      },
    ],
  },
  {
    id: 'privacy',
    version: 1,
    title: 'Data & Progress Notice',
    summary: 'What the platform stores, who can see it, and what it never stores.',
    link: '/legal/privacy',
    sections: [
      {
        heading: 'What is stored and who sees it',
        body:
          'The platform stores your name and picture from your sign-in provider, your enrolments, step progress, evidence records (hashes, counts and timestamps — never the pasted text itself), your team’s shared documents, frozen submissions, and this acknowledgement log. Teammates see your progress and shared documents; instructors and admins see the class-wide view; blind peer reviewers see submitted documents with your identity removed. Lab credentials and private notes stay yours alone.',
      },
      {
        heading: 'Your controls',
        body:
          'You can export your work at any time and delete your account, which removes your rows. The full policy at /legal/privacy names every stored item.',
      },
    ],
  },
  {
    id: 'conduct',
    version: 1,
    title: 'Honest Work & Team Conduct',
    summary: 'Evidence is honest, reviews are in good faith, teammates are treated with respect.',
    sections: [
      {
        heading: 'Honest evidence',
        body:
          'Verification stamps, pasted output and frozen submissions exist to make real work visible. Fabricating output, sharing stamps, or gaming checks defeats the point of the capstone and may end access to the platform.',
      },
      {
        heading: 'Reviews and teammates',
        body:
          'Blind peer reviews are answered in good faith on the work alone. Team spaces are shared — treat teammates and their work with respect.',
      },
    ],
  },
];

/** ids of everything an account must have accepted at CURRENT versions. */
export function missingAcceptances(accepted: Record<string, number>): Agreement[] {
  return AGREEMENTS.filter((a) => (accepted[a.id] ?? 0) < a.version);
}
