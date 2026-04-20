import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiUpload, FiTrendingUp, FiAward, FiMessageSquare, FiEye, FiHeart, FiUsers } from 'react-icons/fi'
import axios from 'axios'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUploads: 0,
    approvedUploads: 0,
    totalLikes: 0,
    creditScore: 0,
    rank: 0
  })
  const [recentUploads, setRecentUploads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, uploadsRes] = await Promise.all([
        axios.get('/api/users/stats'),
        axios.get('/api/users/my-uploads')
      ])
      
      setStats(statsRes.data)
      setRecentUploads(uploadsRes.data.slice(0, 3))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Credit Score',
      value: stats.creditScore,
      icon: FiAward,
      color: 'from-yellow-400 to-yellow-600',
      suffix: 'pts'
    },
    {
      title: 'Global Rank',
      value: stats.rank,
      icon: FiTrendingUp,
      color: 'from-purple-400 to-purple-600',
      suffix: ''
    },
    {
      title: 'Total Uploads',
      value: stats.totalUploads,
      icon: FiUpload,
      color: 'from-blue-400 to-blue-600',
      suffix: ''
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes,
      icon: FiHeart,
      color: 'from-red-400 to-red-600',
      suffix: ''
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-secondary-600 text-lg">
            Here's your environmental impact overview
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card group hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-1">
                    {stat.value}{stat.suffix}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center group-hover:animate-glow`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">Recent Uploads</h2>
                <Link to="/upload" className="btn-primary">
                  <FiUpload className="w-4 h-4 mr-2" />
                  New Upload
                </Link>
              </div>

              {recentUploads.length > 0 ? (
                <div className="space-y-4">
                  {recentUploads.map((upload) => (
                    <div key={upload._id} className="flex items-center space-x-4 p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors duration-300">
                      <div className="w-16 h-16 rounded-xl overflow-hidden">
                        {upload.mediaType === 'image' ? (
                          <img
                            src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                            alt={upload.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900">{upload.title}</h3>
                        <p className="text-secondary-600 text-sm">{upload.description.slice(0, 100)}...</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-500">
                          <span className="flex items-center">
                            <FiHeart className="w-4 h-4 mr-1" />
                            {upload.likes?.length || 0}
                          </span>
                          <span className="flex items-center">
                            <FiMessageSquare className="w-4 h-4 mr-1" />
                            {upload.comments?.length || 0}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${upload.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {upload.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiUpload className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">No uploads yet</h3>
                  <p className="text-secondary-600 mb-4">Start sharing your green activities to earn credits!</p>
                  <Link to="/upload" className="btn-primary">
                    Upload Your First Content
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            <div className="card">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/upload" className="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors duration-300">
                  <FiUpload className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-primary-700 font-medium">Upload Content</span>
                </Link>
                <Link to="/feed" className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-300">
                  <FiEye className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-blue-700 font-medium">Browse Feed</span>
                </Link>
                <Link to="/leaderboard" className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-300">
                  <FiTrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-purple-700 font-medium">View Leaderboard</span>
                </Link>
                <Link to="/complaints" className="flex items-center p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors duration-300">
                  <FiMessageSquare className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-red-700 font-medium">Report Issues</span>
                </Link>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">Achievement Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary-600">First Upload</span>
                    <span className="text-primary-600 font-medium">
                      {stats.totalUploads > 0 ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${stats.totalUploads > 0 ? 'bg-primary-500 w-full' : 'bg-secondary-300 w-0'}`}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary-600">100 Credits</span>
                    <span className="text-primary-600 font-medium">{Math.min(stats.creditScore, 100)}/100</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min((stats.creditScore / 100) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary-600">Top 100 Rank</span>
                    <span className="text-primary-600 font-medium">
                      {stats.rank <= 100 ? 'Achieved' : `Rank ${stats.rank}`}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${stats.rank <= 100 ? 'bg-primary-500 w-full' : 'bg-yellow-400'}`} style={{ width: stats.rank <= 100 ? '100%' : `${Math.max(100 - stats.rank, 10)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard