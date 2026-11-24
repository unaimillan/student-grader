import { GridCellKind } from '@glideapps/glide-data-grid';
import { Student } from '../types/student';
import {
  applyStudentCellEdits,
  applyStudentPaste,
  formatGradesTsv,
  getGradeColumnLabels,
  getSpreadsheetColumnLabels,
  getStudentGridCell,
  getStudentGridColumns,
} from './spreadsheet';

describe('spreadsheet utilities', () => {
  const students: Student[] = [
    { name: 'Alice', surname: 'Smith', email: 'a.smith@example.edu', grades: ['2', '1.5'] },
    { name: 'Bob', surname: 'Jones', email: 'b.jones@example.edu', grades: ['1'] },
  ];

  it('builds column labels and grid columns for single and multiple grade columns', () => {
    expect(getGradeColumnLabels(1)).toEqual(['Grade']);
    expect(getGradeColumnLabels(3)).toEqual(['Grade 1', 'Grade 2', 'Grade 3']);
    expect(getSpreadsheetColumnLabels(2)).toEqual([
      'Name',
      'Surname',
      'Email',
      'Grade 1',
      'Grade 2',
    ]);

    expect(getStudentGridColumns(2, { email: 260 })).toEqual([
      { id: 'name', title: 'Name', width: 140 },
      { id: 'surname', title: 'Surname', width: 140 },
      { id: 'email', title: 'Email', width: 260 },
      { id: 'grade-0', title: 'Grade 1', width: 90 },
      { id: 'grade-1', title: 'Grade 2', width: 90 },
    ]);
  });

  it('builds Glide text cells with padded grades and optional readOnly flag', () => {
    expect(getStudentGridCell(students, [2, 0], 2, { readOnly: true })).toEqual({
      kind: GridCellKind.Text,
      allowOverlay: false,
      readonly: true,
      displayData: 'a.smith@example.edu',
      data: 'a.smith@example.edu',
    });

    expect(getStudentGridCell(students, [4, 1], 2)).toEqual({
      kind: GridCellKind.Text,
      allowOverlay: true,
      readonly: false,
      displayData: '',
      data: '',
    });
  });

  it('applies cell edits, skips empty rows, and expands grade count when needed', () => {
    const edited = applyStudentCellEdits(
      students,
      [
        {
          location: [5, 0],
          value: {
            kind: GridCellKind.Text,
            allowOverlay: true,
            displayData: '1.75',
            data: '1.75',
          },
        },
        {
          location: [0, 1],
          value: {
            kind: GridCellKind.Text,
            allowOverlay: true,
            displayData: '',
            data: '',
          },
        },
      ],
      2
    );

    expect(edited.detectedGradeCount).toBe(3);
    expect(edited.students).toEqual([
      {
        name: 'Alice',
        surname: 'Smith',
        email: 'a.smith@example.edu',
        grades: ['2', '1.5', '1.75'],
      },
      {
        name: '',
        surname: 'Jones',
        email: 'b.jones@example.edu',
        grades: ['1', '', ''],
      },
    ]);
  });

  it('handles multi-row TSV paste with automatic row expansion and grade column detection', () => {
    const pasted = applyStudentPaste(
      [],
      [0, 0],
      [
        ['Alice', 'Smith', 'a.smith@example.edu', '2', '1.75', '1.5'],
        ['Bob', 'Jones', 'b.jones@example.edu', '1', '2', ''],
        [''],
      ],
      1
    );

    expect(pasted.detectedGradeCount).toBe(3);
    expect(pasted.students).toEqual([
      {
        name: 'Alice',
        surname: 'Smith',
        email: 'a.smith@example.edu',
        grades: ['2', '1.75', '1.5'],
      },
      {
        name: 'Bob',
        surname: 'Jones',
        email: 'b.jones@example.edu',
        grades: ['1', '2', ''],
      },
    ]);
  });

  it('formats grades as TSV', () => {
    expect(formatGradesTsv(students, 2)).toBe(
      'a.smith@example.edu\t2\t1.5\nb.jones@example.edu\t1\t'
    );
  });
});
