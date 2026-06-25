// Public data-access singletons. Swap these implementations (e.g. for a Supabase
// backend) without touching any page or component.
export { localStorageCourseRepo as courseRepo } from './localStorageCourseRepo';
export { localStorageProgressRepo as progressRepo } from './localStorageProgressRepo';
export { localStorageGrcRepo as grcRepo } from './localStorageGrcRepo';
export { localStorageDocsRepo as docsRepo } from './localStorageDocsRepo';
export type {
  CourseRepository,
  ProgressRepository,
  GrcRepository,
  DocsRepository,
  ImportResult,
} from './types';
