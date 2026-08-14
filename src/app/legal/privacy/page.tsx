import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Capstone Quarry collects, why, where it is stored, and how to get it back or delete it.',
  alternates: { canonical: '/legal/privacy' },
};

// A server component: static text, no interactivity, so it costs the browser
// nothing and stays fully indexable.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="14 August 2026"
      intro="This describes exactly what the platform stores about you and what you can do about it. It is written to be specific rather than reassuring — if something is stored, it is named here."
    >
      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Account details.</strong> Your email address, and a display name if you set one.
            Provided by you, or by Google/GitHub if you sign in that way.
          </li>
          <li>
            <strong>Course progress.</strong> Which steps you have completed and when, which team and
            role you joined, and where you left off.
          </li>
          <li>
            <strong>Your evidence ledger.</strong> For each step you verify: whether it matched, how
            many attempts you made, timestamps, and a <strong>SHA-256 hash</strong> of the output you
            pasted. <strong>We do not store the output itself</strong> — terminal output routinely
            contains internal IP addresses, hostnames and sometimes credentials, so only the hash
            leaves your browser.
          </li>
          <li>
            <strong>Evidence file records.</strong> Filenames, sizes and SHA-256 hashes of files you
            hash in the app. <strong>The files themselves are never uploaded</strong> and stay on your
            machine.
          </li>
          <li>
            <strong>Deliverables you write.</strong> The content of the report forms you fill in.
          </li>
          <li>
            <strong>Lab access notes.</strong> The IP addresses, checklist and free-text notes you
            enter in the lab-access panel. See the warning below.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="A specific warning about lab notes" tone="warn">
        <p>
          The lab-access panel has a free-text notes field. It is stored in our database, readable
          only by your own account, and never shared with teammates or instructors.
        </p>
        <p>
          <strong>Do not put production credentials, work passwords, or any password you reuse
          elsewhere in that field.</strong> It is intended for throwaway details of an isolated
          practice lab. If you would be harmed by that text leaking, it does not belong there.
        </p>
      </LegalSection>

      <LegalSection title="Why we collect it">
        <p>
          Solely to run the product: to show you your progress across devices, to build the evidence
          record and portfolio that are the point of the platform, and to let teammates see shared
          team deliverables. We do not sell your data, we do not use it for advertising, and we do not
          share it with third parties beyond the infrastructure providers below.
        </p>
      </LegalSection>

      <LegalSection title="Where it is stored">
        <ul>
          <li>
            <strong>Supabase</strong> (database and authentication). Every table is protected by
            row-level security, so your rows are readable only by you — except team deliverables and
            team progress, which are visible to members of your own team by design.
          </li>
          <li>
            <strong>Your browser.</strong> If you use the platform without an account, everything
            stays in local storage on that device and reaches no server at all.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Your rights">
        <ul>
          <li>
            <strong>Export.</strong> Download everything your account holds as JSON, at any time, from
            your account page.
          </li>
          <li>
            <strong>Deletion.</strong> Delete your account and all its data from your account page.
            This is immediate and cannot be undone.
          </li>
          <li>
            <strong>Access and correction.</strong> The app shows you your data directly; you can edit
            or remove most of it in place.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We set one kind of cookie: the session cookie that keeps you signed in. There are no
          advertising or third-party tracking cookies. Your theme preference is kept in local storage,
          not a cookie.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For any privacy question, or to request deletion if the in-app tool does not work for you,
          contact the site operator using the address published on the site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
