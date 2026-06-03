import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { 
  FaEnvelope, FaLock, FaUserGraduate, FaEye, FaEyeSlash, 
  FaSpinner, FaGraduationCap, FaShieldAlt, FaArrowRight, FaCheckCircle
} from 'react-icons/fa'
import './styles/auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  // ========== SIGN IN (works for Admin, Lecturer, Student) ==========
  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    let userRole = null

    // Step 1: Check in students table
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    
    if (studentData) {
      userRole = 'student'
    }

    // Step 2: Check in lecturers table
    if (!userRole) {
      const { data: lecturerData } = await supabase
        .from('lecturers')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      if (lecturerData) {
        userRole = 'lecturer'
      }
    }

    // Step 3: Check in admins table
    if (!userRole) {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      if (adminData) {
        userRole = 'admin'
      }
    }

    if (!userRole) {
      setError('User not found. Please sign up first.')
      setLoading(false)
      return
    }

    // Step 4: Authenticate with Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    // Step 5: Save to localStorage
    localStorage.setItem('userEmail', email)
    localStorage.setItem('userRole', userRole)
    
    // Step 5.1: Save full student details for StudentDashboard to avoid .single() race conditions
    if (userRole === 'student' && studentData) {
      localStorage.setItem('studentData', JSON.stringify(studentData))
    } else {
      localStorage.removeItem('studentData')
    }
    
    // Step 6: Log login event
    try {
      await supabase.from('audit_logs').insert([{ 
        action: 'LOGIN', 
        admin_email: email, 
        details: `${email} logged in as ${userRole}`, 
        created_at: new Date().toISOString() 
      }])
    } catch (logErr) {
      console.error('Error logging login:', logErr)
    }
    
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    setSuccess(`Login successful! Redirecting...`)
    
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  }

  // ========== SIGN UP (Student only) ==========
  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Check if email already exists in students table
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingStudent) {
      setError('Email already registered. Please login.')
      setLoading(false)
      return
    }

    // Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Add to students table
    const { error: insertError } = await supabase
      .from('students')
      .insert([{
        user_id: authData.user?.id,
        full_name: fullName,
        email: email,
        student_id: 'STU' + Date.now(),
        year: 1,
        is_active: true
      }])

    if (insertError) {
      console.error('Error saving student:', insertError)
    }

    setSuccess('Account created successfully! You can now login.')
    
    setTimeout(() => {
      setIsSignUp(false)
      setFullName('')
      setEmail('')
      setPassword('')
      setSuccess('')
    }, 2000)
    
    setLoading(false)
  }

  const handleSubmit = (e) => {
    if (isSignUp) {
      handleSignUp(e)
    } else {
      handleSignIn(e)
    }
  }

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      
      <div className="container min-vh-100 d-flex align-items-center justify-content-center" style={{ position: 'relative', zIndex: 10 }}>
        <div className="row justify-content-center w-100">
          <div className="col-12 col-lg-8 col-xl-7">
            
            <div className="premium-wrapper">
              
              {/* Left Side - Brand Section */}
              <div className="premium-left">
                <div className="brand-content">
                  <div className="brand-logo">
                    <div className="logo-icon">
                      <FaGraduationCap size={32} />
                    </div>
                    <h1 className="brand-name">CampusBoard</h1>
                  </div>
                  
                  <h2 className="brand-tagline">Welcome Back!</h2>
                  
                  <p className="brand-description">
                    Your central hub for academic notices, announcements, and campus updates.
                  </p>
                  
                  <div className="trust-badge">
                    <FaShieldAlt className="me-1" />
                    <span>Secure Academic Platform</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Login Card */}
              <div className="premium-right">
                <div className="premium-card">
                  
                  <div className="card-header">
                    <div className="header-badge">
                      {isSignUp ? 'Student Registration' : 'Sign In'}
                    </div>
                  </div>
                  
                  {error && (
                    <div className="error-alert">
                      <span>⚠️</span> {error}
                      <button onClick={() => setError('')}>✕</button>
                    </div>
                  )}
                  
                  {success && (
                    <div className="success-alert">
                      <FaCheckCircle /> {success}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    {isSignUp && (
                      <div className="input-group-premium">
                        <FaUserGraduate className="input-icon" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    
                    <div className="input-group-premium">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="input-group-premium">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    
                    {!isSignUp && (
                      <div className="form-options">
                        <label className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span>Remember me</span>
                        </label>
                        <button 
                          type="button"
                          className="forgot-link"
                          onClick={() => { window.location.href = '/forgot-password' }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="submit-btn"
                    >
                      {loading ? (
                        <><FaSpinner className="fa-spin me-2" /> Processing...</>
                      ) : (
                        <>{isSignUp ? 'Sign Up as Student' : 'Sign In'} <FaArrowRight className="ms-2" size={14} /></>
                      )}
                    </button>
                  </form>
                  
                  <div className="footer-link">
                    {isSignUp ? (
                      <p>
                        Already have an account?{' '}
                        <button onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}>
                          Sign In
                        </button>
                      </p>
                    ) : (
                      <p>
                        Don't have an account?{' '}
                        <button onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}>
                          Sign Up as Student
                        </button>
                      </p>
                    )}
                  </div>
                  
                  <div className="security-note">
                    <FaShieldAlt size={12} className="me-1" />
                    <span>Secure Login • Lecturers contact admin for accounts</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="premium-footer">
              <p>© 2024 CampusBoard — Official Academic Notice System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}