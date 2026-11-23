import { screen, waitFor } from '@testing-library/react';
import { render, userEvent } from '@test-utils';
import { Grader } from './Grader';

describe('Grader', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to one grade and persists submitted grade via keyboard workflow', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'student-grader-students',
      JSON.stringify([
        { name: 'Alice', surname: 'Smith', email: 'a.smith@example.edu', grades: [''] },
        { name: 'Bob', surname: 'Jones', email: 'b.jones@example.edu', grades: [''] },
      ])
    );

    render(<Grader />);

    expect(screen.getByText('2 students loaded')).toBeInTheDocument();
    expect(screen.getByText('0 students graded')).toBeInTheDocument();
    expect(screen.getByLabelText('Grade')).toBeInTheDocument();
    expect(screen.queryByLabelText('Grade 2')).not.toBeInTheDocument();

    const searchInput = screen.getByLabelText('Start entering student name, surname, or email');
    await user.type(searchInput, 'a.smith{Enter}');

    const gradeInput = screen.getByLabelText('Grade');
    expect(gradeInput).toHaveFocus();

    await user.clear(gradeInput);
    await user.type(gradeInput, '1.75{Enter}');

    await waitFor(() => {
      expect(screen.getByText('1 students graded')).toBeInTheDocument();
    });

    const stored = JSON.parse(window.localStorage.getItem('student-grader-students') || '[]');
    expect(stored[0].grades).toEqual(['1.75']);
  });

  it('configures number of grades in settings popup, saves to localStorage, and grades multiple columns', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'student-grader-students',
      JSON.stringify([
        { name: 'Alice', surname: 'Smith', email: 'a.smith@example.edu', grades: ['', ''] },
      ])
    );

    render(<Grader />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const countInput = await screen.findByLabelText('Number of grades');
    await user.clear(countInput);
    await user.type(countInput, '2');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(window.localStorage.getItem('student-grader-grade-count')).toBe('2');

    const searchInput = screen.getByLabelText('Start entering student name, surname, or email');
    await user.type(searchInput, 'a.smith{Enter}');

    const grade1Input = screen.getByLabelText('Grade 1');
    const grade2Input = screen.getByLabelText('Grade 2');
    expect(grade1Input).toHaveFocus();

    await user.clear(grade1Input);
    await user.type(grade1Input, '1.75{Enter}');
    expect(grade2Input).toHaveFocus();

    await user.clear(grade2Input);
    await user.type(grade2Input, '1.5{Enter}');

    await waitFor(() => {
      expect(screen.getByText('1 students graded')).toBeInTheDocument();
    });

    const stored = JSON.parse(window.localStorage.getItem('student-grader-students') || '[]');
    expect(stored[0].grades).toEqual(['1.75', '1.5']);
  });

  it('loads saved grade count from localStorage and clears grades via modal', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('student-grader-grade-count', '3');
    window.localStorage.setItem(
      'student-grader-students',
      JSON.stringify([
        {
          name: 'Alice',
          surname: 'Smith',
          email: 'a.smith@example.edu',
          grades: ['2', '2', '2'],
        },
      ])
    );

    render(<Grader />);

    expect(screen.getByLabelText('Grade 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear grades' }));
    const confirmButton = await screen.findByRole('button', { name: 'Clear all grades' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('0 students graded')).toBeInTheDocument();
    });
  });

  it('copies TSV grades to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    window.localStorage.setItem('student-grader-grade-count', '2');
    window.localStorage.setItem(
      'student-grader-students',
      JSON.stringify([
        { name: 'Alice', surname: 'Smith', email: 'a.smith@example.edu', grades: ['2', '1.5'] },
      ])
    );

    render(<Grader />);

    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    expect(writeText).toHaveBeenCalledWith('a.smith@example.edu\t2\t1.5');
  });
});
