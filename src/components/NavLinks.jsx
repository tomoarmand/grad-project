import { Link } from 'react-router-dom';

function NavLinks({ links, isBreadcrumb = false, isPrimary = false }) {
  if (isBreadcrumb) {
    return (
      <nav className="text-white text-xs sm:text-sm flex flex-wrap items-center gap-1 truncate px-2 sm:px-0">
        {links.map(({ label, to }, index) => (
          <span key={to} className="flex items-center">
            {index > 0 && <span className="mx-1 opacity-50">→</span>}
            <Link
              to={to}
              className={`${
                index === links.length - 1 ? 'text-orange-400 font-medium' : 'opacity-75'
              } hover:underline focus:outline-none focus:ring-2 focus:ring-orange-300 rounded px-1 truncate max-w-[8ch] sm:max-w-none`}
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
        isPrimary ? 'text-lg font-semibold' : 'text-orange-200 text-sm sm:text-base font-medium'
      }`}
    >
      {links.map(({ label, to }) => (
        <Link
          key={to}
          to={to}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-orange-300 rounded px-2 py-1"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export default NavLinks;
