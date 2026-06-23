'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStudentContext } from '@/lib/storage';
import { useEffect } from 'react';
import { Collapsible, Badge } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function TeamSpacePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const { context, loading } = useStudentContext();

  useEffect(() => {
    if (!loading && !context) {
      router.push('/settings');
    }
  }, [context, loading, router]);

  if (loading || !context) {
    return <div>Loading...</div>;
  }

  // Only allow access to your own team
  if (context.teamId !== teamId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400">You can only view your own team's space.</p>
      </div>
    );
  }

  // Mock team artifacts
  const mockArtifacts = {
    week1: [
      { role: 'red', name: 'Asset_List.md', status: 'submitted' },
      { role: 'blue', name: 'Hardening_Checklist.txt', status: 'accepted' },
      { role: 'grc', name: 'Framework_Mapping.md', status: 'submitted' },
    ],
    week2: [
      { role: 'red', name: 'Nmap_Scan.txt', status: 'draft' },
      { role: 'blue', name: 'Baseline_Traffic.pcap', status: 'draft' },
    ],
    week3: [],
    week4: [],
  };

  const roleColors = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    grc: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team {teamId} Space</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {context.role === 'grc'
            ? 'Review and assemble team artifacts for grading.'
            : 'Submit your work here for the GRC to review.'}
        </p>
      </div>

      {/* Artifacts by Week */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map((week) => (
          <motion.div
            key={week}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: week * 0.1 }}
            className="rounded-lg border border-gray-200 p-6 dark:border-gray-700"
          >
            <h2 className="font-bold text-gray-900 dark:text-white">Week {week}</h2>
            <div className="mt-4 space-y-3">
              {mockArtifacts[`week${week}` as keyof typeof mockArtifacts].length > 0 ? (
                mockArtifacts[`week${week}` as keyof typeof mockArtifacts].map((artifact, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {artifact.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        From {artifact.role.toUpperCase()}
                      </div>
                    </div>
                    <Badge
                      variant={artifact.status === 'accepted' ? 'default' : 'secondary'}
                      className={artifact.status === 'accepted' ? 'bg-green-600 text-white' : ''}
                    >
                      {artifact.status}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No artifacts yet</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Phase 2 Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800/50"
      >
        <h3 className="font-bold text-gray-900 dark:text-white">Phase 2: Real Artifacts</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          In Phase 2, this page will integrate with file storage so you can upload, review, and compile real
          artifacts for grading.
        </p>
      </motion.div>
    </motion.div>
  );
}
