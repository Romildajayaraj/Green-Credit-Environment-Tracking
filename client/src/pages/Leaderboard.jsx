import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiAward, FiUsers, FiStar } from 'react-icons/fi'
import axios from 'axios'

const Leaderboard = () => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/users/leaderboard')
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600'
      case 2:
        return 'from-gray-400 to-gray-600'
      case 3:
        return 'from-orange-400 to-orange-600'
      default:
        return 'from-primary-400 to-primary-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Green Champions 🏆</h1>
          <p className="text-secondary-600 text-lg">Top environmental contributors making a real difference</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {leaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                {leaderboard.slice(0, 3).map((topUser, index) => (
                  <div
                    key={topUser._id}
                    className={`card text-center transform hover:scale-105 ${
                      index === 0 ? 'md:order-2 md:scale-110' : 
                      index === 1 ? 'md:order-1' : 'md:order-3'
                    }`}
                  >
                    <div className="relative mx-auto mb-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                        {topUser.profileImage ? (
                          <img
                            src={`http://localhost:5000${topUser.profileImage}`}
                            alt={topUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">{topUser.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r ${getRankColor(index + 1)} rounded-full flex items-center justify-center animate-glow`}>
                        <span className="text-lg">{getRankIcon(index + 1)}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-2">{topUser.name}</h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <FiStar className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-primary-600">{topUser.creditScore}</span>
                      <span className="text-secondary-600">credits</span>
                    </div>
                    <Link
                      to={`/profile/${topUser._id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">Full Leaderboard</h2>
              
              <div className="space-y-4">
                {leaderboard.map((userData, index) => (
                  <div
                    key={userData._id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-secondary-50 ${
                      user && userData._id === user.id ? 'bg-primary-50 border-2 border-primary-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                          {userData.profileImage ? (
                            <img
                              src={`http://localhost:5000${userData.profileImage}`}
                              alt={userData.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold">{userData.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r ${getRankColor(index + 1)} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
                          {index < 3 ? getRankIcon(index + 1) : index + 1}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900 flex items-center">
                          {userData.name}
                          {user && userData._id === user.id && (
                            <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </h3>
                        <Link
                          to={`/profile/${userData._id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <FiStar className="w-4 h-4 text-yellow-500" />
                        <span className="text-xl font-bold text-primary-600">{userData.creditScore}</span>
                      </div>
                      <span className="text-secondary-600 text-sm">credits</span>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <FiUsers className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">No users yet</h3>
                  <p className="text-secondary-600">Be the first to start earning credits!</p>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            <div className="card">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">How Credits Work</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">📸</span>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">Upload Content</p>
                    <p className="text-sm text-secondary-600">+10 credits per approved upload</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👑</span>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">Admin Approval</p>
                    <p className="text-sm text-secondary-600">Credits awarded only after admin review</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🏆</span>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">High Impact Bonus</p>
                    <p className="text-sm text-secondary-600">+20 credits for exceptional environmental activities</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥇</span>
                    <span className="font-medium text-yellow-800">Top Contributor</span>
                  </div>
                  <span className="text-yellow-600 text-sm">1000+ credits</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌱</span>
                    <span className="font-medium text-green-800">Green Warrior</span>
                  </div>
                  <span className="text-green-600 text-sm">500+ credits</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌍</span>
                    <span className="font-medium text-blue-800">Earth Protector</span>
                  </div>
                  <span className="text-blue-600 text-sm">100+ credits</span>
                </div>
              </div>
            </div>

            {user && (
              <div className="card">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">Your Progress</h3>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {user.profileImage ? (
                      <img
                        src={`http://localhost:5000${user.profileImage}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">{user.name?.charAt(0)}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-secondary-900 mb-2">{user.name}</h4>
                  <div className="flex items-center justify-center space-x-1 mb-4">
                    <FiStar className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-primary-600">{user.creditScore}</span>
                    <span className="text-secondary-600">credits</span>
                  </div>
                  <Link to="/dashboard" className="btn-primary w-full">
                    View Dashboard
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard