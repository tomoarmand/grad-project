import StudentPage from "./components/StudentPage"
import TeacherPage from "./components/TeacherPage"
import { Link } from 'react-router-dom';
import './App.css'

function HomePage() {
    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-8 bg-[#475569]">
        <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl mb-10 sm:mb-16 text-[#f8fafc]">KenTone</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm text-center">
        <Link to="/StudentPage"><h2 className="text-lg sm:text-xl md:text-2xl border rounded px-4 py-2 text-center inline-block text-[#f8fafc] hover:bg-[#fb923c]">Student Login</h2></Link>
        <Link to="/TeacherPage"><h2 className="text-lg sm:text-xl md:text-2xl border rounded px-4 py-2 text-center inline-block text-[#f8fafc] hover:bg-[#fb923c]">Teacher Login</h2></Link>
        </div>
        </div>
    )
}

export default HomePage