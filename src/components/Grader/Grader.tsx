/* eslint-disable max-len */
import { Title, Text, Button, Container, NumberInput, Center, Modal, Space, Flex, Stack, TextInput, Alert } from '@mantine/core';
import { getHotkeyHandler, useDebouncedState, useDisclosure, useListState, useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef, useState } from 'react';
import Spreadsheet, { Matrix } from 'react-spreadsheet';
import { InfoCircle } from 'tabler-icons-react';
import { modals } from '@mantine/modals';
import Fuse from 'fuse.js';
import { levenshtein } from '../../utils/distance';

function getFilteredOptions(studentList: IStudent[], searchQuery: string, limit: number): IStudent[] {
  const subqueries = searchQuery.split(' ');

  if (subqueries.length > 1) {
    const [surname, name, ...other] = subqueries;
    // console.log('C', subqueries, surname, name)

    const result = studentList
      .filter(st => st.surname.toLowerCase().startsWith(surname.toLowerCase()) && st.name.toLowerCase().startsWith(name.toLowerCase()))
      .slice(0, limit)

    return result.map(v => v)
  } else {
    const fuse = new Fuse(studentList, { keys: ['name', 'surname', 'email'], threshold: 0.3 });
    const fusedResult = fuse.search(searchQuery, { limit }).map(v => v.item);

    const result: { dist: number, item: IStudent }[] = fusedResult
      .map(v => ({ dist: levenshtein(v.email.split('@')[0], searchQuery), item: v }))
      .toSorted((a, b) => a.dist - b.dist);

    if (result.length > 0 && result[0].dist === 0) {
      return [result[0].item];
    }
    return result.map(v => v.item);
  }

}

const toMatrix = (students: IStudent[]): Matrix<{ value: string }> => students.map(s => [
  { value: s.name }, { value: s.surname }, { value: s.email }, { value: s.grade1.toString() }, { value: s.grade2.toString() }]);

const toReadonlyMatrix = (students: IStudent[]): Matrix<{ value: string }> => students.map(s => [
  { value: s.name, readOnly: true },
  { value: s.surname, readOnly: true },
  { value: s.email, readOnly: true },
  { value: s.grade1.toString(), readOnly: true },
  { value: s.grade2.toString(), readOnly: true }
]);

const fromMatrix = (data: Matrix<{ value: string }>): IStudent[] => data.map(v => (
  { name: v[0]?.value || '', surname: v[1]?.value || '', email: v[2]?.value || '', grade1: v[3]?.value || '', grade2: v[4]?.value || '' }));

