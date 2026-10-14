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
      updated="14 October 2026"
      intro="This describes exactly what the platform stores about you and what you can do about it. It is written to be specific rather than reassuring — if something is stored, it is named here."
    >
      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Account details.</strong> Your email address, and a display name if you set one.
            Provided by you, or by the sign-in provider you use — Google or GitHub, which tell us your
            email address, name and avatar and nothing else.
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
            <strong>Verification stamps and receipts</strong> (cloud mode). The platform may issue the
            short-lived stamp you echo into your output and, when the stamp comes back matched, keep
            a receipt of the course, task, step, the hash and the token counts — never the pasted
            text. A receipt records the stamp, not your machine.
          </li>
          <li>
            <strong>Consent grants and outcomes.</strong> Which consents you have turned on or off, and
            when. If you turn on the outcome grant, the answers you give on the account page about
            where the work took you. Employer names you type are visible only to you; instructors
            see counts per status, and only when at least five members of a course have answered.
          </li>
          <li>
            <strong>Links you create.</strong> A frozen copy of the export you chose to share, the
            link’s expiry, and whether you revoked it. The link itself is shown to you once and is
            stored only as a hash.
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
          share it with third parties beyond the infrastructure providers below, except as a consent
          grant you give or a link you create allows. Nothing is used to train models.
        </p>
      </LegalSection>

      <LegalSection title="Consent grants">
        <p>
          Every grant is off until you turn it on from your account page, and each can be turned off
          there again; revoking stops any future use. The grants are:
        </p>
        <ul>
          <li>
            <strong>Share with an employer.</strong> Lets you create expiring links to a frozen copy of
            your own export. Without it no link can be created; with it nothing is shared until you
            create one.
          </li>
          <li>
            <strong>Benchmark.</strong> Lets your numbers be counted, without your name, in cohort bands
            that other members and instructors see as counts only. Never a rank.
          </li>
          <li>
            <strong>Outcomes.</strong> Lets you answer the outcome questions on your account page and
            lets instructors see counts per status for a course, only when at least five members have
            answered.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Links you create">
        <p>
          A link you create shows a frozen copy of the export you chose, exactly as it was when you
          created the link, to whoever holds the link, until it expires (at most ninety days) or you
          revoke it from your account page. The copy is unsigned and says so; it never carries your
          email address or account id. You are the only one who can create or revoke a link.
        </p>
      </LegalSection>

      <LegalSection title="Where it is stored">
        <ul>
          <li>
            <strong>Supabase</strong> (database and authentication). Every table is protected by
            row-level security. Your rows are readable only by you, except: team deliverables, team
            progress, step evidence records and stuck flags are visible to members of your own team;
            instructors see the class-wide view of evidence, completions, flags and the acceptance
            log; blind peer reviewers see submitted documents with your identity removed.
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
          <li>
            <strong>Consent.</strong> Every grant is yours to turn on or off from your account page, and
            every link you created is listed there with a Revoke control.
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
