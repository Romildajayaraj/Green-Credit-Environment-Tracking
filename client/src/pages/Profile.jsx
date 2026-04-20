import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMapPin, FiCalendar, FiHeart, FiMessageSquare, FiAward, FiUpload } from 'react-icons/fi'
import axios from 'axios'

const Profile = () => {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
    fetchUserUploads()
  }, [id])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/users/profile/${id}`)
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchUserUploads = async () => {
    try {
      const response = await axios.get(`/api/uploads/user/${id}`)
      setUploads(response.data)
    } catch (error) {
      console.error('Error fetching user uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">User Not Found</h2>
          <p className="text-secondary-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const totalLikes = uploads.reduce((sum, upload) => sum + (upload.likes?.length || 0), 0)
  const totalComments = uploads.reduce((sum, upload) => sum + (upload.comments?.length || 0), 0)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="w-32 h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-4xl font-bold animate-glow overflow-hidden">
              {user.profileImage ? (
                <img
                  src={`http://localhost:5000${user.profileImage}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0) || 'U'
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">{user.name}</h1>
              <p className="text-secondary-600 mb-2">{user.email}</p>
              {user.bio && (
                <p className="text-secondary-700 mb-4 italic">"{user.bio}"</p>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                <div className="flex items-center space-x-2 text-secondary-600">
                  <FiMapPin className="w-4 h-4" />
                  <span>{user.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-secondary-600">
                  <FiCalendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-500 rounded-full mx-auto mb-2">
                    <FiAward className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-primary-600">{user.creditScore}</div>
                  <div className="text-sm text-secondary-600">Credits</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2">
                    <FiUpload className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{uploads.length}</div>
                  <div className="text-sm text-secondary-600">Uploads</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-full mx-auto mb-2">
                    <FiHeart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">{totalLikes}</div>
                  <div className="text-sm text-secondary-600">Likes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mx-auto mb-2">
                    <FiMessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{totalComments}</div>
                  <div className="text-sm text-secondary-600">Comments</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">Green Contributions</h2>
          
          {uploads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.map((upload, index) => (
                <motion.div
                  key={upload._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="card group hover:scale-105"
                >
                  <div className="relative rounded-xl overflow-hidden mb-4">
                    {upload.mediaType === 'image' ? (
                      <img
                        src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                        alt={upload.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <video
                        src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                        className="w-full h-48 object-cover"
                        controls
                      />
                    )}
                    <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                      +{upload.creditPoints}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-secondary-900 mb-2">{upload.title}</h3>
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{upload.description}</p>

                  <div className="flex items-center justify-between text-sm text-secondary-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <FiHeart className="w-4 h-4" />
                        <span>{upload.likes?.length || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiMessageSquare className="w-4 h-4" />
                        <span>{upload.comments?.length || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiMapPin className="w-3 h-3" />
                      <span className="truncate max-w-24">{upload.location.address}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-secondary-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-secondary-500">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        upload.isApproved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {upload.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <FiUpload className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No uploads yet</h3>
              <p className="text-secondary-600">This user hasn't shared any green activities yet.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Profile