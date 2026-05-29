import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MinimalLayout from './components/MinimalLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import PublicProfile from './pages/PublicProfile';
import VisitorSignIn from './pages/VisitorSignIn';
import Inbox from './pages/Inbox';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import { useAuth } from './store/auth';
import { getSubdomainUsername } from './lib/host';

export default function App() {
  const loadMe = useAuth((s) => s.loadMe);
  useEffect(() => { loadMe(); }, [loadMe]);

  const subUsername = getSubdomainUsername();
  if (subUsername) {
    return (
      <Routes>
        <Route element={<MinimalLayout />}>
          <Route path="*" element={<PublicProfile usernameOverride={subUsername} />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<Help />} />
        <Route path="/visitor-signin" element={<VisitorSignIn />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="/:username" element={<PublicProfile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
