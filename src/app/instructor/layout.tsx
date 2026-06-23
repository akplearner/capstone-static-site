'use client';

import { InstructorGate } from '@/components/InstructorGate';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <InstructorGate>{children}</InstructorGate>;
}
