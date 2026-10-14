/**
 * The platform's click-through agreements (R86): what every account must
 * acknowledge before using the platform, each versioned so a material change
 * re-asks everyone once.
 *
 * PURE DATA — the gate renders it, the acceptance log stores (id, version,
 * time, a hash of the text), the admin metrics read the log. Bump `version`
 * only for a change a person would want to re-read; fixing a typo is not that.
 *
 * The full Terms, Acceptable Use Policy and Privacy documents live at
 * /legal/terms, /legal/aup and /legal/privacy; their entries here are the
 * acknowledgement summaries with a link, so the gate stays readable and the
 * long form stays one click away.
 *
 * R110 bumped terms, aup, lab and privacy to version 2: the sandbox-only rule
 * and the liability clause (causes, implementation, overcharges, misuse,
 * consequences), explicit re-acceptance at the next sign-in, consent grants,
 * server-issued stamps with receipts, and candidate links. The wording is
 * plain-language drafting, pending counsel review; it is not legal advice.
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
    version: 2,
    title: 'Terms of Service & No-Guarantee Acknowledgement',
    summary: 'Educational material in a sandbox you control — no certification or exam pass is promised, and the platform is not liable for what you run.',
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
          'When pasted output matches a step’s expected tokens, the platform records that a match occurred, hashes the text and timestamps it. In cloud mode the platform may also issue the stamp you echo and log a receipt that the stamp came back matched. That is the entire claim — it is a record of work, not a credential and not proof of the machine.',
      },
      {
        heading: 'The service, as-is',
        body:
          'The platform is provided as-is, without warranty. Content, features and courses may change, and access may be suspended for accounts that break these terms.',
      },
      {
        heading: 'Acceptance and changes',
        body:
          'Every account accepts these agreements when it is registered, before the platform can be used. A changed agreement is presented again at the next sign-in and must be accepted before use continues; the acceptance log records which version you agreed to and when.',
      },
    ],
  },
  {
    id: 'aup',
    version: 2,
    title: 'Acceptable Use Policy',
    summary: 'Security techniques stay inside a sandbox you control — nowhere else, ever — and every cost and consequence of what you run is yours.',
    link: '/legal/aup',
    sections: [
      {
        heading: 'Sandbox only',
        body:
          'Every capstone exercise runs in a sandbox you control and can rebuild: your own machines, virtual machines, isolated networks, or cloud accounts you pay for. Nothing in a course is pointed at a production, school, employer, customer or public system, and nothing you build here is deployed to one as part of the course.',
      },
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
      {
        heading: 'Costs, misuse and consequences',
        body:
          'You bear every cost and consequence of what you run: cloud charges and any overcharge, data loss, outages, misconfiguration, misuse of a tool or technique, and every implementation decision you make. Capstone Quarry, its operators and instructors are not liable for any cause, implementation, overcharge, misuse or consequence arising from the capstone work, inside or outside the sandbox.',
      },
    ],
  },
  {
    id: 'lab',
    version: 2,
    title: 'Your Devices, Your Lab',
    summary: 'You run the lab as a sandbox you can rebuild; the platform is not liable for your equipment, network, costs or outcomes.',
    sections: [
      {
        heading: 'You are responsible for your environment',
        body:
          'Labs run on YOUR devices, networks, virtual machines and (optionally) cloud accounts, as a sandbox that is yours to control and to rebuild. You are responsible for providing them, securing them, backing up your data, and any costs they incur — including cloud charges and overcharges, bandwidth, and wear on hardware.',
      },
      {
        heading: 'The platform is not liable for lab issues',
        body:
          'Capstone Quarry, its operators and instructors are not responsible for damage to, data loss on, misconfiguration of, or outages in your lab environment or any device or network it touches, nor for issues arising from software the courses instruct you to install (hypervisors, security tools, operating systems). They are not liable for any cause, implementation, overcharge, misuse or consequence of the capstone work. Lab exercises intentionally involve powerful tools — snapshot your machines and work on systems you can afford to rebuild.',
      },
    ],
  },
  {
    id: 'privacy',
    version: 2,
    title: 'Data & Progress Notice',
    summary: 'What the platform stores, who can see it, what it never stores, and the consents and links only you can give or create.',
    link: '/legal/privacy',
    sections: [
      {
        heading: 'What is stored and who sees it',
        body:
          'The platform stores your name and picture from your sign-in provider, your enrolments, step progress, evidence records (hashes, counts and timestamps — never the pasted text itself), your team’s shared documents, frozen submissions, and this acknowledgement log. In cloud mode it may issue the verification stamp you echo and keep a receipt (course, task, step, hash and counts) when the stamp comes back matched. Teammates see your progress, evidence records and shared documents; instructors and admins see the class-wide view; blind peer reviewers see submitted documents with your identity removed. Lab credentials and private notes stay yours alone.',
      },
      {
        heading: 'Your consent grants',
        body:
          'Nothing about you reaches a third party unless a consent grant you give or a link you create allows it. The grants are listed on your account page, each one is off until you turn it on, and each can be revoked there. Nothing is used to train models. A link you create shares a frozen copy of your own export with whoever holds the link until it expires or you revoke it.',
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
