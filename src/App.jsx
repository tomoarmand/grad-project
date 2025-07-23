import { Link } from 'react-router-dom';
import './App.css';
import logo from './assets/ChatGPT_Image_Jul_23__2025__10_14_00_AM-removebg-preview.png'; // Adjust the path if needed

function HomePage() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl pt-12 sm:pt-16 p-4 sm:p-6 text-center flex flex-col items-center">
        {/* Logo */}
        <img
          src={logo}
          alt="KenTone Logo"
          className="w-56 h-56 sm:w-64 sm:h-64 object-contain drop-shadow-lg -mt-8 sm:-mt-12 mb-0"
        />
        <div className="flex flex-col gap-4 w-full">
          <Link to="/LoginPage">
            <button className="w-full text-lg sm:text-xl font-semibold text-white bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200">
              Log In
            </button>
          </Link>
          <Link to="/CreateUserPage">
            <button className="w-full text-lg sm:text-xl font-semibold text-white bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200">
              Create New User
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;