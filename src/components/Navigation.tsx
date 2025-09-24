import { Link } from 'react-router-dom'

function Navigation() {
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/songs', label: 'Songs', icon: '🎵' },
    { path: '/upload', label: 'Upload', icon: '📤' },
    { path: '/about', label: 'About', icon: 'ℹ️' }
  ]

  return (
    <nav className="flex justify-center gap-5 p-5 bg-gray-800 rounded-xl mb-10 flex-wrap">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className="flex items-center gap-2 px-5 py-3 text-white bg-transparent rounded-lg border-2 border-gray-600 transition-all duration-200 text-base font-medium cursor-pointer hover:bg-gray-700 hover:border-primary-500"
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default Navigation