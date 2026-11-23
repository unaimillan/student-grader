import { Alert, Button, Container, Flex, Modal } from '@mantine/core';
import Spreadsheet, { Matrix } from 'react-spreadsheet';
import { InfoCircle } from 'tabler-icons-react';
import { Student } from '../../types/student';
import { fromMatrix, getSpreadsheetColumnLabels, toMatrix } from '../../utils/spreadsheet';

interface ImportStudentsModalProps {
  opened: boolean;
  onClose: () => void;
  students: Student[];
  gradeCount: number;
  onChange: (students: Student[], detectedGradeCount: number) => void;
}

export function ImportStudentsModal({
  opened,
  onClose,
  students,
  gradeCount,
  onChange,
}: ImportStudentsModalProps) {
  const emptyRow: Student = {
    name: '',
    surname: '',
    email: '',
    grades: Array.from({ length: gradeCount }, () => ''),
  };
  const displayStudents = students.length > 0 ? students : [emptyRow];
  const rowLabels = Array.from(Array(displayStudents.length).keys(), (index) => String(index + 1));

  const handleSpreadsheetChange = (data: Matrix<{ value: string }>) => {
    const parsed = fromMatrix(data, gradeCount);
    onChange(parsed.students, parsed.detectedGradeCount);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Import students from spreadsheet" size="auto">
      <Container>
        <Flex direction="column" align="end" gap="md">
          <Alert style={{ alignSelf: 'center' }} title="Notice" color="blue" icon={<InfoCircle />}>
            Paste or edit rows here. Changes update your stored student list immediately.
          </Alert>
          <Spreadsheet
            data={toMatrix(displayStudents, gradeCount)}
            columnLabels={getSpreadsheetColumnLabels(gradeCount)}
            rowLabels={rowLabels}
            onChange={handleSpreadsheetChange}
          />
          <Button onClick={onClose}>Close</Button>
        </Flex>
      </Container>
    </Modal>
  );
}
