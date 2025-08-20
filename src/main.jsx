import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthWrapper from './components/AuthWrapper.jsx';
import HomePage from './App.jsx';
import StudentPage from './components/StudentPage.jsx';
import TeacherPage from './components/TeacherPage.jsx';
import CreateUserPage from './components/CreateUserPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import AssignmentPage from './components/AssignmentPage.jsx';
import TeacherExercisesManager from './components/TeacherExercisesManager.jsx';

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ Service worker registered:', reg.scope);
      })
      .catch((err) => {
        console.error('❌ Service worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/StudentPage" element={<StudentPage />} />
          <Route path="/TeacherPage" element={<TeacherPage />} />
          <Route path="/CreateUserPage" element={<CreateUserPage />} />
          <Route path="/LoginPage" element={<LoginPage />} />
          <Route path="/AssignmentPage" element={<AssignmentPage />} />
          <Route path="/TeacherExercisesManager" element={<TeacherExercisesManager />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  </StrictMode>
);
