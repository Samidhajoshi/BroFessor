import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import BrowseUsers   from './pages/BrowseUsers';
import Requests      from './pages/Requests';
import Sessions      from './pages/Sessions';
import Profile       from './pages/Profile';
import Notifications from './pages/Notifications';
import Calendar      from './pages/Calendar';
import UserProfile   from './pages/UserProfile';
import Chat          from './pages/Chat';
import ProfileAnalyzer from './pages/ProfileAnalyzer';
import Landing       from './pages/Landing';

function Shell({ children, fullHeight = false }) {
  return (
    <div className="app-shell">
      <Navbar />
      {fullHeight
        ? children
        : <div>{children}</div>}
    </div>
  );
}

function RedirectIfAuthed({ children }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function Protected({ children, fullHeight }) {
  return (
    <ProtectedRoute>
      <Shell fullHeight={fullHeight}>{children}</Shell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RedirectIfAuthed><Landing /></RedirectIfAuthed>} />
          <Route path="/login"    element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
          <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />

          <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
          <Route path="/browse"        element={<Protected><BrowseUsers /></Protected>} />
          <Route path="/requests"      element={<Protected><Requests /></Protected>} />
          <Route path="/sessions"      element={<Protected><Sessions /></Protected>} />
          <Route path="/calendar"      element={<Protected><Calendar /></Protected>} />
          <Route path="/profile"       element={<Protected><Profile /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/users/:id"     element={<Protected><UserProfile /></Protected>} />

          {/* Chat takes full viewport height, no extra wrapper div */}
          <Route path="/chat"          element={<Protected fullHeight><Chat /></Protected>} />
          <Route path="/chat/:roomId"  element={<Protected fullHeight><Chat /></Protected>} />
          <Route path="/profile-analyzer" element={<Protected><ProfileAnalyzer /></Protected>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
