import { render as testingLibraryRender } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { theme } from '../src/theme';

function ensurePortalElement() {
  if (!document.getElementById('portal')) {
    const portal = document.createElement('div');
    portal.id = 'portal';
    document.body.appendChild(portal);
  }
}

export function render(ui: React.ReactNode) {
  ensurePortalElement();
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={theme}>
        <ModalsProvider>{children}</ModalsProvider>
      </MantineProvider>
    ),
  });
}
