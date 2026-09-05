// Public data-access singletons. All student data is served by Supabase when
// configured, else by localStorage — selected here so no page or component needs
// to know which backend is live.
//
// `courseRepo` stays local by design: it holds authored COURSE CONTENT (the seeds
// plus any instructor-authored course), not student work. Everything a student
// produces now has a cloud path.
import { isSupabaseConfigured } from '../supabase/config';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageDocsRepo } from './localStorageDocsRepo';
import { localStorageUserStateRepo, localStorageLabAccessRepo } from './localStorageUserStateRepo';
import { localStorageEvidenceRepo, localStoragePathRepo } from './localStorageEvidenceRepo';
import { supabaseEvidenceRepo, supabasePathRepo } from './supabaseEvidenceRepo';
import { supabaseProgressRepo } from './supabaseProgressRepo';
import { supabaseDocsRepo } from './supabaseDocsRepo';
import { supabaseUserStateRepo, supabaseLabAccessRepo } from './supabaseUserStateRepo';

const cloud = isSupabaseConfigured();

export { localStorageCourseRepo as courseRepo } from './localStorageCourseRepo';
export const progressRepo = cloud ? supabaseProgressRepo : localStorageProgressRepo;
export const docsRepo = cloud ? supabaseDocsRepo : localStorageDocsRepo;
export const userStateRepo = cloud ? supabaseUserStateRepo : localStorageUserStateRepo;
export const labAccessRepo = cloud ? supabaseLabAccessRepo : localStorageLabAccessRepo;
export const evidenceRepo = cloud ? supabaseEvidenceRepo : localStorageEvidenceRepo;
export const pathRepo = cloud ? supabasePathRepo : localStoragePathRepo;
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
} from './types';
