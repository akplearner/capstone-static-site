// Public data-access singletons. Swap these implementations (e.g. for a Supabase
// backend) without touching any page or component.
export { localStorageCourseRepo as courseRepo } from './localStorageCourseRepo';
export { localStorageProgressRepo as progressRepo } from './localStorageProgressRepo';
export type { CourseRepository, ProgressRepository, ImportResult } from './types';
