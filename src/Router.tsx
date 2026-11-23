import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <HomePage />,
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

export function Router() {
  return <RouterProvider router={router} />;
}
