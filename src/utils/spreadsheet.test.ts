import { Student } from '../types/student';
import {
  formatGradesTsv,
  fromMatrix,
  getGradeColumnLabels,
  getSpreadsheetColumnLabels,
  toMatrix,
} from './spreadsheet';

describe('spreadsheet utilities', () => {
  const students: Student[] = [
    { name: 'Alice', surname: 'Smith', email: 'a.smith@example.edu', grades: ['2', '1.5'] },
    { name: 'Bob', surname: 'Jones', email: 'b.jones@example.edu', grades: ['1'] },
  ];

  it('builds column labels for single and multiple grade columns', () => {
    expect(getGradeColumnLabels(1)).toEqual(['Grade']);
    expect(getGradeColumnLabels(3)).toEqual(['Grade 1', 'Grade 2', 'Grade 3']);
    expect(getSpreadsheetColumnLabels(2)).toEqual([
      'Name',
      'Surname',
      'Email',
      'Grade 1',
      'Grade 2',
    ]);
  });

  it('serializes students to matrix with padded grades and optional readOnly flag', () => {
    const matrix = toMatrix(students, 2, { readOnly: true });
    expect(matrix).toEqual([
      [
        { value: 'Alice', readOnly: true },
        { value: 'Smith', readOnly: true },
        { value: 'a.smith@example.edu', readOnly: true },
        { value: '2', readOnly: true },
        { value: '1.5', readOnly: true },
      ],
      [
        { value: 'Bob', readOnly: true },
        { value: 'Jones', readOnly: true },
        { value: 'b.jones@example.edu', readOnly: true },
        { value: '1', readOnly: true },
        { value: '', readOnly: true },
      ],
    ]);
  });

  it('parses matrix rows, skips empty rows, and detects extra grade columns', () => {
    const parsed = fromMatrix(
      [
        [
          { value: 'Alice' },
          { value: 'Smith' },
          { value: 'a.smith@example.edu' },
          { value: '2' },
          { value: '1.75' },
          { value: '1.5' },
        ],
        [{ value: '' }, { value: '' }, { value: '' }],
      ],
      2
    );

    expect(parsed.detectedGradeCount).toBe(3);
    expect(parsed.students).toEqual([
      {
        name: 'Alice',
        surname: 'Smith',
        email: 'a.smith@example.edu',
        grades: ['2', '1.75', '1.5'],
      },
    ]);
  });

  it('formats grades as TSV', () => {
    expect(formatGradesTsv(students, 2)).toBe(
      'a.smith@example.edu\t2\t1.5\nb.jones@example.edu\t1\t'
    );
  });
});
