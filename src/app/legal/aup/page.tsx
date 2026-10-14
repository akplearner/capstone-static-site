import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: 'Where capstone work may run, what is prohibited, and who bears the costs and consequences of what you run.',
  alternates: { canonical: '/legal/aup' },
};

// A server component, like the other legal pages: static text, indexable, no
// client bundle. R110 gave the AUP its own page; the gate's summary links here.
// Plain-language drafting, pending counsel review — not legal advice.
export default function AupPage() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      updated="14 October 2026"
      intro="Where the capstone work may run, what you may never point it at, and who carries the costs and consequences. Every account accepts this policy before using the platform."
    >
      <LegalSection title="Purpose">
        <p>
          The courses teach offensive and defensive security techniques by having you build, break and
          harden systems. Those techniques are dangerous outside a controlled environment. This policy
          draws the line: the sandbox is the only place the work happens, and everything that happens
          there is your responsibility.
        </p>
      </LegalSection>

      <LegalSection title="Sandbox only" tone="warn">
        <p>
          Every capstone exercise runs in a <strong>sandbox you control and can rebuild</strong>: your
          own machines, virtual machines, isolated networks, or cloud accounts you pay for. Nothing in a
          course is pointed at a production, school, employer, customer or public system, and nothing
          you build here is deployed to one as part of the course. Snapshot your machines before each
          week and work only on systems you can afford to lose.
        </p>
      </LegalSection>

      <LegalSection title="Authorized targets">
        <p>
          You may apply the techniques taught here only against lab systems you own, or that your
          team’s signed Scope &amp; Rules of Engagement authorizes. Scanning, attacking or accessing any
          other system, network or account is prohibited and may be a crime under the computer-misuse
          laws of your jurisdiction. You alone are responsible for staying inside the law.
        </p>
      </LegalSection>

      <LegalSection title="Prohibited uses">
        <ul>
          <li>Scanning, attacking, accessing or exfiltrating from anything outside your sandbox.</li>
          <li>Storing production credentials, work passwords or any reused password in the platform.</li>
          <li>Sharing verification stamps, fabricating pasted output, or otherwise gaming a check.</li>
          <li>Interfering with other members’ data, labs, documents or reviews.</li>
          <li>Using the platform, or anything learned on it, to attack the platform or its operators.</li>
          <li>Letting another person use your account, or using someone else’s.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          One person per account. Keep your credentials to yourself, do not submit another person’s work
          as your own, and keep your lab notes free of anything you would be harmed by leaking.
        </p>
      </LegalSection>

      <LegalSection title="Costs, misuse and consequences" tone="warn">
        <p>
          You bear every cost and consequence of what you run: cloud charges and any overcharge, data
          loss, outages, misconfiguration, misuse of a tool or technique, and every implementation
          decision you make along the way. Capstone Quarry, its operators and instructors are{' '}
          <strong>not liable for any cause, implementation, overcharge, misuse or consequence</strong>{' '}
          arising from the capstone work, inside or outside the sandbox.
        </p>
      </LegalSection>

      <LegalSection title="Enforcement">
        <p>
          Breaking this policy may end your access without notice. Where the law requires it, the
          operators may hand records to the authorities. Disagreeing with the policy after accepting it
          is an account-deletion conversation, not an edit: the acceptance log is never rewritten.
        </p>
      </LegalSection>

      <LegalSection title="Acceptance and versions">
        <p>
          Every account accepts this policy, with the other platform agreements, when it is registered
          and before the platform can be used. When the text changes in a way worth re-reading, the
          version number goes up and the changed agreement is presented again at your next sign-in;
          use continues once it is accepted. The acceptance log records the agreement, the version, the
          time and a hash of the text you agreed to.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
