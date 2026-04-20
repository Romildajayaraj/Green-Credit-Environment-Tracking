import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi'
import Swal from 'sweetalert2'

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: 'admin@greencredit.com',
    password: '123456'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Admin Access Granted!',
          text: 'Welcome to the admin dashboard',
          timer: 2000,
          showConfirmButton: false
        })
        navigate('/admin')
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: result.message || 'Invalid credentials. Make sure you have created the admin user first.'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Admin user not found. Please run "npm run create-admin" first.'
      })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-glow">
            <FiShield className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
            Admin Access
          </h2>
          <p className="mt-2 text-secondary-600">Secure administrator login</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card space-y-6 border-2 border-red-100"
          onSubmit={handleSubmit}
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">Default Admin Credentials:</h3>
            <p className="text-sm text-red-700">Email: <span className="font-mono bg-red-100 px-2 py-1 rounded">admin@greencredit.com</span></p>
            <p className="text-sm text-red-700">Password: <span className="font-mono bg-red-100 px-2 py-1 rounded">123456</span></p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
              Admin Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="text"
                required
                className="input-field pl-10 border-red-200 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter admin email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pl-10 pr-10 border-red-200 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiShield className="w-5 h-5 mr-2" />
                Access Admin Panel
              </div>
            )}
          </button>

          <div className="text-center">
            <p className="text-secondary-600 text-sm">
              Need regular access?{' '}
              <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                User Login
              </a>
            </p>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Security Notice:</strong> Change default credentials in production
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminLogin