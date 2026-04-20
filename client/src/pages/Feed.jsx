import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiHeart, FiMessageSquare, FiMapPin, FiThumbsDown, FiSend } from 'react-icons/fi'
import InfiniteScroll from 'react-infinite-scroll-component'
import axios from 'axios'
import Swal from 'sweetalert2'

const Feed = () => {
  const { user } = useAuth()
  const [uploads, setUploads] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState({})

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const response = await axios.get(`/api/uploads?page=${page}&limit=10`)
      const newUploads = response.data.uploads

      if (page === 1) {
        setUploads(newUploads)
      } else {
        setUploads(prev => [...prev, ...newUploads])
      }

      setHasMore(response.data.currentPage < response.data.totalPages)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching uploads:', error)
      setLoading(false)
    }
  }

  const fetchMoreData = () => {
    setPage(prev => prev + 1)
    setTimeout(() => {
      fetchUploads()
    }, 500)
  }

  const handleLike = async (uploadId) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please login to like posts'
      })
      return
    }

    try {
      const response = await axios.post(`/api/uploads/${uploadId}/like`)
      setUploads(prev => prev.map(upload => 
        upload._id === uploadId ? response.data : upload
      ))
    } catch (error) {
      console.error('Error liking upload:', error)
    }
  }

  const handleDislike = async (uploadId) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please login to dislike posts'
      })
      return
    }

    try {
      const response = await axios.post(`/api/uploads/${uploadId}/dislike`)
      setUploads(prev => prev.map(upload => 
        upload._id === uploadId ? response.data : upload
      ))
    } catch (error) {
      console.error('Error disliking upload:', error)
    }
  }

  const handleComment = async (uploadId) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please login to comment'
      })
      return
    }

    const text = commentText[uploadId]
    if (!text?.trim()) return

    try {
      const response = await axios.post(`/api/uploads/${uploadId}/comment`, { text })
      setUploads(prev => prev.map(upload => 
        upload._id === uploadId ? response.data : upload
      ))
      setCommentText(prev => ({ ...prev, [uploadId]: '' }))
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const isLiked = (upload) => {
    return user && upload.likes.some(like => like.user === user.id)
  }

  const isDisliked = (upload) => {
    return user && upload.dislikes.some(dislike => dislike.user === user.id)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Green Feed 🌱</h1>
          <p className="text-secondary-600 text-lg">Discover amazing environmental activities from our community</p>
        </motion.div>

        <InfiniteScroll
          dataLength={uploads.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          }
          endMessage={
            <div className="text-center py-8">
              <p className="text-secondary-600">You've seen all posts! 🎉</p>
            </div>
          }
        >
          <div className="space-y-8">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                    {upload.user?.profileImage ? (
                      <img
                        src={`http://localhost:5000${upload.user.profileImage}`}
                        alt={upload.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {upload.user?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{upload.user?.name}</h3>
                    <p className="text-secondary-500 text-sm flex items-center">
                      <FiMapPin className="w-3 h-3 mr-1" />
                      {upload.location.address}
                    </p>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-secondary-900 mb-2">{upload.title}</h2>
                <p className="text-secondary-700 mb-4">{upload.description}</p>

                <div className="rounded-xl overflow-hidden mb-4">
                  {upload.mediaType === 'image' ? (
                    <img
                      src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                      alt={upload.title}
                      className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <video
                      src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                      controls
                      className="w-full h-64 md:h-96 object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(upload._id)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                        isLiked(upload)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <FiHeart className={`w-4 h-4 ${isLiked(upload) ? 'fill-current' : ''}`} />
                      <span>{upload.likes.length}</span>
                    </button>
                    <button
                      onClick={() => handleDislike(upload._id)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                        isDisliked(upload)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <FiThumbsDown className={`w-4 h-4 ${isDisliked(upload) ? 'fill-current' : ''}`} />
                      <span>{upload.dislikes.length}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-secondary-600">
                      <FiMessageSquare className="w-4 h-4" />
                      <span>{upload.comments.length}</span>
                    </div>
                  </div>
                  <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                    +{upload.creditPoints} credits
                  </div>
                </div>

                {upload.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {upload.comments.slice(-3).map((comment) => (
                      <div key={comment._id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center overflow-hidden">
                          {comment.user?.profileImage ? (
                            <img
                              src={`http://localhost:5000${comment.user.profileImage}`}
                              alt={comment.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {comment.user?.name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 bg-secondary-50 rounded-lg p-3">
                          <p className="font-medium text-secondary-900 text-sm">{comment.user?.name}</p>
                          <p className="text-secondary-700">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {user && (
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profileImage ? (
                        <img
                          src={`http://localhost:5000${user.profileImage}`}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[upload._id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [upload._id]: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(upload._id)}
                      />
                      <button
                        onClick={() => handleComment(upload._id)}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
                      >
                        <FiSend className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  )
}

export default Feed