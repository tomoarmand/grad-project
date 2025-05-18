import StudentPage from "./StudentPage"
import TeacherPage from "./TeacherPage"
import { Link } from 'react-router';

function HomePage() {
    return (
        <>
        <h1>Home Page</h1>
        <button><Link to="/StudentPage">Student Login</Link></button>
        <button><Link to="/TeacherPage">Teacher Login</Link></button>
        </>
    )
}

export default HomePage