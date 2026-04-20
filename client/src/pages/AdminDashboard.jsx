import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUsers, FiUpload, FiMessageSquare, FiTrendingUp, FiCheckCircle, FiX, FiEye, FiSearch, FiFilter, FiMapPin } from 'react-icons/fi'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import axios from 'axios'
import Swal from 'sweetalert2'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardStats, setDashboardStats] = useState({})
  const [users, setUsers] = useState([])
  const [pendingUploads, setPendingUploads] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'uploads') fetchPendingUploads()
    if (activeTab === 'complaints') fetchComplaints()
  }, [activeTab])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard')
      setDashboardStats(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/admin/users?search=${searchTerm}`)
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPendingUploads = async () => {
    try {
      const response = await axios.get('/api/admin/uploads/pending')
      setPendingUploads(response.data)
    } catch (error) {
      console.error('Error fetching pending uploads:', error)
    }
  }

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`/api/admin/complaints?status=${statusFilter}`)
      setComplaints(response.data.complaints)
    } catch (error) {
      console.error('Error fetching complaints:', error)
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`/api/admin/users/${userId}/details`)
      setSelectedUser(response.data)
      setShowUserModal(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
      Swal.fire('Error', 'Failed to fetch user details', 'error')
    }
  }

  const awardCredits = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Award Credits',
      html: `
        <input id="credits" type="number" class="swal2-input" placeholder="Credits to award" min="1">
        <input id="reason" type="text" class="swal2-input" placeholder="Reason (optional)">
      `,
      showCancelButton: true,
      confirmButtonText: 'Award Credits',
      preConfirm: () => {
        const credits = document.getElementById('credits').value
        const reason = document.getElementById('reason').value
        if (!credits || credits <= 0) {
          Swal.showValidationMessage('Please enter a valid number of credits')
          return false
        }
        return { credits: parseInt(credits), reason }
      }
    })

    if (formValues) {
      try {
        await axios.post('/api/admin/award-credits', {
          userId: selectedUser._id,
          credits: formValues.credits,
          reason: formValues.reason
        })
        fetchUsers()
        fetchUserDetails(selectedUser._id) // Refresh user details
        Swal.fire('Success', `Awarded ${formValues.credits} credits successfully`, 'success')
      } catch (error) {
        console.error('Error awarding credits:', error)
        Swal.fire('Error', 'Failed to award credits', 'error')
      }
    }
  }

  const approveUpload = async (uploadId, creditPoints = 10) => {
    try {
      await axios.put(`/api/admin/uploads/${uploadId}/approve`, { creditPoints })
      Swal.fire({
        icon: 'success',
        title: 'Upload Approved!',
        text: `Upload approved with ${creditPoints} credits`,
        timer: 2000,
        showConfirmButton: false
      })
      fetchPendingUploads()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to approve upload'
      })
    }
  }

  const deleteUpload = async (uploadId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This upload will be permanently deleted',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/admin/uploads/${uploadId}`)
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Upload has been deleted',
          timer: 2000,
          showConfirmButton: false
        })
        fetchPendingUploads()
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete upload'
        })
      }
    }
  }

  const updateComplaintStatus = async (complaintId, status, adminResponse = '') => {
    try {
      await axios.put(`/api/admin/complaints/${complaintId}/status`, { status, adminResponse })
      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: 'Complaint status has been updated',
        timer: 2000,
        showConfirmButton: false
      })
      fetchComplaints()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update complaint status'
      })
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: dashboardStats.totalUsers || 0,
      icon: FiUsers,
      color: 'from-blue-400 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Total Uploads',
      value: dashboardStats.totalUploads || 0,
      icon: FiUpload,
      color: 'from-green-400 to-green-600',
      change: '+8%'
    },
    {
      title: 'Pending Uploads',
      value: dashboardStats.pendingUploads || 0,
      icon: FiTrendingUp,
      color: 'from-yellow-400 to-yellow-600',
      change: '-5%'
    },
    {
      title: 'Total Complaints',
      value: dashboardStats.totalComplaints || 0,
      icon: FiMessageSquare,
      color: 'from-red-400 to-red-600',
      change: '+3%'
    }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiTrendingUp },
    { id: 'users', name: 'Users', icon: FiUsers },
    { id: 'uploads', name: 'Uploads', icon: FiUpload },
    { id: 'complaints', name: 'Complaints', icon: FiMessageSquare }
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard 👑</h1>
          <p className="text-secondary-600 text-lg">Manage users, content, and environmental reports</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <p className="text-3xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                      <p className="text-green-600 text-sm mt-1">{stat.change} from last month</p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center group-hover:animate-glow`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('uploads')}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <FiUpload className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Review Pending Uploads</span>
                    </div>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-sm">
                      {dashboardStats.pendingUploads || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <FiMessageSquare className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">Handle Complaints</span>
                    </div>
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm">
                      {dashboardStats.pendingComplaints || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <FiUsers className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Manage Users</span>
                    </div>
                    <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {dashboardStats.totalUsers || 0}
                    </span>
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-medium">Upload Approved</p>
                      <p className="text-green-600 text-sm">Tree planting activity by John Doe</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <FiUsers className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-blue-800 font-medium">New User Registered</p>
                      <p className="text-blue-600 text-sm">Jane Smith joined the platform</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <FiMessageSquare className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-yellow-800 font-medium">New Complaint</p>
                      <p className="text-yellow-600 text-sm">Pollution report from downtown area</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">User Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="btn-primary"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Credits</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Uploads</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                              {user.profileImage ? (
                                <img
                                  src={`http://localhost:5000${user.profileImage}`}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                user.name?.charAt(0)
                              )}
                            </div>
                            <span className="font-medium text-secondary-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-secondary-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm font-medium">
                            {user.creditScore}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-secondary-600">{user.uploads?.length || 0}</td>
                        <td className="py-3 px-4 text-secondary-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            onClick={() => fetchUserDetails(user._id)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'uploads' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="card">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">Pending Upload Approvals</h2>
              
              {pendingUploads.length > 0 ? (
                <div className="space-y-6">
                  {pendingUploads.map((upload) => (
                    <div key={upload._id} className="border border-secondary-200 rounded-xl p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                        <div className="w-full lg:w-64 h-48 rounded-xl overflow-hidden mb-4 lg:mb-0">
                          {upload.mediaType === 'image' ? (
                            <img
                              src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                              alt={upload.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `http://localhost:5000${upload.mediaUrl}`}
                              controls
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-secondary-900 mb-2">{upload.title}</h3>
                          <p className="text-secondary-700 mb-4">{upload.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-secondary-600 mb-4">
                            <span>By: {upload.user?.name}</span>
                            <span>�</span>
                            <span>{upload.location.address}</span>
                            <span>�</span>
                            <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <FiMapPin className="w-4 h-4 text-primary-600" />
                              <span className="text-sm font-medium text-secondary-700">Upload Location</span>
                            </div>
                            <div className="h-48 rounded-lg overflow-hidden border border-secondary-200">
                              <MapContainer
                                center={[upload.location.latitude, upload.location.longitude]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                              >
                                <TileLayer
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[upload.location.latitude, upload.location.longitude]} />
                              </MapContainer>
                            </div>
                            <p className="text-xs text-secondary-500 mt-2">
                              Coordinates: {upload.location.latitude.toFixed(6)}, {upload.location.longitude.toFixed(6)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => approveUpload(upload._id, 10)}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              <span>Approve (10 credits)</span>
                            </button>
                            <button
                              onClick={() => approveUpload(upload._id, 20)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              <span>High Impact (20 credits)</span>
                            </button>
                            <button
                              onClick={() => deleteUpload(upload._id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
                            >
                              <FiX className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">All caught up!</h3>
                  <p className="text-secondary-600">No pending uploads to review.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'complaints' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">Complaint Management</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={fetchComplaints}
                    className="btn-primary"
                  >
                    <FiFilter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              {complaints.length > 0 ? (
                <div className="space-y-6">
                  {complaints.map((complaint) => (
                    <div key={complaint._id} className="border border-secondary-200 rounded-xl p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                        <div className="w-full lg:w-64 mb-4 lg:mb-0">
                          {complaint.imageUrls && complaint.imageUrls.length > 0 ? (
                            <div className="space-y-2">
                              <img
                                src={complaint.imageUrls[0].startsWith('http') ? complaint.imageUrls[0] : `http://localhost:5000${complaint.imageUrls[0]}`}
                                alt={complaint.title}
                                className="w-full h-48 object-cover rounded-xl"
                              />
                              {complaint.imageUrls.length > 1 && (
                                <div className="grid grid-cols-3 gap-1">
                                  {complaint.imageUrls.slice(1, 4).map((imageUrl, index) => (
                                    <img
                                      key={index}
                                      src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`}
                                      alt={`${complaint.title} ${index + 2}`}
                                      className="w-full h-16 object-cover rounded-lg"
                                    />
                                  ))}
                                  {complaint.imageUrls.length > 4 && (
                                    <div className="w-full h-16 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-600 text-xs font-medium">
                                      +{complaint.imageUrls.length - 4}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-secondary-100 rounded-xl flex items-center justify-center">
                              <span className="text-secondary-500">No images</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-secondary-900">{complaint.title}</h3>
                            <select
                              value={complaint.status}
                              onChange={(e) => updateComplaintStatus(complaint._id, e.target.value)}
                              className="px-3 py-1 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          
                          <p className="text-secondary-700 mb-4">{complaint.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-secondary-600 mb-4">
                            <span>By: {complaint.user?.name}</span>
                            <span>•</span>
                            <span>{complaint.location.address}</span>
                            <span>•</span>
                            <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <FiMapPin className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-secondary-700">Complaint Location</span>
                            </div>
                            <div className="h-48 rounded-lg overflow-hidden border border-secondary-200">
                              <MapContainer
                                center={[complaint.location.latitude, complaint.location.longitude]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                              >
                                <TileLayer
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[complaint.location.latitude, complaint.location.longitude]} />
                              </MapContainer>
                            </div>
                            <p className="text-xs text-secondary-500 mt-2">
                              Coordinates: {complaint.location.latitude.toFixed(6)}, {complaint.location.longitude.toFixed(6)}
                            </p>
                          </div>

                          {complaint.adminResponse && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                              <h4 className="font-medium text-blue-900 mb-1">Admin Response:</h4>
                              <p className="text-blue-800">{complaint.adminResponse}</p>
                            </div>
                          )}

                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Add Response',
                                  input: 'textarea',
                                  inputPlaceholder: 'Enter your response...',
                                  showCancelButton: true,
                                  confirmButtonText: 'Send Response'
                                }).then((result) => {
                                  if (result.isConfirmed && result.value) {
                                    updateComplaintStatus(complaint._id, complaint.status, result.value)
                                  }
                                })
                              }}
                              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
                            >
                              <FiMessageSquare className="w-4 h-4" />
                              <span>Add Response</span>
                            </button>
                           
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiMessageSquare className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">No complaints found</h3>
                  <p className="text-secondary-600">No complaints match your current filter.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* User Profile Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-secondary-900">User Profile Details</h2>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Info */}
                  <div className="lg:col-span-1">
                    <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 overflow-hidden">
                        {selectedUser.profileImage ? (
                          <img
                            src={`http://localhost:5000${selectedUser.profileImage}`}
                            alt={selectedUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          selectedUser.name?.charAt(0)
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-secondary-900">{selectedUser.name}</h3>
                      <p className="text-secondary-600">{selectedUser.email}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="space-y-4">
                      <div className="bg-primary-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-primary-700 font-medium">Credits</span>
                          <span className="text-2xl font-bold text-primary-600">{selectedUser.creditScore}</span>
                        </div>
                        <p className="text-sm text-primary-600 mt-1">Rank #{selectedUser.stats?.rank || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700 font-medium">Uploads</span>
                          <span className="text-2xl font-bold text-green-600">{selectedUser.stats?.totalUploads || 0}</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">{selectedUser.stats?.approvedUploads || 0} approved</p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 font-medium">Complaints</span>
                          <span className="text-2xl font-bold text-blue-600">{selectedUser.stats?.totalComplaints || 0}</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">Environmental reports</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6">
                      
                    </div>
                  </div>

                  {/* Detailed Info */}
                  <div className="lg:col-span-2">
                    <div className="space-y-6">
                      {/* User Details */}
                      <div>
                        <h4 className="text-lg font-bold text-secondary-900 mb-4">User Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-secondary-500">Full Name</label>
                            <p className="text-secondary-900">{selectedUser.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-secondary-500">Email Address</label>
                            <p className="text-secondary-900">{selectedUser.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-secondary-500">Phone Number</label>
                            <p className="text-secondary-900">{selectedUser.phone}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-secondary-500">Join Date</label>
                            <p className="text-secondary-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-secondary-500">Address</label>
                            <p className="text-secondary-900">{selectedUser.address}</p>
                          </div>
                          {selectedUser.bio && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-secondary-500">Bio</label>
                              <p className="text-secondary-900">{selectedUser.bio}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* All Uploads */}
                      <div>
                        <h4 className="text-lg font-bold text-secondary-900 mb-4">
                          All Uploads ({selectedUser.allUploads?.length || 0})
                        </h4>
                        {selectedUser.allUploads && selectedUser.allUploads.length > 0 ? (
                          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                            {selectedUser.allUploads.map((upload) => (
                              <div key={upload._id} className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-secondary-900">{upload.title}</h5>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    upload.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {upload.isApproved ? `Approved (+${upload.creditPoints} credits)` : 'Pending'}
                                  </span>
                                </div>
                                <p className="text-sm text-secondary-600 mb-3">{upload.description}</p>
                                {upload.mediaUrl && (
                                  <div className="mb-3">
                                    {upload.mediaType === 'image' ? (
                                      <img
                                        src={`http://localhost:5000${upload.mediaUrl}`}
                                        alt={upload.title}
                                        className="w-full max-w-xs h-32 object-cover rounded-lg cursor-pointer"
                                        onClick={() => window.open(`http://localhost:5000${upload.mediaUrl}`, '_blank')}
                                      />
                                    ) : upload.mediaType === 'video' ? (
                                      <video
                                        src={`http://localhost:5000${upload.mediaUrl}`}
                                        className="w-full max-w-xs h-32 object-cover rounded-lg"
                                        controls
                                      />
                                    ) : null}
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-xs text-secondary-500">
                                  <span>Location: {upload.location?.address || 'Not specified'}</span>
                                  <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-4 mt-2 text-xs">
                                  <span className="flex items-center text-red-600">
                                    Likes: {upload.likes?.length || 0}
                                  </span>
                                  <span className="flex items-center text-blue-600">
                                    Comments: {upload.comments?.length || 0}
                                  </span>
                                  <span className="flex items-center text-gray-600">
                                    Dislikes: {upload.dislikes?.length || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-secondary-500">No uploads yet</p>
                        )}
                      </div>

                      {/* All Complaints */}
                      <div>
                        <h4 className="text-lg font-bold text-secondary-900 mb-4">
                          All Complaints ({selectedUser.allComplaints?.length || 0})
                        </h4>
                        {selectedUser.allComplaints && selectedUser.allComplaints.length > 0 ? (
                          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                            {selectedUser.allComplaints.map((complaint) => (
                              <div key={complaint._id} className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-secondary-900">{complaint.title}</h5>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                    complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    complaint.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {complaint.status}
                                  </span>
                                </div>
                                <p className="text-sm text-secondary-600 mb-3">{complaint.description}</p>
                                {complaint.images && complaint.images.length > 0 && (
                                  <div className="mb-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      {complaint.images.slice(0, 4).map((image, index) => (
                                        <img
                                          key={index}
                                          src={`http://localhost:5000${image}`}
                                          alt={`Complaint evidence ${index + 1}`}
                                          className="w-full h-20 object-cover rounded cursor-pointer"
                                          onClick={() => window.open(`http://localhost:5000${image}`, '_blank')}
                                        />
                                      ))}
                                    </div>
                                    {complaint.images.length > 4 && (
                                      <p className="text-xs text-secondary-500 mt-1">
                                        +{complaint.images.length - 4} more images
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-xs text-secondary-500">
                                  <span>Location: {complaint.location?.address || 'Not specified'}</span>
                                  <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                </div>
                                {complaint.adminResponse && (
                                  <div className="mt-3 p-2 bg-blue-50 border-l-2 border-blue-400 rounded-r">
                                    <p className="text-xs font-medium text-blue-900">Admin Response:</p>
                                    <p className="text-xs text-blue-800">{complaint.adminResponse}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-secondary-500">No complaints filed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard