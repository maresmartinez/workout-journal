import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/templates', label: 'Templates' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' },
]

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-gray-50 px-4 py-3 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between md:justify-start md:gap-8">
          <NavLink to="/" className="text-lg font-bold text-gray-900">
            Workout Journal
          </NavLink>
          <div className="flex gap-4 md:gap-6 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
