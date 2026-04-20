import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { 
  FiUpload, FiCheck, FiClock, FiX, FiSearch, FiFilter, FiTrendingUp, 
  FiHeart, FiMessageCircle, FiThumbsDown, FiAward, FiBarChart2, 
  FiCalendar, FiEye, FiEdit, FiTrash2, FiDownload, FiStar
} from 'react-icons/fi'
import axios from 'axios'
import Swal from 'sweetalert2'

const MyUploads = () => {
  const { user } = useAuth()
  const [uploads, setUploads] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1
  })
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUploads()
    fetchStats()
  }, [filters])

  const fetchUploads = async () => {
    try {
      const response = await axios.get('/api/users/my-uploads', {
        params: filters
      })
      setUploads(response.data.uploads)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Error fetching uploads:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))
  }

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const deleteUpload = async (uploadId) => {
    const result = await Swal.fire({
      title: 'Delete Upload?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/uploads/${uploadId}`)
        fetchUploads()
        fetchStats()
        Swal.fire('Deleted!', 'Upload has been deleted.', 'success')
      } catch (error) {
        Swal.fire('Error!', 'Failed to delete upload.', 'error')
      }
    }
  }

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheck className="w-3 h-3 mr-1" />
          Approved
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FiClock className="w-3 h-3 mr-1" />
          Pending
        </span>
      )
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">My Uploads</h1>
            <p className="text-secondary-600">Track your environmental contributions and credit earnings</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <FiUpload className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-secondary-600">Total Uploads</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalUploads}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FiCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-secondary-600">Approved</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.approvedUploads}</p>
                  <p className="text-xs text-green-600">{stats.approvalRate}% approval rate</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FiAward className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-secondary-600">Total Credits</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.creditScore}</p>
                  <p className="text-xs text-blue-600">Rank #{stats.rank} of {stats.totalUsers}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <FiTrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-secondary-600">Avg Credits/Upload</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.averageCreditsPerUpload}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Engagement Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card mb-8"
          >
            <h3 className="text-lg font-bold text-secondary-900 mb-4">Engagement Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mx-auto mb-2">
                  <FiHeart className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalLikes}</p>
                <p className="text-xs text-secondary-600">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                  <FiMessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalComments}</p>
                <p className="text-xs text-secondary-600">Comments</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-2">
                  <FiThumbsDown className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalDislikes}</p>
                <p className="text-xs text-secondary-600">Dislikes</p>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search uploads..."
                    value={filters.search}
                    onChange={handleSearch}
                    className="pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FiFilter className="w-4 h-4 text-secondary-600" />
                <button
                  onClick={() => handleStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.status === 'all' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleStatusFilter('approved')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.status === 'approved' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => handleStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.status === 'pending' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusFilter('rejected')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.status === 'rejected' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>
          </motion.div>

          {/* Uploads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="card hover:shadow-xl transition-all duration-300"
              >
                <div className="relative">
                  {upload.mediaType === 'image' ? (
                    <img
                      src={`http://localhost:5000${upload.mediaUrl}`}
                      alt={upload.title}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <video
                      src={`http://localhost:5000${upload.mediaUrl}`}
                      className="w-full h-48 object-cover rounded-xl"
                      controls
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(upload.isApproved)}
                  </div>
                  {upload.isApproved && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        <FiStar className="w-3 h-3 mr-1" />
                        +{upload.creditPoints} credits
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-secondary-900 mb-2">{upload.title}</h3>
                  <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{upload.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-secondary-500 mb-3">
                    <span>{formatDate(upload.createdAt)}</span>
                    <span>{upload.location.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center text-red-600">
                        <FiHeart className="w-4 h-4 mr-1" />
                        {upload.likes.length}
                      </span>
                      <span className="flex items-center text-blue-600">
                        <FiMessageCircle className="w-4 h-4 mr-1" />
                        {upload.comments.length}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <FiThumbsDown className="w-4 h-4 mr-1" />
                        {upload.dislikes.length}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`/feed`, '_blank')}
                        className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View in feed"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      {!upload.isApproved && (
                        <>
                          <button
                            onClick={() => window.open(`/upload?edit=${upload._id}`, '_blank')}
                            className="p-2 text-secondary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit upload"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteUpload(upload._id)}
                            className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete upload"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filters.page === page
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}

          {uploads.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUpload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No uploads found</h3>
              <p className="text-secondary-600 mb-4">
                {filters.search || filters.status !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start sharing your environmental contributions!'
                }
              </p>
              {!filters.search && filters.status === 'all' && (
                <button
                  onClick={() => window.location.href = '/upload'}
                  className="btn-primary"
                >
                  Create Your First Upload
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default MyUploads