import Fuse from 'fuse.js';
import { Student } from '../types/student';
import { levenshtein } from './distance';

export function createStudentSearchIndex(students: Student[]): Fuse<Student> {
  return new Fuse(students, {
    keys: ['name', 'surname', 'email'],
    threshold: 0.3,
  });
}

export function filterStudents(
  students: Student[],
  searchQuery: string,
  limit: number,
  fuseIndex?: Fuse<Student>
): Student[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    return students;
  }

  const tokens = trimmed.split(/\s+/);

  if (tokens.length >= 2) {
    const first = tokens[0].toLowerCase();
    const second = tokens[1].toLowerCase();

    return students
      .filter((student) => {
        const surname = student.surname.toLowerCase();
        const name = student.name.toLowerCase();
        return (
          (surname.startsWith(first) && name.startsWith(second)) ||
          (name.startsWith(first) && surname.startsWith(second))
        );
      })
      .slice(0, limit);
  }

  const query = tokens[0];
  const lowerQuery = query.toLowerCase();

  const exactEmailMatches = students.filter(
    (student) => student.email.split('@')[0].toLowerCase() === lowerQuery
  );
  if (exactEmailMatches.length > 0) {
    return exactEmailMatches.slice(0, limit);
  }

  const fuse = fuseIndex ?? createStudentSearchIndex(students);
  const fusedResult = fuse.search(query, { limit }).map((entry) => entry.item);

  return [...fusedResult]
    .map((item) => ({
      dist: levenshtein(item.email.split('@')[0].toLowerCase(), lowerQuery),
      item,
    }))
    .sort((a, b) => a.dist - b.dist)
    .map((entry) => entry.item);
}
