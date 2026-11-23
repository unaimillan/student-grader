export const DEFAULT_GRADE_COUNT = 1;

export interface Student {
  name: string;
  surname: string;
  email: string;
  grades: string[];
}

export function normalizeGradeCount(raw: unknown): number {
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_GRADE_COUNT;
  }
  return Math.max(1, Math.floor(parsed));
}

export function normalizeGrades(rawGrades: unknown, gradeCount: number): string[] {
  const safeCount = Math.max(1, gradeCount);
  const source = Array.isArray(rawGrades) ? rawGrades : [];
  return Array.from({ length: safeCount }, (_, index) => {
    const val = source[index];
    return val === undefined || val === null ? '' : String(val);
  });
}

export function normalizeDefaultGrades(raw: unknown, count = DEFAULT_GRADE_COUNT): string[] {
  const safeCount = Math.max(1, count);
  const source = Array.isArray(raw) ? raw : [];
  return Array.from({ length: safeCount }, (_, index) => {
    const val = source[index];
    return val === undefined || val === null ? '2' : String(val);
  });
}

export function normalizeStudents(raw: unknown, gradeCount: number): Student[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      let rawGrades: unknown = item.grades;
      if (!Array.isArray(rawGrades)) {
        if ('grade1' in item || 'grade2' in item) {
          rawGrades = [item.grade1, item.grade2];
        } else if ('grade' in item) {
          rawGrades = [item.grade];
        }
      }

      return {
        name: typeof item.name === 'string' ? item.name : String(item.name ?? ''),
        surname: typeof item.surname === 'string' ? item.surname : String(item.surname ?? ''),
        email: typeof item.email === 'string' ? item.email : String(item.email ?? ''),
        grades: normalizeGrades(rawGrades, gradeCount),
      };
    });
}
