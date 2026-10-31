'use client';

import { CourseSubNav } from '@/components/CourseSubNav';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { LabNetworkReference } from '@/components/docs/LabNetworkReference';
import { PageHeader } from '@/components/ui/PageHeader';
import { Crumbs } from '@/components/SiteNav';
import { GuideSkeleton } from '@/components/ui/Skeletons';
import { useCourse, useCourseDocument } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { networkOf } from '@/lib/content/read';

/**
 * R156 — the Network tab: the full lab-network reference. The Tasks-tab picture is the week at a glance;
 * this is the whole LAN a student keeps open beside it — every component with its address, Docker and
 * what it publishes, every port and whether the lab network can reach it, the tools on each host, the
 * attack catalogue in exam vocabulary, and what every task of the week does on the network.
 *
 * Same gate as the Guide: course material needs enrolment. A course without a network has no tab, and a
 * typed URL lands on the enrol gate's sibling: a short note that this course has no lab network.
 */
export default function CourseNetworkPage() {
  const course = useCourse();
  const net = networkOf(useCourseDocument());
  const { member, loading } = useMember(course.id);

  if (loading) return <GuideSkeleton />;
  if (!member) return <CourseEnrolGate courseId={course.id} what="the lab network" />;

  return (
    <div className="space-y-8">
      <CourseSubNav courseId={course.id} active="network" teamId={member.teamId} />

      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: course.title, href: `/courses/${course.id}` }, { label: 'Network' }]} />}
        title={net.hosts.length ? net.copy.title : 'No lab network'}
        lede={net.hosts.length ? net.copy.reference?.lede ?? net.copy.howToRead : 'This course has no lab network to draw.'}
      />

      {net.hosts.length > 0 && <LabNetworkReference course={course} member={member} />}
    </div>
  );
}
