import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiMapPin, FiClock, FiAlertCircle, FiCheckCircle, FiX, FiUpload } from 'react-icons/fi'
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

const Complaints = () => {
  const [complaints, setComplaints] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: ''
  })
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [position, setPosition] = useState(null)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const response = await axios.get('/api/complaints/user')
      setComplaints(response.data)
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length > 5) {
      Swal.fire({
        icon: 'error',
        title: 'Too Many Files',
        text: 'Please select maximum 5 images'
      })
      return
    }

    const validFiles = []
    const previews = []

    files.forEach(file => {
      if (file.size > 500 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: `${file.name} is larger than 500MB`
        })
        return
      }

      validFiles.push(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        previews.push(e.target.result)
        if (previews.length === validFiles.length) {
          setImagePreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })

    setImages(validFiles)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setPosition({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error('Error getting location:', error)
          Swal.fire({
            icon: 'error',
            title: 'Location Error',
            text: 'Unable to get your current location. Please select manually on the map.'
          })
        }
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!images || images.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Images',
        text: 'Please select at least one image of the pollution issue'
      })
      return
    }

    if (!position) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Location',
        text: 'Please select the location of the issue on the map'
      })
      return
    }

    setSubmitting(true)

    const complaintData = new FormData()
    images.forEach(image => {
      complaintData.append('images', image)
    })
    complaintData.append('title', formData.title)
    complaintData.append('description', formData.description)
    complaintData.append('latitude', position.lat)
    complaintData.append('longitude', position.lng)
    complaintData.append('address', formData.address)

    try {
      await axios.post('/api/complaints', complaintData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      Swal.fire({
        icon: 'success',
        title: 'Complaint Submitted!',
        text: 'Your complaint has been sent to the pollution department.',
        timer: 3000,
        showConfirmButton: false
      })

      setShowForm(false)
      setFormData({ title: '', description: '', address: '' })
      setImages([])
      setImagePreviews([])
      setPosition(null)
      fetchComplaints()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.message || 'Something went wrong'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-5 h-5 text-yellow-500" />
      case 'in-progress':
        return <FiAlertCircle className="w-5 h-5 text-blue-500" />
      case 'resolved':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <FiX className="w-5 h-5 text-red-500" />
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Pollution Reports 🚨</h1>
            <p className="text-secondary-600 text-lg">Report environmental issues and track their resolution</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Report</span>
          </button>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-secondary-900">Report Pollution Issue</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center hover:bg-secondary-200 transition-colors duration-300"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Issue Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        className="input-field"
                        placeholder="Brief title of the pollution issue"
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
                        placeholder="Where is this issue located?"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Detailed Description *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      className="input-field"
                      placeholder="Describe the pollution issue in detail, including its impact and urgency"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Evidence Photos * (Max 5 images)
                    </label>
                    {imagePreviews.length === 0 ? (
                      <div className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors duration-300">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <FiUpload className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-secondary-900 mb-2">Upload Evidence Photos</h3>
                          <p className="text-secondary-600">Click to browse or drag and drop multiple images</p>
                          <p className="text-sm text-secondary-500 mt-1">Max 5 files, 500MB each</p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 text-left">
                            <p className="text-blue-800 text-sm font-medium mb-2">
                              Tip: Upload multiple photos for comprehensive evidence
                            </p>
                            <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                              <li>Wide-angle view of the pollution area</li>
                              <li>Close-up shots showing details</li>
                              <li>Before/after comparison if available</li>
                              <li>Different angles for better documentation</li>
                              <li>Any warning signs or pollution sources</li>
                            </ul>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = images.filter((_, i) => i !== index)
                                  const newPreviews = imagePreviews.filter((_, i) => i !== index)
                                  setImages(newImages)
                                  setImagePreviews(newPreviews)
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-300"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById('image-upload').click()}
                          className="w-full py-2 border-2 border-dashed border-secondary-300 rounded-lg text-secondary-600 hover:border-primary-400 hover:text-primary-600 transition-colors duration-300"
                        >
                          Add More Images ({imagePreviews.length}/5)
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-secondary-700">
                        Issue Location *
                      </label>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="flex items-center space-x-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-300"
                      >
                        <FiMapPin className="w-4 h-4" />
                        <span>Use Current Location</span>
                      </button>
                    </div>

                    <div className="h-64 rounded-xl overflow-hidden">
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
                      <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                        <p className="text-primary-800 font-medium">
                          Selected Location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </div>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {complaints.length > 0 ? (
            complaints.map((complaint, index) => (
              <div key={complaint._id} className="card hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                  <div className="w-full lg:w-48 mb-4 lg:mb-0">
                    {complaint.imageUrls && complaint.imageUrls.length > 0 ? (
                      <div className="space-y-2">
                        <img
                          src={complaint.imageUrls[0].startsWith('http') ? complaint.imageUrls[0] : `http://localhost:5000${complaint.imageUrls[0]}`}
                          alt={complaint.title}
                          className="w-full h-48 object-cover rounded-xl hover:scale-105 transition-transform duration-300"
                        />
                        {complaint.imageUrls.length > 1 && (
                          <div className="grid grid-cols-3 gap-1">
                            {complaint.imageUrls.slice(1, 4).map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`}
                                alt={`${complaint.title} ${index + 2}`}
                                className="w-full h-16 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                              />
                            ))}
                            {complaint.imageUrls.length > 4 && (
                              <div className="w-full h-16 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-600 text-xs font-medium">
                                +{complaint.imageUrls.length - 4} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <span className="text-secondary-500">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-secondary-900">{complaint.title}</h3>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        <span className="capitalize">{complaint.status.replace('-', ' ')}</span>
                      </div>
                    </div>

                    <p className="text-secondary-700 mb-4">{complaint.description}</p>

                    <div className="flex items-center space-x-4 text-sm text-secondary-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <FiMapPin className="w-4 h-4" />
                        <span>{complaint.location.address}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {complaint.adminResponse && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Official Response:</h4>
                        <p className="text-blue-800">{complaint.adminResponse}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        {complaint.emailSent ? (
                          <span className="flex items-center space-x-1 text-green-600 text-sm">
                            <FiCheckCircle className="w-4 h-4" />
                            <span>Email sent to authorities</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-yellow-600 text-sm">
                            <FiClock className="w-4 h-4" />
                            <span>Processing email...</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <FiAlertCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No reports yet</h3>
              <p className="text-secondary-600 mb-6">Help protect the environment by reporting pollution issues in your area</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                Submit Your First Report
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Complaints