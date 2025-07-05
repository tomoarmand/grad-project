import { Link } from 'react-router-dom';

function NavLinks({ links, isPrimary = false }) {
  return (
    <div
      className={`mt-6 flex flex-col gap-2 text-center ${
        isPrimary ? 'text-orange-300 font-semibold text-base' : 'text-orange-200 text-sm sm:text-base font-medium'
      }`}
    >
      {links.map(({ label, to }) => (
        <Link
          key={to}
          to={to}
          className="hover:underline"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export default NavLinks;