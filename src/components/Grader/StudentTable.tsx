import DataEditor, { GridColumn, Item } from '@glideapps/glide-data-grid';
import { Box, Center, Container, Text } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { Student } from '../../types/student';
import { getStudentGridCell, getStudentGridColumns } from '../../utils/spreadsheet';

interface StudentTableProps {
  students: Student[];
  gradeCount: number;
}

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 34;
const MAX_TABLE_HEIGHT = 548;

export function StudentTable({ students, gradeCount }: StudentTableProps) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const columns = useMemo(
    () => getStudentGridColumns(gradeCount, columnWidths),
    [gradeCount, columnWidths]
  );

  const getCellContent = useCallback(
    (cell: Item) => getStudentGridCell(students, cell, gradeCount, { readOnly: true }),
    [students, gradeCount]
  );

  const handleColumnResize = useCallback((column: GridColumn, newSize: number) => {
    if (!column.id) {
      return;
    }
    setColumnWidths((prev) => ({ ...prev, [column.id as string]: newSize }));
  }, []);

  if (students.length === 0) {
    return (
      <Center mt="lg">
        <Text c="dimmed">No matching students to display.</Text>
      </Center>
    );
  }

  const tableHeight = Math.min(MAX_TABLE_HEIGHT, HEADER_HEIGHT + students.length * ROW_HEIGHT + 2);

  return (
    <Center mt="lg">
      <Container w="100%">
        <Box
          w="100%"
          h={tableHeight}
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <DataEditor
            width="100%"
            height={tableHeight}
            columns={columns}
            rows={students.length}
            headerHeight={HEADER_HEIGHT}
            rowHeight={ROW_HEIGHT}
            rowMarkers="number"
            getCellContent={getCellContent}
            getCellsForSelection
            onColumnResize={handleColumnResize}
            smoothScrollX
            smoothScrollY
          />
        </Box>
      </Container>
    </Center>
  );
}
