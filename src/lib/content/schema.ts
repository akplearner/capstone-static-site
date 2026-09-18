/**
 * The document schema identifier, on its own so both halves can name it.
 *
 * It lived in `dto.ts` beside the writer, which made the READER import the
 * writer, and the writer imports every course seed — so a repository that
 * loaded from JSON pulled the whole authoring graph back in and hit the
 * circular-import error the loader existed to avoid. A shared constant has no
 * dependencies and cannot close a cycle.
 */
export const DTO_SCHEMA = 'capstone-course-dto/1';
