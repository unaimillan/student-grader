import { Title, Text, Button, Container, NumberInput, Center, Modal, Space, Flex, Stack, TextInput, Alert } from '@mantine/core';
import { getHotkeyHandler, useDebouncedState, useDisclosure, useListState } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';
import Spreadsheet, { Matrix } from 'react-spreadsheet';
import { InfoCircle } from 'tabler-icons-react';
import Fuse from 'fuse.js';
import { modals } from '@mantine/modals';


function getFilteredOptions(data: IStudent[], searchQuery: string, limit: number) {
  const result: IStudent[] = [];
  const check = (str: string) => str.toLowerCase().includes(searchQuery.trim().toLowerCase())

  for (let i = 0; i < data.length; i += 1) {
    if (result.length === limit) {
      break;
    }

    const { name, surname, email } = data[i]

    if (check(name) || check(surname) || check(email) || check(name + " " + surname)) {
      result.push(data[i]);
    }
  }

  return result;
}

const toMatrix = (students: IStudent[]): Matrix<{ value: string }> => {
  return students.map(s => [{ value: s.name }, { value: s.surname }, { value: s.email }, { value: s.grade.toString() }])
}

const toReadonlyMatrix = (students: IStudent[]): Matrix<{ value: string }> => {
  return students.map(s => [{ value: s.name, readOnly: true }, { value: s.surname, readOnly: true }, { value: s.email, readOnly: true }, { value: s.grade.toString(), readOnly: true }])
}

const fromMatrix = (data: Matrix<{ value: string }>): IStudent[] => {
  return data.map(v => { return { name: v[0]?.value || "", surname: v[1]?.value || "", email: v[2]?.value || "", grade: v[3]?.value || "" } })
}

export function Grader() {
  const rawStudents: IStudent[] = [
    { name: "", surname: "", email: "", grade: "" }
  ]

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [searchValue, setSearchValue] = useDebouncedState('', 300);
  const [defaultGrade, setDefaultGrade] = useState<string>("2");
  const [grade, setGrade] = useState<string>(defaultGrade);

  const [studentList, studentListHandler] = useListState<IStudent>();
  const fuse = new Fuse(studentList, { keys: ["name", "surname", "email"], threshold: 0.3 })
  const filteredStudentList = searchValue ? fuse.search(searchValue, { limit: 15 }).map(v => v.item) : studentList;


  const [updatedStudents, updatedStudentsHandler] = useListState<IStudent>([]);

  const textInputRef = useRef<HTMLInputElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // useEffect(() => {
  //   // textInputRef.current?.select()
  //   console.log(updatedStudents)
  // }, [modalOpened])

  const onComboboxSubmit = () => {
    if (filteredStudentList.length != 1) {
      notifications.show({ message: "Exactly one student should be selected", color: "red" })
      return;
    }

    // notifications.show({ title: "Student selected", message: `${student.name} ${student.surname}` });
    // setSelectedStudent(student);
    numberInputRef.current?.select();
  }

  const onResultSubmit = () => {
    if (filteredStudentList.length != 1) {
      notifications.show({ message: "Exactly one student should be selected", color: "red" });
      textInputRef.current?.select();
      return;
    }

    const student = filteredStudentList.at(0)!
    const index = studentList.findIndex(v => v.email == student.email)
    studentListHandler.setItemProp(index, "grade", grade)

    const backupIndex = updatedStudents.findIndex(v => v.email == student.email)
    if (backupIndex - 1) {
      updatedStudentsHandler.insert(0, { ...student, grade: grade })
    } else {
      updatedStudentsHandler.setItemProp(backupIndex, "grade", grade)
    }

    textInputRef.current?.select()
    setGrade(defaultGrade)
  }

  const openDeleteGradeModal = () => modals.openConfirmModal({
    title: "Clear grades column",
    children: (
      <Text>
        Are you sure you want to delete all the student grades from the table?
        <Space />
        This action is destructive and non-reversable!
      </Text>
    ),
    labels: { confirm: "Clear all grades", cancel: "Cancel" },
    confirmProps: { color: "red" },
    onConfirm: () => {
      studentListHandler.apply(student => ({ ...student, grade: "" }))
    },
  })

  return (
    <>
      <Modal opened={modalOpened} onClose={closeModal} title="Copy students from the spreadsheet" size="auto">
        <Container>
          <Flex direction="column" align="end" gap="md">
            <Alert style={{ alignSelf: "center" }} title="Alert" color="red" icon={<InfoCircle />}>Any changes here will override all your data!</Alert>
            <Spreadsheet
              data={toReadonlyMatrix(studentList)}
              columnLabels={["Name", "Surname", "Email", "Grade"]}
              rowLabels={["1"]}
              onChange={data => { studentListHandler.setState(fromMatrix(data)) }}
            />
            <Button onClick={closeModal}>Close</Button>
          </Flex>
        </Container>
      </Modal>

      <Container pt={60}>
        <Title ta="center">
          Student Grade Importer
        </Title>
        <Container mt={'md'}>
          <Stack gap={'xs'} align='center'>
            <Text>Copy students from spreadsheet and start editing</Text>
            <Button onClick={openModal}>Import Students</Button>
          </Stack>
        </Container>

        <Container size={'xs'} mt={'lg'}>
          <Stack>
            <TextInput
              label="Start entering student name, surname, or email"
              defaultValue={searchValue}
              onChange={(event) => setSearchValue(event.currentTarget.value)}
              onKeyDown={getHotkeyHandler([['enter', onComboboxSubmit], ['escape', () => {
                if (textInputRef.current) { textInputRef.current.value = '' };
                setSearchValue('');
              }]])}
              ref={textInputRef}
            />
            <Flex align="end" justify="space-between" gap="xs">
              <NumberInput
                label="Lab grade"
                style={{ flexGrow: 1 }}
                ref={numberInputRef}
                value={grade}
                onChange={v => { setGrade(v.toString()) }}
                min={0}
                max={2}
                step={0.25}
                onKeyDown={getHotkeyHandler([['enter', onResultSubmit]])}
              />
              <Button onClick={() => { setDefaultGrade(grade); notifications.show({ message: `Default changed to ${grade}` }) }}>Set default</Button>
            </Flex>
            <Flex justify="center" gap="md">
              <Button onClick={() => navigator.clipboard.writeText(studentList.map(v => `${v.email}\t${v.grade}`).join('\n'))}>Copy to clipboard</Button>
              <Button onClick={openDeleteGradeModal}>Clear grades</Button>
            </Flex>
            <Flex justify="center" gap="xs">
              <Text>{studentList.length} students loaded</Text>
              <Text>{filteredStudentList.length} displayed</Text>
            </Flex>
            <Text style={{ alignSelf: "center" }}>{studentList.filter(v => v.grade !== "").length} students graded</Text>
          </Stack>
        </Container>

        <Center mt={"lg"}>
          <Container>
            <Spreadsheet
              data={toMatrix(filteredStudentList)}
              columnLabels={["Name", "Surname", "Email", "Grade"]}
            />
          </Container>
        </Center>
      </Container>
    </>
  );
}
