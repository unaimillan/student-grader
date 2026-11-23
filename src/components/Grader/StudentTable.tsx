import { Center, Container, Text } from '@mantine/core';
import Spreadsheet from 'react-spreadsheet';
import { Student } from '../../types/student';
import { getSpreadsheetColumnLabels, toMatrix } from '../../utils/spreadsheet';

interface StudentTableProps {
  students: Student[];
  gradeCount: number;
}

export function StudentTable({ students, gradeCount }: StudentTableProps) {
  if (students.length === 0) {
    return (
      <Center mt="lg">
        <Text c="dimmed">No matching students to display.</Text>
      </Center>
    );
  }

  return (
    <Center mt="lg">
      <Container>
        <Spreadsheet
          data={toMatrix(students, gradeCount, { readOnly: true })}
          columnLabels={getSpreadsheetColumnLabels(gradeCount)}
        />
      </Container>
    </Center>
  );
}
