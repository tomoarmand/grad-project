import StudentPage from "./components/StudentPage"
import TeacherPage from "./components/TeacherPage"
import { Link } from 'react-router-dom';
import './App.css'

function HomePage() {
    return (
        <>
        <h1>Home Page</h1>
        <Link to="/StudentPage">Student Login</Link>
        <Link to="/TeacherPage">Teacher Login</Link>
        </>
    )
}

export default HomePage