import { Link } from 'react-router-dom';
import './App.css';
import logo from './assets/logo.png';

function HomePage() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      {/* Card container */}
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-8 sm:p-10 text-center">
        {/* Logo and Heading */}
        <div className="flex flex-col items-center mb-10">
          <img
            src={logo}
            alt="KenTone logo"
            className="w-32 h-32 sm:w-36 sm:h-36 object-contain mb-4 drop-shadow-md"
            style={{
              filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3))'
            }}
          />
          <h1
            style={{ 
              fontFamily: "'Merriweather', serif",
              textShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)'
            }}
            className="text-[#f5f0e6] text-4xl sm:text-5xl font-semibold tracking-wide"
          >
            KenTone
          </h1>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mt-12">
          <Link to="/LoginPage">
            <button className="w-full text-lg sm:text-xl font-semibold text-[#f5f0e6] bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200 shadow-md hover:shadow-lg">
              Log In
            </button>
          </Link>
          <Link to="/CreateUserPage">
            <button className="w-full text-lg sm:text-xl font-semibold text-[#f5f0e6] bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200 shadow-md hover:shadow-lg">
              Create New User
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;