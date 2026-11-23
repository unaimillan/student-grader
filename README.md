# Student Grader

Upload or paste a list of students, search interactively, and assign grades across one or more grade columns.

> Built with: MantineUI + React + TypeScript + Vite + pnpm

## Usage

1. Click **Import Students** and paste rows from a spreadsheet (`Name`, `Surname`, `Email`, followed by grade columns).
2. Type a student's name, surname, or email prefix to filter down to a single student, then press **Enter**.
3. Enter grades across the grade inputs (press **Enter** to advance between inputs and submit on the last input).
4. Use **Copy to clipboard** to export `email` and grades as tab-separated values (`TSV`).
5. Student rows and default grade settings persist automatically in `localStorage`.

## pnpm scripts

### Build and dev scripts

- `pnpm dev` – start development server
- `pnpm build` – typecheck and build production version of the app
- `pnpm preview` – locally preview production build

### Testing and quality scripts

- `pnpm run typecheck` – checks TypeScript types (`tsc --noEmit`)
- `pnpm run prettier` – checks formatting with Prettier
- `pnpm run prettier:write` – formats all TypeScript files with Prettier
- `pnpm run lint` – runs ESLint across `src` and `test-utils`
- `pnpm run jest` – runs Jest unit and component tests
- `pnpm run jest:watch` – starts Jest in watch mode
- `pnpm test` – runs `typecheck`, `prettier`, `lint`, `jest`, and `build`

### Storybook scripts

- `pnpm run storybook` – starts Storybook dev server on port 6006
- `pnpm run storybook:build` – builds production Storybook bundle to `storybook-static`
