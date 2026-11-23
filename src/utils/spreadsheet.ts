import { Matrix } from 'react-spreadsheet';
import { normalizeGrades, Student } from '../types/student';

export function getGradeColumnLabels(gradeCount: number): string[] {
  const safeCount = Math.max(1, gradeCount);
  if (safeCount === 1) {
    return ['Grade'];
  }
  return Array.from(Array(safeCount).keys(), (index) => `Grade ${index + 1}`);
}

export function getSpreadsheetColumnLabels(gradeCount: number): string[] {
  return ['Name', 'Surname', 'Email', ...getGradeColumnLabels(gradeCount)];
}

export function toMatrix(
  students: Student[],
  gradeCount: number,
  options?: { readOnly?: boolean }
): Matrix<{ value: string; readOnly?: boolean }> {
  const readOnly = options?.readOnly ?? false;
  return students.map((student) => [
    { value: student.name, readOnly },
    { value: student.surname, readOnly },
    { value: student.email, readOnly },
    ...normalizeGrades(student.grades, gradeCount).map((grade) => ({
      value: grade,
      readOnly,
    })),
  ]);
}

export function fromMatrix(
  data: Matrix<{ value: string }>,
  currentGradeCount: number
): { students: Student[]; detectedGradeCount: number } {
  const nonEmptyRows = data.filter((row) => row.some((cell) => (cell?.value ?? '').trim() !== ''));

  const maxRowColumns = nonEmptyRows.reduce((max, row) => Math.max(max, row.length), 0);
  const detectedGradeCount = Math.max(1, currentGradeCount, maxRowColumns - 3);

  const students: Student[] = nonEmptyRows.map((row) => ({
    name: (row[0]?.value ?? '').trim(),
    surname: (row[1]?.value ?? '').trim(),
    email: (row[2]?.value ?? '').trim(),
    grades: Array.from(Array(detectedGradeCount).keys(), (index) =>
      (row[3 + index]?.value ?? '').trim()
    ),
  }));

  return { students, detectedGradeCount };
}

export function formatGradesTsv(students: Student[], gradeCount: number): string {
  return students
    .map((student) => [student.email, ...normalizeGrades(student.grades, gradeCount)].join('\t'))
    .join('\n');
}
