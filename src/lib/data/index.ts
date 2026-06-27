// Public data-access singletons. User data (progress, deliverables) is served by
// Supabase when configured, else by localStorage — selected here so no page or
// component needs to know which backend is live. Course content (courseRepo) and the
// reserved GRC workspace (grcRepo) stay local for now.
import { isSupabaseConfigured } from '../supabase/config';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageDocsRepo } from './localStorageDocsRepo';
import { supabaseProgressRepo } from './supabaseProgressRepo';
import { supabaseDocsRepo } from './supabaseDocsRepo';

const cloud = isSupabaseConfigured();

export { localStorageCourseRepo as courseRepo } from './localStorageCourseRepo';
export { localStorageGrcRepo as grcRepo } from './localStorageGrcRepo';
export const progressRepo = cloud ? supabaseProgressRepo : localStorageProgressRepo;
export const docsRepo = cloud ? supabaseDocsRepo : localStorageDocsRepo;
export type {
  CourseRepository,
  ProgressRepository,
  GrcRepository,
  DocsRepository,
  ImportResult,
} from './types';
