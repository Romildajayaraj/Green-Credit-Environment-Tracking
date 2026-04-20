import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUpload, FiMapPin, FiImage, FiVideo, FiX } from 'react-icons/fi'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import axios from 'axios'
import Swal from 'sweetalert2'

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: ''
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 500 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select a file smaller than 500MB'
        })
        return
      }

      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(selectedFile)
    }
  }

  const getCurrentLocation = () => {
    setUseCurrentLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setPosition({ lat: latitude, lng: longitude })
          setUseCurrentLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          Swal.fire({
            icon: 'error',
            title: 'Location Error',
            text: 'Unable to get your current location. Please select manually on the map.'
          })
          setUseCurrentLocation(false)
        }
      )
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Location Not Supported',
        text: 'Geolocation is not supported by this browser.'
      })
      setUseCurrentLocation(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      Swal.fire({
        icon: 'error',
        title: 'Missing File',
        text: 'Please select an image or video to upload'
      })
      return
    }

    if (!position) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Location',
        text: 'Please select a location on the map'
      })
      return
    }

    setLoading(true)

    const uploadData = new FormData()
    uploadData.append('media', file)
    uploadData.append('title', formData.title)
    uploadData.append('description', formData.description)
    uploadData.append('latitude', position.lat)
    uploadData.append('longitude', position.lng)
    uploadData.append('address', formData.address)

    try {
      await axios.post('/api/uploads', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        text: 'Your content has been uploaded and is pending approval.',
        timer: 3000,
        showConfirmButton: false
      })

      navigate('/dashboard')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.message || 'Something went wrong'
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Share Your Green Activity 🌱</h1>
          <p className="text-secondary-600 text-lg">Upload your environmental contributions and earn credits</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <div className="card">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Content Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="input-field"
                  placeholder="Give your upload a catchy title"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Location Address *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  className="input-field"
                  placeholder="Enter the location address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                className="input-field"
                placeholder="Describe your green activity and its environmental impact"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Media Upload</h2>
            
            {!preview ? (
              <div className="border-2 border-dashed border-secondary-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors duration-300">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FiUpload className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">Upload Image or Video</h3>
                  <p className="text-secondary-600">Click to browse or drag and drop</p>
                  <p className="text-sm text-secondary-500 mt-2">Max file size: 500MB</p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="rounded-xl overflow-hidden">
                  {file?.type.startsWith('image/') ? (
                    <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                  ) : (
                    <video src={preview} controls className="w-full h-64 object-cover" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-300"
                >
                  <FiX className="w-4 h-4" />
                </button>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {file?.type.startsWith('image/') ? (
                      <FiImage className="w-5 h-5 text-primary-600" />
                    ) : (
                      <FiVideo className="w-5 h-5 text-primary-600" />
                    )}
                    <span className="text-secondary-700 font-medium">{file?.name}</span>
                  </div>
                  <span className="text-sm text-secondary-500">
                    {(file?.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-900">Select Location</h2>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={useCurrentLocation}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-300 disabled:opacity-50"
              >
                <FiMapPin className="w-4 h-4" />
                <span>{useCurrentLocation ? 'Getting Location...' : 'Use Current Location'}</span>
              </button>
            </div>

            <div className="h-96 rounded-xl overflow-hidden">
              <MapContainer
                center={position || [51.505, -0.09]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>

            {position && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <p className="text-primary-800 font-medium">
                  Selected Location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center">
                  <FiUpload className="w-5 h-5 mr-2" />
                  Upload Content
                </div>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}

export default Upload