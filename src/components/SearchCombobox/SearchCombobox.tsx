import { useEffect, useState } from 'react';
import { Combobox, TextInput, useCombobox } from '@mantine/core';

interface ISearchComboboxProps {
    initialData: IStudent[],
    onSubmit?: (result: IStudent) => void,
}

function getFilteredOptions(data: IStudent[], searchQuery: string, limit: number) {
    const result: IStudent[] = [];
    const check = (str: string) => str.toLowerCase().includes(searchQuery.trim().toLowerCase())
  
    for (let i = 0; i < data.length; i += 1) {
      if (result.length === limit) {
        break;
      }

      const {name, surname, email} = data[i]

      if (check(name) || check(surname) || check(email)) {
        result.push(data[i]);
      }
    }
  
    return result;
  }

export function SearchCombobox<IData>(props:ISearchComboboxProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  });
  const [result, setResult] = useState<IStudent | null>(null);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    // we need to wait for options to render before we can select first one
    combobox.selectFirstOption();
  }, [search]);

  const filteredOptions = getFilteredOptions(props.initialData, search, 5);

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item.email} key={item.email}>
      {item.name.slice(0, 20)}  {item.surname.slice(0, 20)} ({item.email})
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(submitValue) => {
        setSearch(submitValue);
        const res = props.initialData.find((v)=> v.email === submitValue)!;
        setResult(res);
        combobox.closeDropdown();
        props.onSubmit?.(res);
      }}
    >
      <Combobox.Target>
        <TextInput
          label="Pick value or type anything"
          placeholder="Pick value or type anything"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length === 0 ? <Combobox.Empty>Nothing found</Combobox.Empty> : options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
