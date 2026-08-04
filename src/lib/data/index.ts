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
import { localStorageGrcRepo } from './localStorageGrcRepo';
import { localStorageUserStateRepo, localStorageLabAccessRepo } from './localStorageUserStateRepo';
import { supabaseProgressRepo } from './supabaseProgressRepo';
import { supabaseDocsRepo } from './supabaseDocsRepo';
import { supabaseGrcRepo } from './supabaseGrcRepo';
import { supabaseUserStateRepo, supabaseLabAccessRepo } from './supabaseUserStateRepo';

const cloud = isSupabaseConfigured();

export { localStorageCourseRepo as courseRepo } from './localStorageCourseRepo';
export const progressRepo = cloud ? supabaseProgressRepo : localStorageProgressRepo;
export const docsRepo = cloud ? supabaseDocsRepo : localStorageDocsRepo;
export const grcRepo = cloud ? supabaseGrcRepo : localStorageGrcRepo;
export const userStateRepo = cloud ? supabaseUserStateRepo : localStorageUserStateRepo;
export const labAccessRepo = cloud ? supabaseLabAccessRepo : localStorageLabAccessRepo;
export type {
  CourseRepository,
  ProgressRepository,
  GrcRepository,
  DocsRepository,
  UserStateRepository,
  LabAccessRepository,
  UserCourseState,
  LabAccessData,
  ImportResult,
} from './types';
