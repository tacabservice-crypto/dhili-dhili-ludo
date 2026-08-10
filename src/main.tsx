import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext.tsx';
import ErrorPage from "./pages/ErrorPage";
import AdminDashboard from './pages/AdminDashboard';
import BecomeVip from './pages/BecomeVip';
import Tournaments from './pages/Tournaments';

import AgentDashboard from '../src/agent-dashboard';
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/room/:roomId",
    element: <App />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  {
    path: "/vip",
    element: <BecomeVip />,
  },
  {
    path: "/tournaments",
    element: <Tournaments />,
  },
  {
    path: "/agent",
    element: <AgentDashboard />,
  },

]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </StrictMode>,
);

