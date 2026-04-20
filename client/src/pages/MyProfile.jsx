import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCamera, FiEdit3, FiSave, FiX, 
  FiLock, FiShield, FiDownload, FiTrash2, FiEye, FiEyeOff, FiAward,
  FiCalendar, FiTrendingUp, FiHeart, FiMessageCircle, FiUpload, FiCheck
} from 'react-icons/fi'
import axios from 'axios'
import Swal from 'sweetalert2'

const MyProfile = () => {
  const { user, logout, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me')
      setProfile(response.data)
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        bio: response.data.bio || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      Swal.fire('Error', 'Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'Image size must be less than 5MB', 'error')
      return
    }

    const formData = new FormData()
    formData.append('profileImage', file)

    try {
      const response = await axios.post('/api/profile/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setProfile(prev => ({
        ...prev,
        profileImage: response.data.profileImage
      }))
      
      // Refresh user context to update profile image everywhere
      await refreshUser()
      
      Swal.fire('Success', 'Profile image updated successfully', 'success')
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to upload image', 'error')
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await axios.put('/api/profile/update', formData)
      setProfile(prev => ({ ...prev, ...response.data.user }))
      setEditing(false)
      Swal.fire('Success', 'Profile updated successfully', 'success')
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update profile', 'error')
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire('Error', 'New passwords do not match', 'error')
      return
    }

    try {
      await axios.put('/api/profile/change-password', passwordData)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setChangingPassword(false)
      Swal.fire('Success', 'Password changed successfully', 'success')
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to change password', 'error')
    }
  }

  const handleDownloadData = async () => {
    try {
      const response = await axios.get('/api/profile/download-data', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `account-data-${profile.name}-${Date.now()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      Swal.fire('Success', 'Account data downloaded successfully', 'success')
    } catch (error) {
      Swal.fire('Error', 'Failed to download account data', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    const { value: password } = await Swal.fire({
      title: 'Delete Account',
      html: `
        <p class="mb-4 text-red-600">This action cannot be undone. All your data will be permanently deleted.</p>
        <input id="password" type="password" class="swal2-input" placeholder="Enter your password">
        <input id="confirm" type="text" class="swal2-input" placeholder="Type 'DELETE' to confirm">
      `,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete Account',
      preConfirm: () => {
        const password = document.getElementById('password').value
        const confirm = document.getElementById('confirm').value
        if (!password || confirm !== 'DELETE') {
          Swal.showValidationMessage('Please enter your password and type DELETE to confirm')
          return false
        }
        return { password, confirmDelete: confirm }
      }
    })

    if (password) {
      try {
        await axios.delete('/api/profile/delete-account', {
          data: password
        })
        
        Swal.fire('Account Deleted', 'Your account has been permanently deleted', 'success')
        logout()
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete account', 'error')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">My Profile</h1>
            <p className="text-secondary-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="card text-center">
                {/* Profile Image */}
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold mx-auto">
                    {profile.profileImage ? (
                      <img
                        src={`http://localhost:5000${profile.profileImage}`}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-colors"
                    title="Change profile picture"
                  >
                    <FiCamera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <h2 className="text-2xl font-bold text-secondary-900 mb-2">{profile.name}</h2>
                <p className="text-secondary-600 mb-4">{profile.email}</p>
                
                {profile.bio && (
                  <p className="text-sm text-secondary-700 mb-4 italic">"{profile.bio}"</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mx-auto mb-2">
                      <FiAward className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{profile.creditScore}</p>
                    <p className="text-xs text-secondary-600">Credits</p>
                    <p className="text-xs text-secondary-500">Rank #{profile.stats.rank}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-2">
                      <FiUpload className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{profile.stats.totalUploads}</p>
                    <p className="text-xs text-secondary-600">Uploads</p>
                    <p className="text-xs text-secondary-500">{profile.stats.approvalRate}% approved</p>
                  </div>
                </div>

                <div className="flex items-center justify-center text-sm text-secondary-600 mb-4">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  Joined {formatDate(profile.stats.joinDate)}
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Personal Information */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-secondary-900">Personal Information</h3>
                  <button
                    onClick={() => editing ? setEditing(false) : setEditing(true)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      editing 
                        ? 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200' 
                        : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                    }`}
                  >
                    {editing ? <FiX className="w-4 h-4" /> : <FiEdit3 className="w-4 h-4" />}
                    <span>{editing ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <FiUser className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-secondary-900 py-2">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <FiMail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="text-secondary-900 py-2">{profile.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <FiPhone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-secondary-900 py-2">{profile.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <FiMapPin className="w-4 h-4 inline mr-2" />
                      Address
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-secondary-900 py-2">{profile.address}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Bio
                    </label>
                    {editing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="input-field h-24 resize-none"
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                      />
                    ) : (
                      <p className="text-secondary-900 py-2">{profile.bio || 'No bio added yet'}</p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveProfile}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Security Settings */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-secondary-900">Security Settings</h3>
                  <button
                    onClick={() => setChangingPassword(!changingPassword)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <FiLock className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                </div>

                {changingPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 mb-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                          {showPassword.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                          {showPassword.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                          {showPassword.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setChangingPassword(false)}
                        className="px-4 py-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        className="btn-primary"
                      >
                        Update Password
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FiShield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Account Security</p>
                      <p className="text-sm text-green-700">Your account is secure and verified</p>
                    </div>
                  </div>
                  <FiCheck className="w-5 h-5 text-green-600" />
                </div>
              </div>

              {/* Account Management */}
              
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default MyProfile