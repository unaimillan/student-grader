import DataEditor, { EditListItem, GridColumn, Item } from '@glideapps/glide-data-grid';
import { Alert, Box, Button, Flex, Modal } from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InfoCircle } from 'tabler-icons-react';
import { Student } from '../../types/student';
import {
  applyStudentCellEdits,
  applyStudentPaste,
  createEmptyStudent,
  getStudentGridCell,
  getStudentGridColumns,
} from '../../utils/spreadsheet';

interface ImportStudentsModalProps {
  opened: boolean;
  onClose: () => void;
  students: Student[];
  gradeCount: number;
  onChange: (students: Student[], detectedGradeCount: number) => void;
}

const GRID_HEIGHT = 420;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 34;

export function ImportStudentsModal({
  opened,
  onClose,
  students,
  gradeCount,
  onChange,
}: ImportStudentsModalProps) {
  const [extraRows, setExtraRows] = useState(0);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!opened) {
      setExtraRows(0);
    }
  }, [opened]);

  const displayStudents = useMemo(() => {
    const minRows = Math.max(1, students.length + extraRows);
    if (students.length >= minRows) {
      return students;
    }
    return [
      ...students,
      ...Array.from({ length: minRows - students.length }, () => createEmptyStudent(gradeCount)),
    ];
  }, [students, extraRows, gradeCount]);

  const columns = useMemo(
    () => getStudentGridColumns(gradeCount, columnWidths),
    [gradeCount, columnWidths]
  );

  const getCellContent = useCallback(
    (cell: Item) => getStudentGridCell(displayStudents, cell, gradeCount),
    [displayStudents, gradeCount]
  );

  const handleCellsEdited = useCallback(
    (edits: readonly EditListItem[]) => {
      const parsed = applyStudentCellEdits(displayStudents, edits, gradeCount);
      onChange(parsed.students, parsed.detectedGradeCount);
      return true;
    },
    [displayStudents, gradeCount, onChange]
  );

  const handlePaste = useCallback(
    (target: Item, values: readonly (readonly string[])[]) => {
      const parsed = applyStudentPaste(displayStudents, target, values, gradeCount);
      setExtraRows(0);
      onChange(parsed.students, parsed.detectedGradeCount);
      return false;
    },
    [displayStudents, gradeCount, onChange]
  );

  const handleRowAppended = useCallback(() => {
    setExtraRows((prev) => prev + 1);
  }, []);

  const handleColumnResize = useCallback((column: GridColumn, newSize: number) => {
    if (!column.id) {
      return;
    }
    setColumnWidths((prev) => ({ ...prev, [column.id as string]: newSize }));
  }, []);

  return (
    <Modal opened={opened} onClose={onClose} title="Import students from spreadsheet" size="auto">
      <Flex direction="column" align="stretch" gap="md">
        <Alert style={{ alignSelf: 'center' }} title="Notice" color="blue" icon={<InfoCircle />}>
          Paste or edit rows here. Changes update your stored student list immediately.
        </Alert>
        <Box
          w="min(820px, 85vw)"
          h={GRID_HEIGHT}
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <DataEditor
            width="100%"
            height={GRID_HEIGHT}
            columns={columns}
            rows={displayStudents.length}
            headerHeight={HEADER_HEIGHT}
            rowHeight={ROW_HEIGHT}
            rowMarkers="number"
            getCellContent={getCellContent}
            getCellsForSelection
            onCellsEdited={handleCellsEdited}
            onPaste={handlePaste}
            onRowAppended={handleRowAppended}
            trailingRowOptions={{ hint: 'Add student...', sticky: false }}
            onColumnResize={handleColumnResize}
            smoothScrollX
            smoothScrollY
          />
        </Box>
        <Flex justify="flex-end">
          <Button onClick={onClose}>Close</Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
