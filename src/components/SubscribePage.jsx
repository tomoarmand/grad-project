import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';

const API_URL = import.meta.env.VITE_API_URL;

function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 px-4">
      <div className="w-full max-w-sm bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-8 sm:p-10 text-center">
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="KenTone logo"
            className="w-24 h-24 object-contain mb-4 drop-shadow-md"
          />
          <h1 className="text-white text-3xl font-heading uppercase tracking-wide">
            Subscribe
          </h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mt-4" />
        </div>

        <div className="mb-8 space-y-3">
          <p className="text-white text-xl font-heading">US$12 / month</p>
          <p className="text-gray-400 text-sm font-body">
            Full access to KenTone ear training exercises
          </p>
          <ul className="text-gray-300 text-sm font-body space-y-2 text-left mt-4">
            <li className="flex items-center gap-2"><span className="text-red-500">✓</span> Unlimited listening exercises</li>
            <li className="flex items-center gap-2"><span className="text-red-500">✓</span> Teacher assigned exercises</li>
            <li className="flex items-center gap-2"><span className="text-red-500">✓</span> Track your progress</li>
            <li className="flex items-center gap-2"><span className="text-red-500">✓</span> Cancel anytime</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm font-body">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full text-lg font-heading uppercase tracking-wide text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded shadow-lg transition duration-200 focus:outline-none"
          >
            {isLoading ? 'Loading...' : 'Subscribe Now'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-sm font-body text-gray-500 hover:text-gray-300 py-2 transition duration-200"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscribePage;