import { Button, Flex, Modal, NumberInput, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { normalizeGradeCount } from '../../types/student';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  gradeCount: number;
  onGradeCountChange: (nextGradeCount: number) => void;
}

export function SettingsModal({
  opened,
  onClose,
  gradeCount,
  onGradeCountChange,
}: SettingsModalProps) {
  const [draftGradeCount, setDraftGradeCount] = useState<number | string>(gradeCount);

  useEffect(() => {
    if (opened) {
      setDraftGradeCount(gradeCount);
    }
  }, [opened, gradeCount]);

  const handleGradeCountChange = (value: number | string) => {
    setDraftGradeCount(value);
    if (value === '') {
      return;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      onGradeCountChange(normalizeGradeCount(parsed));
    }
  };

  const handleClose = () => {
    setDraftGradeCount(gradeCount);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Settings" size="sm">
      <Stack gap="md">
        <NumberInput
          label="Number of grades"
          description="Number of grade columns tracked per student"
          value={draftGradeCount}
          onChange={handleGradeCountChange}
          onBlur={() => setDraftGradeCount(gradeCount)}
          min={1}
          step={1}
          allowDecimal={false}
          allowNegative={false}
        />
        <Flex justify="flex-end">
          <Button onClick={handleClose}>Close</Button>
        </Flex>
      </Stack>
    </Modal>
  );
}
