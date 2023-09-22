import { Title, Text, Anchor, Button, Container, Combobox, NumberInput, FocusTrap, NumberInputProps, Table, Group, Center, Modal, Space, Flex, Stack, TextInput, Alert } from '@mantine/core';
import { getHotkeyHandler, range, useDebouncedState, useDisclosure, useFocusReturn, useListState } from '@mantine/hooks';
import { SearchCombobox } from '../SearchCombobox/SearchCombobox';
import { notifications } from '@mantine/notifications';
import React, { useEffect, useRef, useState } from 'react';
import Spreadsheet, { Matrix, RowIndicatorComponent, RowIndicatorProps } from 'react-spreadsheet';
import { InfoCircle } from 'tabler-icons-react';


function getFilteredOptions(data: IGradedStudent[], searchQuery: string, limit: number) {
  const result: IGradedStudent[] = [];
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

const toMatrix = (students: IGradedStudent[]): Matrix<{ value: string }> => {
  return students.map(s => [{ value: s.name }, { value: s.surname }, { value: s.email }, { value: s.grade.toString() }])
}

const toReadonlyMatrix = (students: IGradedStudent[]): Matrix<{ value: string }> => {
  return students.map(s => [{ value: s.name, readOnly: true }, { value: s.surname, readOnly: true }, { value: s.email, readOnly: true }, { value: s.grade.toString(), readOnly: true }])
}

const fromMatrix = (data: Matrix<{ value: string }>): IGradedStudent[] => {
  return data.map(v => { return { name: v[0]?.value || "", surname: v[1]?.value || "", email: v[2]?.value || "", grade: parseFloat(v[3]?.value || "0") } })
}

export function Grader() {
  const rawStudents: IGradedStudent[] = [
    {name: "", surname: "", email: "", grade: 0}
  ]

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [searchValue, setSearchValue] = useDebouncedState('', 300);
  const [grade, setGrade] = useState(2);

  const [studentList, studentListHandler] = useListState<IGradedStudent>();
  const filteredStudentList = searchValue ? getFilteredOptions(studentList, searchValue, 15) : studentList;

  const [updatedStudents, updatedStudentsHandler] = useListState<IGradedStudent>([]);

  const textInputRef = useRef<HTMLInputElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // textInputRef.current?.select()
  }, [])

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
    if(backupIndex -1){
      updatedStudentsHandler.insert(0, {...student, grade: grade})
    }else{
      updatedStudentsHandler.setItemProp(backupIndex, "grade", grade)
    }

    textInputRef.current?.select()
    setGrade(2)
  }

  return (
    <>
      <Modal opened={modalOpened} onClose={closeModal} title="Copy students from the spreadsheet" size="auto">
        <Container>
          <Flex direction="column" align="end" gap="md">
          <Alert style={{alignSelf:"center"}} title="Alert" color="red" icon={<InfoCircle />}>Any changes here will override all your data!</Alert>
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
              onKeyDown={getHotkeyHandler([['enter', onComboboxSubmit]])}
              ref={textInputRef}
            />
            <NumberInput
              ref={numberInputRef}
              value={grade}
              onChange={v => { setGrade(parseFloat(v.toString())) }}
              min={0}
              max={2}
              step={0.25}
              onKeyDown={getHotkeyHandler([['enter', onResultSubmit]])} />
            <Flex align={"center"} justify={"space-between"}>
            <Text>{studentList.length} students loaded, {filteredStudentList.length} displayed</Text>
            <Button onClick={()=> navigator.clipboard.writeText(studentList.map(v => `${v.email}\t${v.grade}`).join('\n'))}>Copy to clipboard</Button>
            </Flex>
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
