import { createHashRouter } from 'react-router-dom';
import App from './App';
import StreamingPage from './pages/StreamingPage';
import HomePage from './pages/HomePage';
import { ROUTES } from './../constants/routes';

export const router = createHashRouter([
  {
    path: ROUTES.HOME,
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: ROUTES.STREAM(),
        element: <StreamingPage />,
      },
    ],
  },
]);
