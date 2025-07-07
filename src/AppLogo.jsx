import { Link } from 'react-router-dom';
import './App.css';
import KenToneLogo from '/home/tomo/Desktop/Workspace/grad-project/src/assets/Gemini_Generated_Image_xbrffpxbrffpxbrf-removebg-preview.png';

function HomePage() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      {/* Logo positioned above the card - optimized sizing and spacing */}
      <div className="mb-6 text-center">
        <img
          src={KenToneLogo}
          alt="KenTone App Logo"
          className="h-auto w-56 sm:w-72 lg:w-80 xl:w-96 mx-auto drop-shadow-2xl"
        />
      </div>
      
      {/* Main action card - now focused solely on functionality */}
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-lg p-8 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Welcome
        </h2>
        <div className="flex flex-col gap-4">
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