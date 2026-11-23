import { Button, Container, Flex, NumberInput, Stack, Text, TextInput, Title } from '@mantine/core';
import {
  getHotkeyHandler,
  useDebouncedValue,
  useDisclosure,
  useLocalStorage,
} from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings } from 'tabler-icons-react';
import {
  DEFAULT_GRADE_COUNT,
  normalizeDefaultGrades,
  normalizeGradeCount,
  normalizeGrades,
  normalizeStudents,
  Student,
} from '../../types/student';
import { createStudentSearchIndex, filterStudents } from '../../utils/search';
import { formatGradesTsv, getGradeColumnLabels } from '../../utils/spreadsheet';
import { ImportStudentsModal } from './ImportStudentsModal';
import { SettingsModal } from './SettingsModal';
import { StudentTable } from './StudentTable';

const STORAGE_KEYS = {
  students: 'student-grader-students',
  gradeCount: 'student-grader-grade-count',
  defaultGrades: 'student-grader-default-grades',
} as const;

const SEARCH_RESULT_LIMIT = 15;

export function Grader() {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  const [rawGradeCount, setRawGradeCount] = useLocalStorage<number>({
    key: STORAGE_KEYS.gradeCount,
    defaultValue: DEFAULT_GRADE_COUNT,
  });
  const gradeCount = useMemo(() => normalizeGradeCount(rawGradeCount), [rawGradeCount]);

  const [rawDefaultGrades, setDefaultGrades] = useLocalStorage<string[]>({
    key: STORAGE_KEYS.defaultGrades,
    defaultValue: ['2'],
  });
  const defaultGrades = useMemo(
    () => normalizeDefaultGrades(rawDefaultGrades, gradeCount),
    [rawDefaultGrades, gradeCount]
  );

  const [rawStudents, setStudents] = useLocalStorage<Student[]>({
    key: STORAGE_KEYS.students,
    defaultValue: [],
  });
  const studentList = useMemo(
    () => normalizeStudents(rawStudents, gradeCount),
    [rawStudents, gradeCount]
  );

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchInput, 200);
  const [grades, setGrades] = useState<string[]>(defaultGrades);

  useEffect(() => {
    setGrades((prev) =>
      Array.from(Array(gradeCount).keys(), (index) => prev[index] ?? defaultGrades[index])
    );
  }, [gradeCount, defaultGrades]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const gradeInputRefs = useRef<(HTMLDivElement | null)[]>([]);

  const focusAndSelectInput = (el: HTMLElement | null) => {
    if (!el) {
      return;
    }
    const input = el instanceof HTMLInputElement ? el : el.querySelector('input');
    input?.focus();
    input?.select();
  };

  const fuseIndex = useMemo(() => createStudentSearchIndex(studentList), [studentList]);

  const filteredStudentList = useMemo(
    () => filterStudents(studentList, debouncedSearch, SEARCH_RESULT_LIMIT, fuseIndex),
    [studentList, debouncedSearch, fuseIndex]
  );

  const getImmediateMatches = () =>
    filterStudents(studentList, searchInput, SEARCH_RESULT_LIMIT, fuseIndex);

  const gradeLabels = useMemo(() => getGradeColumnLabels(gradeCount), [gradeCount]);

  const onSearchSubmit = () => {
    const matches = getImmediateMatches();
    if (matches.length !== 1) {
      notifications.show({ message: 'Exactly one student should be selected', color: 'red' });
      return;
    }
    focusAndSelectInput(gradeInputRefs.current[0] ?? null);
  };

  const onResultSubmit = () => {
    const matches = getImmediateMatches();
    if (matches.length !== 1) {
      notifications.show({ message: 'Exactly one student should be selected', color: 'red' });
      searchInputRef.current?.select();
      return;
    }

    const selectedStudent = matches[0];
    const targetIndex = studentList.indexOf(selectedStudent);
    if (targetIndex === -1) {
      return;
    }

    const nextGrades = normalizeGrades(grades, gradeCount);
    setStudents(
      studentList.map((student, index) =>
        index === targetIndex ? { ...student, grades: nextGrades } : student
      )
    );

    searchInputRef.current?.select();
    setGrades(defaultGrades);
  };

  const handleImportChange = (imported: Student[], detectedGradeCount: number) => {
    if (detectedGradeCount > gradeCount) {
      setRawGradeCount(detectedGradeCount);
      setDefaultGrades(normalizeDefaultGrades(rawDefaultGrades, detectedGradeCount));
    }
    setStudents(imported);
  };

  const handleGradeCountChange = (nextGradeCount: number) => {
    setRawGradeCount(normalizeGradeCount(nextGradeCount));
  };

  const handleCopyToClipboard = async () => {
    const text = formatGradesTsv(studentList, gradeCount);
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(text);
      notifications.show({ message: 'Grades copied to clipboard', color: 'green' });
    } catch {
      notifications.show({ message: 'Failed to copy grades to clipboard', color: 'red' });
    }
  };

  const openDeleteGradeModal = () =>
    modals.openConfirmModal({
      title: 'Clear grades column',
      children: (
        <Stack gap="xs">
          <Text>Are you sure you want to delete all the student grades from the table?</Text>
          <Text>This action is destructive and non-reversible!</Text>
        </Stack>
      ),
      labels: { confirm: 'Clear all grades', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const emptyGrades = Array.from({ length: gradeCount }, () => '');
        setStudents(studentList.map((student) => ({ ...student, grades: emptyGrades })));
      },
    });

  const gradedCount = studentList.filter((student) =>
    student.grades.some((gradeValue) => gradeValue !== '')
  ).length;

  return (
    <>
      <ImportStudentsModal
        opened={modalOpened}
        onClose={closeModal}
        students={studentList}
        gradeCount={gradeCount}
        onChange={handleImportChange}
      />

      <SettingsModal
        opened={settingsOpened}
        onClose={closeSettings}
        gradeCount={gradeCount}
        onGradeCountChange={handleGradeCountChange}
      />

      <Container pt={60} pb={60}>
        <Title ta="center">Student Grader</Title>
        <Container mt="md">
          <Stack gap="xs" align="center">
            <Text>Copy students from spreadsheet and start grading</Text>
            <Flex gap="xs" wrap="wrap" justify="center">
              <Button onClick={openModal}>Import Students</Button>
              <Button variant="light" leftSection={<Settings size={16} />} onClick={openSettings}>
                Settings
              </Button>
            </Flex>
          </Stack>
        </Container>

        <Container size="xs" mt="lg">
          <Stack>
            <TextInput
              label="Start entering student name, surname, or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              onKeyDown={getHotkeyHandler([
                ['enter', onSearchSubmit],
                ['escape', () => setSearchInput('')],
              ])}
              ref={searchInputRef}
            />

            {gradeLabels.map((label, index) => {
              const isLast = index === gradeLabels.length - 1;
              const currentValue = grades[index] ?? defaultGrades[index] ?? '';
              const handleEnter = isLast
                ? onResultSubmit
                : () => focusAndSelectInput(gradeInputRefs.current[index + 1] ?? null);

              return (
                <Flex key={label} align="end" justify="space-between" gap="xs">
                  <NumberInput
                    label={label}
                    style={{ flexGrow: 1 }}
                    ref={(el) => {
                      gradeInputRefs.current[index] = el;
                    }}
                    value={currentValue}
                    onChange={(value) => {
                      const nextValue = value.toString();
                      setGrades((prev) =>
                        Array.from(Array(gradeCount).keys(), (idx) =>
                          idx === index ? nextValue : prev[idx] ?? ''
                        )
                      );
                    }}
                    min={0}
                    max={2}
                    step={0.25}
                    onKeyDown={getHotkeyHandler([['enter', handleEnter]])}
                  />
                  <Button
                    onClick={() => {
                      setDefaultGrades(
                        defaultGrades.map((item, idx) => (idx === index ? currentValue : item))
                      );
                      notifications.show({
                        message: `${label} default changed to ${currentValue}`,
                      });
                    }}
                  >
                    Set default
                  </Button>
                </Flex>
              );
            })}

            <Flex justify="center" gap="md">
              <Button onClick={handleCopyToClipboard}>Copy to clipboard</Button>
              <Button color="red" variant="outline" onClick={openDeleteGradeModal}>
                Clear grades
              </Button>
            </Flex>

            <Flex justify="center" gap="xs">
              <Text>{studentList.length} students loaded</Text>
              <Text>{filteredStudentList.length} displayed</Text>
            </Flex>
            <Text style={{ alignSelf: 'center' }}>{gradedCount} students graded</Text>
          </Stack>
        </Container>

        <StudentTable students={filteredStudentList} gradeCount={gradeCount} />
      </Container>
    </>
  );
}
