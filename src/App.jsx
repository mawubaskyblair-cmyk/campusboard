import { useState, useEffect } from 'react'
import Login from './Login'
import StudentDashboard from './StudentDashboard'
import LecturerDashboard from './LecturerDashboard'
import AdminPanel from './AdminPanel'
import VerifyEmail from './VerifyEmail'
import ForgotPassword from './ForgotPassword'
import { supabase } from './lib/supabase'

function App() {
  const [userEmail, setUserEmail] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const role = localStorage.getItem('userRole')

    if (email && role) {
      setUserEmail(email)
      setUserRole(role)
    }
    setLoading(false)
  }, [])

  const handleLogout = async () => {
    // Log logout event
    const email = localStorage.getItem('userEmail')
    const role = localStorage.getItem('userRole')
    
    if (email) {
      try {
        await supabase.from('audit_logs').insert([{ 
          action: 'LOGOUT', 
          admin_email: email, 
          details: `${email} (${role || 'unknown'}) logged out`, 
          created_at: new Date().toISOString() 
        }])
      } catch (logErr) {
        console.error('Error logging logout:', logErr)
      }
    }

    await supabase.auth.signOut()

    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('studentData')
    localStorage.removeItem('rememberedEmail')

    setUserEmail(null)
    setUserRole(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-xl">Loading CampusBoard...</p>
        </div>
      </div>
    )
  }

  if (window.location.pathname === '/verify-email') {
    return <VerifyEmail />
  }

  if (window.location.pathname === '/forgot-password') {
    return <ForgotPassword />
  }

  if (!userEmail) {
    return <Login />
  }

  if (userRole === 'admin') {
    return <AdminPanel onLogout={handleLogout} />
  }

  if (userRole === 'lecturer') {
    return <LecturerDashboard onLogout={handleLogout} user={{ email: userEmail }} />
  }

  if (userRole === 'student') {
    return <StudentDashboard onLogout={handleLogout} user={{ email: userEmail }} />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-red-600 text-lg">User role not found. Please contact admin.</p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go back to Login
        </button>
      </div>
    </div>
  )
}

export default App
