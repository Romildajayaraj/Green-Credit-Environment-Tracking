import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiMenu, FiX, FiHome, FiUpload, FiTrendingUp, FiUser, FiSettings, FiLogOut, FiMessageSquare, FiChevronDown } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showPublicDropdown, setShowPublicDropdown] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsOpen(false)
    setShowPublicDropdown(false)
  }

  const publicNavItems = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Feed', path: '/feed', icon: FiTrendingUp },
    { name: 'Leaderboard', path: '/leaderboard', icon: FiTrendingUp },
  ]

  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiUser },
    { name: 'Upload', path: '/upload', icon: FiUpload },
    { name: 'My Uploads', path: '/my-uploads', icon: FiUpload },
    { name: 'My Profile', path: '/my-profile', icon: FiSettings },
    { name: 'Chat', path: '/chat', icon: FiMessageSquare },
    { name: 'Complaints', path: '/complaints', icon: FiMessageSquare },
  ]

  const adminNavItems = [
    { name: 'Admin Panel', path: '/admin', icon: FiSettings },
  ]

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center animate-glow">
                <span className="text-white font-bold text-xl">🌱</span>
              </div>
              <span className="gradient-text text-xl font-bold hidden sm:block">Green Credit</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {!user ? (
              // Show public nav items when not logged in
              publicNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 transition-colors duration-300"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))
            ) : (
              // Show public nav items in dropdown when logged in
              <div className="relative">
                <button
                  onClick={() => setShowPublicDropdown(!showPublicDropdown)}
                  className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 transition-colors duration-300"
                >
                  <FiHome className="w-4 h-4" />
                  <span>Browse</span>
                  <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPublicDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showPublicDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-50"
                    >
                      {publicNavItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setShowPublicDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-300"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user && !user.isAdmin && (
              <>
                <div className="w-px h-6 bg-secondary-300"></div>
                {userNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 transition-colors duration-300"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </>
            )}

            {user?.isAdmin && (
              <>
                <div className="w-px h-6 bg-secondary-300"></div>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors duration-300 font-medium"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                  {!user.isAdmin ? (
                    <p className="text-xs text-primary-600">Credits: {user.creditScore}</p>
                  ) : (
                    <p className="text-xs text-red-600">Administrator</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-secondary-700 hover:text-red-600 transition-colors duration-300"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 hover:text-secondary-800 px-6 py-2 rounded-xl font-semibold transition-all duration-300 border border-secondary-200 hover:border-secondary-300"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-700 hover:text-primary-600 transition-colors duration-300"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-t border-white/20"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!user && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide px-3 mb-2">Public</p>
                  {publicNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {user && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide px-3 mb-2">Browse</p>
                  {publicNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {user && !user.isAdmin && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide px-3 mb-2">User Panel</p>
                  {userNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {user?.isAdmin && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-500 uppercase tracking-wide px-3 mb-2">Admin Panel</p>
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 font-medium"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-secondary-200 pt-4">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                      {!user.isAdmin ? (
                        <p className="text-xs text-primary-600">Credits: {user.creditScore}</p>
                      ) : (
                        <p className="text-xs text-red-600">Administrator</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block bg-secondary-100 hover:bg-secondary-200 text-secondary-700 hover:text-secondary-800 px-3 py-2 rounded-lg font-semibold transition-all duration-300 text-center border border-secondary-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold transition-all duration-300 text-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar