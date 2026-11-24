import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@glideapps/glide-data-grid/dist/index.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { Router } from './Router';
import { theme } from './theme';

export function App() {
  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications />
        <Router />
      </ModalsProvider>
    </MantineProvider>
  );
}
