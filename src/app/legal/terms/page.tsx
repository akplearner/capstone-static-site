import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using Capstone Quarry, including the limits on what a verified step means.',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="14 October 2026"
      intro="The rules for using this platform. The sections on what verification does and does not prove, and on the sandbox and liability, matter more than the usual boilerplate — please read them."
    >
      <LegalSection title="What this service is">
        <p>
          Capstone Quarry provides guided, hands-on cybersecurity capstone projects that you build in
          your own lab environment, together with a record of the work you verify along the way. It is
          educational material. It is not a certification body, and completing a capstone here does not
          award any vendor certification.
        </p>
      </LegalSection>

      <LegalSection title="What a “verified” step actually means" tone="warn">
        <p>
          When you paste command output and it matches the expected result, we record that a match
          occurred, hash the text, and timestamp it. That is the entire claim.
        </p>
        <p>
          It is <strong>not</strong> proof that a command ran on real hardware, that your lab is
          configured correctly, or that the work is of professional quality. The check runs in your
          browser and a determined person could defeat it. In cloud mode the platform may issue the
          stamp you echo into your output and log a receipt that the stamp came back matched; a
          receipt records the stamp, not the machine. Do not represent a verification record as an
          audited or independently invigilated result, and do not rely on one when assessing someone
          else.
        </p>
      </LegalSection>

      <LegalSection title="Sandbox and liability" tone="warn">
        <p>
          Every capstone exercise runs in a <strong>sandbox you control and can rebuild</strong>: your
          own machines, virtual machines, isolated networks, or cloud accounts you pay for. Nothing in
          a course is pointed at a production, school, employer, customer or public system.
        </p>
        <p>
          You bear every cost and consequence of what you run there: cloud charges and any overcharge,
          data loss, outages, misconfiguration, misuse of a tool or technique, and every implementation
          decision you make. Capstone Quarry, its operators and instructors are{' '}
          <strong>not liable for any cause, implementation, overcharge, misuse or consequence</strong>{' '}
          arising from the capstone work, inside or outside the sandbox. The{' '}
          <a href="/legal/aup" className="text-accent hover:underline">Acceptable Use Policy</a> says
          what you may and may never do with the techniques taught here.
        </p>
      </LegalSection>

      <LegalSection title="Your lab, your responsibility">
        <p>
          The exercises involve security tooling — scanners, exploitation frameworks and traffic
          capture. You agree to run them <strong>only against systems you own or have explicit written
          authorisation to test</strong>, on an isolated network. Running these tools against systems
          you do not have permission to test is illegal in most jurisdictions. You are solely
          responsible for what you point them at.
        </p>
        <p>
          You are also responsible for the security of your own lab, and for not storing production or
          reused credentials in the platform.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You must provide an accurate email address, keep your credentials secure, and not share your
          account. Every account accepts the platform agreements when it is registered, before the
          platform can be used. You may delete your account at any time from the account page. We may
          suspend accounts that abuse the service, attack the platform, or use it to attack others.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          The deliverables, notes and evidence records you create remain yours. You grant us only the
          permission needed to store and display them back to you and, where you have joined a team,
          to your teammates. We do not claim ownership and do not use your content to train models.
          Where you create a link to a copy of your export, you authorise us to show that frozen copy
          to whoever holds the link until it expires or you revoke it.
        </p>
      </LegalSection>

      <LegalSection title="Availability and liability">
        <p>
          The service is provided “as is”, without warranty. We do not guarantee uninterrupted
          availability, and we are not liable for loss of data, loss of progress, or any damage
          arising from your use of the exercises or tools described here. Export your portfolio if you
          need a durable copy.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          These terms may change as the product does. Material changes are reflected in the date at
          the top of this page and in the version number of the agreement you accept in the app. A
          changed agreement is presented again at your next sign-in and must be accepted before use
          continues; the acceptance log records which version you agreed to and when.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
