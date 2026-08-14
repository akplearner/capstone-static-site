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
      updated="14 August 2026"
      intro="The rules for using this platform. The section on what verification does and does not prove matters more than the usual boilerplate — please read it."
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
          browser and a determined person could defeat it. Do not represent a verification record as
          an audited or independently invigilated result, and do not rely on one when assessing
          someone else.
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
          account. You may delete your account at any time from the account page. We may suspend
          accounts that abuse the service, attack the platform, or use it to attack others.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          The deliverables, notes and evidence records you create remain yours. You grant us only the
          permission needed to store and display them back to you and, where you have joined a team,
          to your teammates. We do not claim ownership and do not use your content to train models.
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
          These terms may change as the product does. Material changes will be reflected in the date
          at the top of this page. Continuing to use the service after a change means you accept it.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
