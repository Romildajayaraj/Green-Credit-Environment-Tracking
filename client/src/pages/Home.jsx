import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUpload, FiTrendingUp, FiAward, FiMessageSquare, FiUsers, FiStar } from 'react-icons/fi'

const Home = () => {
  const features = [
    {
      icon: FiUpload,
      title: 'Upload Green Content',
      description: 'Share your environmental activities and earn credits for making a positive impact'
    },
    {
      icon: FiTrendingUp,
      title: 'Track Progress',
      description: 'Monitor your green credit score and see your environmental contribution grow'
    },
    {
      icon: FiAward,
      title: 'Compete & Win',
      description: 'Climb the leaderboard and get recognized for your environmental efforts'
    },
    {
      icon: FiMessageSquare,
      title: 'Report Issues',
      description: 'Report pollution and environmental issues directly to authorities'
    },
    {
      icon: FiUsers,
      title: 'Community',
      description: 'Connect with like-minded individuals working towards a greener future'
    },
    {
      icon: FiStar,
      title: 'Make Impact',
      description: 'Every action counts towards building a sustainable and cleaner environment'
    }
  ]

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2322c55e%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="gradient-text">Green Credit</span>
                <br />
                <span className="text-secondary-800">Tracker</span>
              </h1>
              <p className="text-xl md:text-2xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
                Transform your environmental actions into measurable impact. Upload, share, and earn credits for making our planet greener.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Get Started Today
              </Link>
              <Link to="/feed" className="btn-secondary text-lg px-8 py-4">
                Explore Feed
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              <div className="w-64 h-64 mx-auto bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-float shadow-2xl flex items-center justify-center">
                <span className="text-8xl">🌍</span>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-bounce-slow flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse-slow flex items-center justify-center">
                <span className="text-xl">🌱</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Join thousands of environmental enthusiasts making a real difference
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card group hover:scale-105"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-6 group-hover:animate-glow transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join our community today and start earning credits for your environmental contributions
            </p>
            <Link 
              to="/register" 
              className="inline-block bg-white text-primary-600 font-bold py-4 px-8 rounded-xl hover:bg-primary-50 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Start Your Green Journey
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <div className="text-4xl font-bold text-primary-400 mb-2">10K+</div>
              <div className="text-secondary-300">Active Users</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <div className="text-4xl font-bold text-primary-400 mb-2">50K+</div>
              <div className="text-secondary-300">Green Actions</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <div className="text-4xl font-bold text-primary-400 mb-2">1M+</div>
              <div className="text-secondary-300">Credits Earned</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <div className="text-4xl font-bold text-primary-400 mb-2">500+</div>
              <div className="text-secondary-300">Issues Resolved</div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home