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
import { registerDocumentSource } from '../content/docs';
import { localStorageCourseRepo, localDocumentSource } from './localStorageCourseRepo';
import { supabaseCourseRepo, supabaseDocumentSource } from './supabaseCourseRepo';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageDocsRepo } from './localStorageDocsRepo';
import { localStorageUserStateRepo, localStorageLabAccessRepo } from './localStorageUserStateRepo';
import { localStorageEvidenceRepo, localStoragePathRepo } from './localStorageEvidenceRepo';
import { supabaseEvidenceRepo, supabasePathRepo } from './supabaseEvidenceRepo';
import { supabaseProgressRepo } from './supabaseProgressRepo';
import { supabaseDocsRepo } from './supabaseDocsRepo';
import { supabaseUserStateRepo, supabaseLabAccessRepo } from './supabaseUserStateRepo';
import { localStorageReviewRepo, localStorageCohortRepo, localStorageStepNotesRepo } from './localStorageFeatureRepos';
import { supabaseReviewRepo, supabaseCohortRepo, supabaseStepNotesRepo } from './supabaseFeatureRepos';

const cloud = isSupabaseConfigured();

export const courseRepo = cloud ? supabaseCourseRepo : localStorageCourseRepo;
registerDocumentSource(cloud ? supabaseDocumentSource : localDocumentSource);
export const progressRepo = cloud ? supabaseProgressRepo : localStorageProgressRepo;
export const docsRepo = cloud ? supabaseDocsRepo : localStorageDocsRepo;
export const userStateRepo = cloud ? supabaseUserStateRepo : localStorageUserStateRepo;
export const labAccessRepo = cloud ? supabaseLabAccessRepo : localStorageLabAccessRepo;
export const evidenceRepo = cloud ? supabaseEvidenceRepo : localStorageEvidenceRepo;
export const pathRepo = cloud ? supabasePathRepo : localStoragePathRepo;
// R68: instructor reviews, the cohort calendar, and per-step notes/stuck flags.
export const reviewRepo = cloud ? supabaseReviewRepo : localStorageReviewRepo;
export const cohortRepo = cloud ? supabaseCohortRepo : localStorageCohortRepo;
export const stepNotesRepo = cloud ? supabaseStepNotesRepo : localStorageStepNotesRepo;
export type {
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
  ImportResult,
  DeliverableReview,
  ReviewStatus,
  ReviewRepository,
  Cohort,
  CohortRepository,
  StepNote,
  StuckFlag,
  StepNotesRepository,
} from './types';
