'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Layers, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/RoleIcon';
import { courseRepo, progressRepo } from '@/lib/data';
import { Course } from '@/lib/types';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const list = courseRepo.list();
    setCourses(list);
    const map: Record<string, boolean> = {};
    list.forEach((c) => {
      map[c.id] = !!progressRepo.getContext(c.id);
    });
    setEnrolled(map);
  }, []);

  return (
    <div className="space-y-10">
      <div className="space-y-3 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Capstone Lab Platform</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Hands-on, role-based cyber ranges. Choose a course to begin, or open the instructor studio to build one.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h2>
              {course.isSeed && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  Built-in
                </span>
              )}
            </div>
            <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">{course.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {course.weeks.length} weeks</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.roles.length} roles</span>
              <span className="flex items-center gap-1">
                {course.roles.slice(0, 4).map((r) => (
                  <RoleIcon key={r.id} iconName={r.icon} className="h-4 w-4" color={r.color} />
                ))}
              </span>
            </div>

            <div className="mt-5 flex gap-3">
              <Link href={enrolled[course.id] ? `/courses/${course.id}/dashboard` : `/courses/${course.id}/settings`} className="flex-1">
                <Button className="flex w-full items-center justify-center gap-2">
                  {enrolled[course.id] ? 'Continue' : 'Enroll'} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/courses/${course.id}/guide`}>
                <Button variant="secondary" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Guide
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Are you an instructor?</h2>
        <p className="text-gray-600 dark:text-gray-400">Build and maintain courses, roles, weeks, tasks, and gates.</p>
        <Link href="/instructor">
          <Button variant="secondary" size="lg">Open Instructor Studio</Button>
        </Link>
      </div>
    </div>
  );
}
