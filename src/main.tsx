import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext.tsx';
import ErrorPage from "./pages/ErrorPage";
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './agent-dashboard';
import BecomeVip from './pages/BecomeVip';
import Tournaments from './pages/Tournaments';

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
    path: "/agent",
    element: <AgentDashboard />,
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
    path: "/*",
    element: <Navigate to="/" replace />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </StrictMode>,
);

