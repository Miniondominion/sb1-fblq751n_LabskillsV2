import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { InstructorSelection } from './pages/InstructorSelection';
import { Dashboard } from './pages/Dashboard';
import { AdminStudentManagement } from './pages/AdminStudentManagement';
import { InstructorStudentManagement } from './pages/InstructorStudentManagement';
import { SkillsManagement } from './pages/SkillsManagement';
import { ClassManagement } from './pages/ClassManagement';
import { SkillAssignment } from './pages/SkillAssignment';
import { SkillLog } from './pages/SkillLog';
import { SkillLogs } from './pages/SkillLogs';
import { Profile } from './pages/Profile';
import { Debug } from './pages/Debug';
import { Reports } from './pages/Reports';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup/instructor" element={<InstructorSelection />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/students"
            element={
              <AuthGuard>
                <AdminStudentManagement />
              </AuthGuard>
            }
          />
          <Route
            path="/instructor/students"
            element={
              <AuthGuard>
                <InstructorStudentManagement />
              </AuthGuard>
            }
          />
          <Route
            path="/skills"
            element={
              <AuthGuard>
                <SkillsManagement />
              </AuthGuard>
            }
          />
          <Route
            path="/skills/:skillId/assign"
            element={
              <AuthGuard>
                <SkillAssignment />
              </AuthGuard>
            }
          />
          <Route
            path="/skills/log"
            element={
              <AuthGuard>
                <SkillLog />
              </AuthGuard>
            }
          />
          <Route
            path="/skills/logs"
            element={
              <AuthGuard>
                <SkillLogs />
              </AuthGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <AuthGuard>
                <Reports />
              </AuthGuard>
            }
          />
          <Route
            path="/classes"
            element={
              <AuthGuard>
                <ClassManagement />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route
            path="/debug"
            element={
              <AuthGuard>
                <Debug />
              </AuthGuard>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;