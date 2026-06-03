import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      // Find verification record
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !data) {
        setStatus('error')
        setMessage('Invalid or expired verification link')
        return
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setStatus('error')
        setMessage('Verification link has expired. Please register again.')
        return
      }

      // Update student as verified
      const { error: updateError } = await supabase
        .from('students')
        .update({ is_verified: true, verified_at: new Date() })
        .eq('email', data.email)

      if (updateError) {
        setStatus('error')
        setMessage('Error verifying email. Please contact support.')
        return
      }

      // Delete verification token
      await supabase.from('email_verifications').delete().eq('id', data.id)

      setStatus('success')
      setMessage('Email verified successfully! You can now login.')
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <div className="text-center p-5 bg-white rounded-4 shadow-lg" style={{ maxWidth: '500px' }}>
        {status === 'verifying' && (
          <>
            <FaSpinner className="fa-spin text-success mb-3" size={50} />
            <h3>Verifying your email...</h3>
          </>
        )}
        {status === 'success' && (
          <>
            <FaCheckCircle className="text-success mb-3" size={50} />
            <h3 className="text-success">Verification Successful!</h3>
            <p className="mt-3">{message}</p>
            <a href="/" className="btn btn-success mt-3">Go to Login</a>
          </>
        )}
        {status === 'error' && (
          <>
            <FaTimesCircle className="text-danger mb-3" size={50} />
            <h3 className="text-danger">Verification Failed</h3>
            <p className="mt-3">{message}</p>
            <a href="/" className="btn btn-primary mt-3">Back to Login</a>
          </>
        )}
      </div>
    </div>
  )
}