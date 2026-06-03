import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import {
  FaEnvelope, FaLock, FaGraduationCap, FaShieldAlt,
  FaSpinner, FaArrowRight, FaCheckCircle, FaEye, FaEyeSlash
} from 'react-icons/fa'
import './styles/auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })
    if (window.location.hash.includes('type=recovery')) setRecoveryMode(true)
    return () => subscription.unsubscribe()
  }, [])

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    })
    if (error) setError(error.message)
    else setSuccess('Reset link sent! Check your inbox and spam folder.')
    setLoading(false)
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError(error.message)
    else {
      setSuccess('Password updated! Redirecting to login...')
      await supabase.auth.signOut()
      setTimeout(() => { window.location.href = '/' }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-overlay"></div>

      <div className="container min-vh-100 d-flex align-items-center justify-content-center" style={{ position: 'relative', zIndex: 10 }}>
        <div className="row justify-content-center w-100">
          <div className="col-12 col-lg-8 col-xl-7">
            <div className="premium-wrapper">
              <div className="premium-left">
                <div className="brand-content">
                  <div className="brand-logo">
                    <div className="logo-icon"><FaGraduationCap size={32} /></div>
                    <h1 className="brand-name">CampusBoard</h1>
                  </div>
                  <h2 className="brand-tagline">
                    {recoveryMode ? 'Create new password' : 'Reset your password'}
                  </h2>
                  <p className="brand-description">
                    {recoveryMode
                      ? 'Choose a strong password to secure your account.'
                      : 'Enter your registered email. We will send you a secure link to reset your password.'}
                  </p>
                  <div className="trust-badge">
                    <FaShieldAlt className="me-1" />
                    <span>Secure Academic Platform</span>
                  </div>
                </div>
              </div>

              <div className="premium-right">
                <div className="premium-card">
                  <div className="card-header">
                    <div className="header-badge">
                      {recoveryMode ? 'New Password' : 'Password Recovery'}
                    </div>
                  </div>

                  {error && (
                    <div className="error-alert">
                      <span>⚠️</span> {error}
                      <button type="button" onClick={() => setError('')}>✕</button>
                    </div>
                  )}
                  {success && (
                    <div className="success-alert">
                      <FaCheckCircle /> {success}
                    </div>
                  )}

                  {recoveryMode ? (
                    <form onSubmit={handleUpdatePassword}>
                      <div className="input-group-premium">
                        <FaLock className="input-icon" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <div className="input-group-premium">
                        <FaLock className="input-icon" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? <><FaSpinner className="fa-spin me-2" /> Updating...</> : <>Update Password <FaArrowRight className="ms-2" size={14} /></>}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSendEmail}>
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
                      <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? <><FaSpinner className="fa-spin me-2" /> Sending...</> : <>Send Reset Link <FaArrowRight className="ms-2" size={10} /></>}
                      </button>
                    </form>
                  )}

                  {!recoveryMode && (
                    <p className="auth-reset-helper">
                      Use the email linked to your CampusBoard account.
                    </p>
                  )}

                  <div className="text-center mt-4">
                    <a href="/" className="back-link">← Back to Login</a>
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