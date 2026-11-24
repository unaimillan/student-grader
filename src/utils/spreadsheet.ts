import { EditListItem, GridCell, GridCellKind, GridColumn, Item } from '@glideapps/glide-data-grid';
import { normalizeGrades, Student } from '../types/student';

const DEFAULT_COLUMN_WIDTHS = {
  name: 140,
  surname: 140,
  email: 220,
  grade: 90,
} as const;

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

export function getStudentGridColumns(
  gradeCount: number,
  columnWidths: Record<string, number> = {}
): GridColumn[] {
  const gradeLabels = getGradeColumnLabels(gradeCount);
  const baseColumns: Array<{ id: string; title: string; defaultWidth: number }> = [
    { id: 'name', title: 'Name', defaultWidth: DEFAULT_COLUMN_WIDTHS.name },
    { id: 'surname', title: 'Surname', defaultWidth: DEFAULT_COLUMN_WIDTHS.surname },
    { id: 'email', title: 'Email', defaultWidth: DEFAULT_COLUMN_WIDTHS.email },
    ...gradeLabels.map((title, index) => ({
      id: `grade-${index}`,
      title,
      defaultWidth: DEFAULT_COLUMN_WIDTHS.grade,
    })),
  ];

  return baseColumns.map((col) => ({
    id: col.id,
    title: col.title,
    width: columnWidths[col.id] ?? col.defaultWidth,
  }));
}

export function createEmptyStudent(gradeCount: number): Student {
  const safeCount = Math.max(1, gradeCount);
  return {
    name: '',
    surname: '',
    email: '',
    grades: Array.from({ length: safeCount }, () => ''),
  };
}

export function getStudentCellValue(student: Student, col: number, gradeCount: number): string {
  if (col === 0) {
    return student.name;
  }
  if (col === 1) {
    return student.surname;
  }
  if (col === 2) {
    return student.email;
  }
  const gradeIndex = col - 3;
  if (gradeIndex >= 0 && gradeIndex < Math.max(1, gradeCount)) {
    return student.grades[gradeIndex] ?? '';
  }
  return '';
}

export function getStudentGridCell(
  students: Student[],
  cell: Item,
  gradeCount: number,
  options?: { readOnly?: boolean }
): GridCell {
  const [col, row] = cell;
  const student = students[row];
  const value = student ? getStudentCellValue(student, col, gradeCount) : '';
  const readOnly = options?.readOnly ?? false;

  return {
    kind: GridCellKind.Text,
    allowOverlay: !readOnly,
    readonly: readOnly,
    displayData: value,
    data: value,
  };
}

function isStudentEmpty(student: Student): boolean {
  return (
    student.name.trim() === '' &&
    student.surname.trim() === '' &&
    student.email.trim() === '' &&
    student.grades.every((grade) => grade.trim() === '')
  );
}

function setStudentCellValue(
  student: Student,
  col: number,
  value: string,
  gradeCount: number
): Student {
  const trimmed = value.trim();
  const nextGrades = normalizeGrades(student.grades, gradeCount);

  if (col === 0) {
    return { ...student, name: trimmed, grades: nextGrades };
  }
  if (col === 1) {
    return { ...student, surname: trimmed, grades: nextGrades };
  }
  if (col === 2) {
    return { ...student, email: trimmed, grades: nextGrades };
  }
  const gradeIndex = col - 3;
  if (gradeIndex >= 0) {
    nextGrades[gradeIndex] = trimmed;
    return { ...student, grades: nextGrades };
  }
  return { ...student, grades: nextGrades };
}

function finalizeStudents(
  rows: Student[],
  detectedGradeCount: number
): { students: Student[]; detectedGradeCount: number } {
  const nonEmptyStudents = rows
    .map((student) => ({
      name: student.name.trim(),
      surname: student.surname.trim(),
      email: student.email.trim(),
      grades: normalizeGrades(student.grades, detectedGradeCount).map((grade) => grade.trim()),
    }))
    .filter((student) => !isStudentEmpty(student));

  return {
    students: nonEmptyStudents,
    detectedGradeCount,
  };
}

export function applyStudentCellEdits(
  students: Student[],
  edits: readonly EditListItem[],
  currentGradeCount: number
): { students: Student[]; detectedGradeCount: number } {
  const safeGradeCount = Math.max(1, currentGradeCount);
  const maxCol = edits.reduce(
    (max, edit) => Math.max(max, edit.location[0]),
    3 + safeGradeCount - 1
  );
  const maxRow = edits.reduce((max, edit) => Math.max(max, edit.location[1]), students.length - 1);

  const detectedGradeCount = Math.max(1, safeGradeCount, maxCol - 2);
  const nextRows: Student[] = Array.from({ length: maxRow + 1 }, (_, index) => {
    const existing = students[index];
    return existing
      ? { ...existing, grades: normalizeGrades(existing.grades, detectedGradeCount) }
      : createEmptyStudent(detectedGradeCount);
  });

  edits.forEach((edit) => {
    if (edit.value.kind !== GridCellKind.Text) {
      return;
    }
    const [col, row] = edit.location;
    if (col < 0 || row < 0) {
      return;
    }
    nextRows[row] = setStudentCellValue(nextRows[row], col, edit.value.data, detectedGradeCount);
  });

  return finalizeStudents(nextRows, detectedGradeCount);
}

export function applyStudentPaste(
  students: Student[],
  target: Item,
  values: readonly (readonly string[])[],
  currentGradeCount: number
): { students: Student[]; detectedGradeCount: number } {
  const [targetCol, targetRow] = target;
  const safeGradeCount = Math.max(1, currentGradeCount);

  if (targetCol < 0 || targetRow < 0 || values.length === 0) {
    return finalizeStudents(students, safeGradeCount);
  }

  const trimmedValues = [...values];
  while (
    trimmedValues.length > 0 &&
    trimmedValues[trimmedValues.length - 1].every((cell) => cell.trim() === '')
  ) {
    trimmedValues.pop();
  }

  if (trimmedValues.length === 0) {
    return finalizeStudents(students, safeGradeCount);
  }

  const maxPastedColumns = trimmedValues.reduce((max, row) => {
    let lastNonEmpty = 0;
    row.forEach((cell, index) => {
      if (cell.trim() !== '') {
        lastNonEmpty = index + 1;
      }
    });
    return Math.max(max, lastNonEmpty);
  }, 0);

  const detectedGradeCount = Math.max(1, safeGradeCount, targetCol + maxPastedColumns - 3);
  const totalRows = Math.max(students.length, targetRow + trimmedValues.length);
  const nextRows: Student[] = Array.from({ length: totalRows }, (_, index) => {
    const existing = students[index];
    return existing
      ? { ...existing, grades: normalizeGrades(existing.grades, detectedGradeCount) }
      : createEmptyStudent(detectedGradeCount);
  });

  trimmedValues.forEach((pastedRow, rowOffset) => {
    const destRow = targetRow + rowOffset;
    pastedRow.forEach((cellValue, colOffset) => {
      const destCol = targetCol + colOffset;
      if (destCol < 3 + detectedGradeCount) {
        nextRows[destRow] = setStudentCellValue(
          nextRows[destRow],
          destCol,
          cellValue,
          detectedGradeCount
        );
      }
    });
  });

  return finalizeStudents(nextRows, detectedGradeCount);
}

export function formatGradesTsv(students: Student[], gradeCount: number): string {
  return students
    .map((student) => [student.email, ...normalizeGrades(student.grades, gradeCount)].join('\t'))
    .join('\n');
}
