import { Link } from 'react-router-dom';

function NavLinks({ links }) {
  return (
    <div className="mt-6 flex flex-col gap-2 text-center text-orange-200 text-sm sm:text-base font-medium">
      {links.map(({ label, to }) => (
        <Link key={to} to={to} className="hover:underline">
          {label}
        </Link>
      ))}
    </div>
  );
}

export default NavLinks;