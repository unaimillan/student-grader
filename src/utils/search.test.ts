import { Student } from '../types/student';
import { filterStudents } from './search';

const sampleStudents: Student[] = [
  { name: 'Alice', surname: 'Smith', email: 'a.smith@example.edu', grades: ['', ''] },
  { name: 'Bob', surname: 'Johnson', email: 'b.johnson@example.edu', grades: ['2', '1.5'] },
  { name: 'Charlie', surname: 'Brown', email: 'c.brown@example.edu', grades: ['', ''] },
  { name: 'Diana', surname: 'Smithson', email: 'd.smithson@example.edu', grades: ['', ''] },
];

describe('filterStudents', () => {
  it('returns all students when query is empty or whitespace', () => {
    expect(filterStudents(sampleStudents, '', 15)).toEqual(sampleStudents);
    expect(filterStudents(sampleStudents, '   ', 15)).toEqual(sampleStudents);
  });

  it('matches exact email local-part even when limit is 1', () => {
    const manyStudents: Student[] = [
      ...Array.from(Array(20).keys(), (index) => ({
        name: `User${index}`,
        surname: 'Test',
        email: `u.test${index}@example.edu`,
        grades: ['', ''],
      })),
      { name: 'Target', surname: 'Test', email: 'target@example.edu', grades: ['', ''] },
    ];

    const result = filterStudents(manyStudents, 'target', 5);
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('target@example.edu');
  });

  it('matches multi-word queries in both surname-name and name-surname order', () => {
    const surnameFirst = filterStudents(sampleStudents, 'Smith Alice', 15);
    expect(surnameFirst).toHaveLength(1);
    expect(surnameFirst[0].email).toBe('a.smith@example.edu');

    const nameFirst = filterStudents(sampleStudents, 'alice smi', 15);
    expect(nameFirst).toHaveLength(1);
    expect(nameFirst[0].email).toBe('a.smith@example.edu');
  });

  it('ignores extra spaces in multi-word queries', () => {
    const result = filterStudents(sampleStudents, '  Bob   Johnson  ', 15);
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('b.johnson@example.edu');
  });

  it('returns empty array when no student matches', () => {
    expect(filterStudents(sampleStudents, 'zzzzqqqq', 15)).toEqual([]);
  });
});