export function Grader() {
  const rawStudents: IStudent[] = [
    { name: '', surname: '', email: '', grade1: '', grade2: '' },
  ];

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [searchValue, setSearchValue] = useDebouncedState('', 300);
  const [defaultGrade1, setDefaultGrade1] = useState<string>('2');
  const [defaultGrade2, setDefaultGrade2] = useState<string>('2');
  const [grade1, setGrade1] = useState<string>(defaultGrade1);
  const [grade2, setGrade2] = useState<string>(defaultGrade2);

  // TODO: Add local
  // const [storedList, setStoredList] = useLocalStorage<IStudent[]>({
  //   key: 'student-grader-storedList',
  //   defaultValue: []
  // });
  const [studentList, studentListHandler] = useListState<IStudent>();
  const filteredStudentList = searchValue ? getFilteredOptions(studentList, searchValue, 15) : studentList;

  const [updatedStudents, updatedStudentsHandler] = useListState<IStudent>([]);

  const textInputRef = useRef<HTMLInputElement>(null);
  const grade1Ref = useRef<HTMLInputElement>(null);
  const grade2Ref = useRef<HTMLInputElement>(null);

  // useEffect(() => {
  //   // textInputRef.current?.select()
  //   console.log(updatedStudents)
  // }, [modalOpened])

  const onComboboxSubmit = () => {
    if (filteredStudentList.length !== 1) {
      notifications.show({ message: 'Exactly one student should be selected', color: 'red' });
      return;
    }

    // notifications.show({ title: "Student selected", message: `${student.name} ${student.surname}` });
    // setSelectedStudent(student);
    grade1Ref.current?.select();
  };

  const onResultSubmit = () => {
    if (filteredStudentList.length !== 1) {
      notifications.show({ message: 'Exactly one student should be selected', color: 'red' });
      textInputRef.current?.select();
      return;
    }

    const student = filteredStudentList.at(0)!;
    const index = studentList.findIndex(v => v.email === student.email);
    studentListHandler.setItemProp(index, 'grade1', grade1);
    studentListHandler.setItemProp(index, 'grade2', grade2);

    const backupIndex = updatedStudents.findIndex(v => v.email === student.email);
    if (backupIndex - 1) {
      updatedStudentsHandler.insert(0, { ...student, grade1, grade2 });
    } else {
      updatedStudentsHandler.setItemProp(backupIndex, 'grade1', grade1);
      updatedStudentsHandler.setItemProp(backupIndex, 'grade2', grade2);
    }

    textInputRef.current?.select();
    setGrade1(defaultGrade1);
    setGrade2(defaultGrade2);
  };

  const openDeleteGradeModal = () => modals.openConfirmModal({
    title: 'Clear grades column',
    children: (
      <Text>
        Are you sure you want to delete all the student grades from the table?
        <Space />
        This action is destructive and non-reversable!
      </Text>
    ),
    labels: { confirm: 'Clear all grades', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: () => {
      studentListHandler.apply(student => ({ ...student, grade: '' }));
    },
  });

  return (
    <>
      <Modal opened={modalOpened} onClose={closeModal} title="Copy students from the spreadsheet" size="auto">
        <Container>
          <Flex direction="column" align="end" gap="md">
            <Alert style={{ alignSelf: 'center' }} title="Alert" color="red" icon={<InfoCircle />}>Any changes here will override all your data!</Alert>
            <Spreadsheet
              data={toReadonlyMatrix(studentList)}
              columnLabels={['Name', 'Surname', 'Email', 'Grade1', 'Grade2']}
              rowLabels={['1']}
              onChange={data => { studentListHandler.setState(fromMatrix(data)); }}
            />
            <Button onClick={closeModal}>Close</Button>
          </Flex>
        </Container>
      </Modal>

      <Container pt={60}>
        <Title ta="center">
          Student Grade Importer
        </Title>
        <Container mt="md">
          <Stack gap="xs" align="center">
            <Text>Copy students from spreadsheet and start editing</Text>
            <Button onClick={openModal}>Import Students</Button>
          </Stack>
        </Container>

        <Container size="xs" mt="lg">
          <Stack>
            <TextInput
              label="Start entering student name, surname, or email"
              tabIndex={3}
              defaultValue={searchValue}
              onChange={(event) => setSearchValue(event.currentTarget.value)}
              onKeyDown={getHotkeyHandler([['enter', onComboboxSubmit], ['escape', () => {
                if (textInputRef.current) { textInputRef.current.value = ''; }
                setSearchValue('');
              }]])}
              ref={textInputRef}
            />
            <Flex align="end" justify="space-between" gap="xs">
              <NumberInput
                label="Grade 1"
                style={{ flexGrow: 1 }}
                tabIndex={4}
                ref={grade1Ref}
                value={grade1}
                onChange={v => { setGrade1(v.toString()); }}
                min={0}
                max={2}
                step={0.25}
                onKeyDown={getHotkeyHandler([['enter', () => grade2Ref.current?.select()]])}
              />
              <Button onClick={() => { setDefaultGrade1(grade1); notifications.show({ message: `Default changed to ${grade1}` }); }}>Set default</Button>
            </Flex>
            <Flex align="end" justify="space-between" gap="xs">
              <NumberInput
                label="Grade 2"
                style={{ flexGrow: 1 }}
                tabIndex={5}
                ref={grade2Ref}
                value={grade2}
                onChange={v => { setGrade2(v.toString()); }}
                min={0}
                max={2}
                step={0.25}
                onKeyDown={getHotkeyHandler([['enter', onResultSubmit]])}
              />
              <Button onClick={() => { setDefaultGrade2(grade2); notifications.show({ message: `Default changed to ${grade2}` }); }}>Set default</Button>
            </Flex>
            <Flex justify="center" gap="md">
              <Button onClick={() => navigator.clipboard.writeText(studentList.map(v => `${v.email}\t${v.grade1}\t${v.grade2}`).join('\n'))}>Copy to clipboard</Button>
              <Button onClick={openDeleteGradeModal}>Clear grades</Button>
            </Flex>
            <Flex justify="center" gap="xs">
              <Text>{studentList.length} students loaded</Text>
              <Text>{filteredStudentList.length} displayed</Text>
            </Flex>
            <Text style={{ alignSelf: 'center' }}>{studentList.filter(v => v.grade1 !== '' || v.grade2 !== '').length} students graded</Text>
          </Stack>
        </Container>

        <Center mt="lg">
          <Container>
            <Spreadsheet
              data={toMatrix(filteredStudentList)}
              columnLabels={['Name', 'Surname', 'Email', 'Grade1', 'Grade2']}
            />
          </Container>
        </Center>
      </Container>
    </>
  );
}
