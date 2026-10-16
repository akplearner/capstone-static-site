// Public data-access singletons. All student data is served by Supabase when
// configured, else by localStorage — selected here so no page or component needs
// to know which backend is live.
//
// `courseRepo` holds COURSE CONTENT — the built-in courses from their documents
// plus whatever an instructor authored — and since R78-D5 it has a cloud path
// too (`course_documents`). Whichever repo is live also tells `content/docs.ts`
// where authored documents come from, so `courseDocument(id)` and every reader
// built on it see the same catalogue the repo serves.
import { isSupabaseConfigured } from '../supabase/config';
import { registerDocumentSource, registerFixesSource } from '../content/docs';
import { localStorageCourseRepo, localStorageCourseHistoryRepo, localDocumentSource } from './localStorageCourseRepo';
import { supabaseCourseRepo, supabaseDocumentSource } from './supabaseCourseRepo';
import { supabaseCourseHistoryRepo } from './supabaseCourseHistoryRepo';
import { localStorageContentFixesRepo } from './localStorageContentFixesRepo';
import { supabaseContentFixesRepo } from './supabaseContentFixesRepo';
import { localStorageEarnedRepo } from './localStorageEarnedRepo';
import { supabaseEarnedRepo } from './supabaseEarnedRepo';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageDocsRepo } from './localStorageDocsRepo';
import { localStorageUserStateRepo, localStorageLabAccessRepo } from './localStorageUserStateRepo';
import { localStorageEvidenceRepo, localStoragePathRepo } from './localStorageEvidenceRepo';
import { supabaseEvidenceRepo, supabasePathRepo } from './supabaseEvidenceRepo';
import { supabaseProgressRepo } from './supabaseProgressRepo';
import { supabaseDocsRepo } from './supabaseDocsRepo';
import { supabaseUserStateRepo, supabaseLabAccessRepo } from './supabaseUserStateRepo';
import { localStorageReviewRepo, localStorageCohortRepo, localStorageStepNotesRepo, localStorageTaskReportsRepo, localStorageSubmissionsRepo, localStorageStatusRepo } from './localStorageFeatureRepos';
import { supabaseReviewRepo, supabaseCohortRepo, supabaseStepNotesRepo, supabaseTaskReportsRepo, supabaseSubmissionsRepo, supabaseStatusRepo } from './supabaseFeatureRepos';

const cloud = isSupabaseConfigured();

export const courseRepo = cloud ? supabaseCourseRepo : localStorageCourseRepo;
// R122: every studio save is a numbered, restorable version (the History tab).
export const courseHistoryRepo = cloud ? supabaseCourseHistoryRepo : localStorageCourseHistoryRepo;
registerDocumentSource(cloud ? supabaseDocumentSource : localDocumentSource);
// R121: the content fix ledger, laid over every course wherever a course or its document is read.
export const contentFixesRepo = cloud ? supabaseContentFixesRepo : localStorageContentFixesRepo;
registerFixesSource((courseId) => contentFixesRepo.list(courseId));
// R125: what a member has earned, kept apart from the progress it was earned with, so a retake never costs a skill.
export const earnedRepo = cloud ? supabaseEarnedRepo : localStorageEarnedRepo;
export const progressRepo = cloud ? supabaseProgressRepo : localStorageProgressRepo;
export const docsRepo = cloud ? supabaseDocsRepo : localStorageDocsRepo;
export const userStateRepo = cloud ? supabaseUserStateRepo : localStorageUserStateRepo;
export const labAccessRepo = cloud ? supabaseLabAccessRepo : localStorageLabAccessRepo;
export const evidenceRepo = cloud ? supabaseEvidenceRepo : localStorageEvidenceRepo;
export const pathRepo = cloud ? supabasePathRepo : localStoragePathRepo;
// R68: instructor reviews, the cohort calendar, and per-step notes/stuck flags.
export const reviewRepo = cloud ? supabaseReviewRepo : localStorageReviewRepo;
export const cohortRepo = cloud ? supabaseCohortRepo : localStorageCohortRepo;
export const taskReportsRepo = cloud ? supabaseTaskReportsRepo : localStorageTaskReportsRepo;
export const stepNotesRepo = cloud ? supabaseStepNotesRepo : localStorageStepNotesRepo;
// R84: frozen submissions and blind peer review.
export const submissionsRepo = cloud ? supabaseSubmissionsRepo : localStorageSubmissionsRepo;
// R103: the team's document lifecycle (draft → in review → approved → issued).
export const statusRepo = cloud ? supabaseStatusRepo : localStorageStatusRepo;
export type {
  EarnedSkillsRepository,
  CourseRepository,
  ProgressRepository,
  DocsRepository,
  UserStateRepository,
  LabAccessRepository,
  EvidenceRepository,
  PathRepository,
  UserCourseState,
  LabAccessData,
  StepEvidence,
  EvidenceArtifact,
  EvidenceMethod,
  VerificationReceipt,
  RehashCheck,
  ImportResult,
  DeliverableReview,
  ReviewStatus,
  ReviewRepository,
  Cohort,
  CohortRepository,
  StepNote,
  StuckFlag,
  StepNotesRepository,
  DeliverableSubmission,
  SubmissionSnapshot,
  PeerReviewRow,
  ReviewQueueItem,
  ReviewPacket,
  SubmissionProgress,
  SubmissionsRepository,
  ContentFixesRepository,
  CourseHistoryRepository,
  CourseVersionEntry,
} from './types';
