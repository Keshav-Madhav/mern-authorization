import { motion } from 'framer-motion'

const LoginPage = () => {
  return (
    <motion.div
      className='max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      
    </motion.div>
  )
}
export default LoginPage