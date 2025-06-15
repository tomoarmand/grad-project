import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './App.jsx'
import StudentPage from "./components/StudentPage"
import TeacherPage from "./components/TeacherPage"
import CreateUserPage from "./components/CreateUserPage";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<HomePage />} />
        <Route path="/StudentPage" element={<StudentPage />} />
        <Route path="/TeacherPage" element={<TeacherPage />} />
        <Route path="/CreateUserPage" element={<CreateUserPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
