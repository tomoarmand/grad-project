import { Link } from 'react-router-dom';

function NavLinks({ links, isBreadcrumb = false, isPrimary = false, isSubtle = false }) {
  if (isBreadcrumb) {
    return (
      <nav className="text-white text-xs sm:text-sm flex flex-wrap items-center gap-1 truncate px-2 sm:px-0">
        {links.map(({ label, to }, index) => (
          <span key={to} className="flex items-center">
            {index > 0 && <span className="mx-1 opacity-50">→</span>}
            <Link
              to={to}
              className={`${
                index === links.length - 1
                  ? 'text-red-600 font-heading uppercase tracking-wide'
                  : 'text-gray-400 font-body'
              } hover:underline focus:outline-none focus:ring-2 focus:ring-red-600 rounded px-1 truncate max-w-[8ch] sm:max-w-none`}
            >
              {label}
            </Link>
          </span>
        ))}
      </nav>
    );
  }

  return (
    <div
      className={`mt-6 flex flex-col gap-2 text-center ${
        isPrimary
          ? 'text-lg font-heading uppercase tracking-wide text-white'
          : isSubtle
          ? 'text-gray-500 text-sm font-body'
          : 'text-gray-300 text-sm sm:text-base font-body'
      }`}
    >
      {links.map(({ label, to }) => (
        <Link
          key={to}
          to={to}
          className={`hover:underline focus:outline-none focus:ring-2 focus:ring-red-600 rounded px-2 py-1 transition ${
            isSubtle ? 'hover:text-gray-200' : 'hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export default NavLinks;