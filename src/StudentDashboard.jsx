import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from './lib/supabase'
import { 
  FaBell, FaBook, FaSearch, FaEye, FaCheckCircle, 
  FaGraduationCap, FaSignOutAlt, 
  FaSpinner, FaClock, 
  FaEnvelope, FaPhone, 
  FaEdit, FaSave, FaTimes, FaCamera, FaUserGraduate,
  FaUniversity, FaShareAlt, FaBellSlash, FaBell as FaBellActive,
  FaWhatsapp, FaTelegram, FaEnvelope as FaEnvelopeIcon,
  FaFilePdf, FaPaperclip, FaVolumeUp, FaHome
} from 'react-icons/fa'
import { jsPDF } from 'jspdf'

// Course Colors
const courseColors = [
  { bg: '#EF4444', light: '#FEE2E2', text: '#991B1B' },
  { bg: '#3B82F6', light: '#DBEAFE', text: '#1E40AF' },
  { bg: '#10B981', light: '#D1FAE5', text: '#065F46' },
  { bg: '#F59E0B', light: '#FEF3C7', text: '#92400E' },
  { bg: '#8B5CF6', light: '#EDE9FE', text: '#5B21B6' },
  { bg: '#EC4899', light: '#FCE7F3', text: '#BE185D' },
  { bg: '#06B6D4', light: '#CFFAFE', text: '#164E63' },
  { bg: '#F97316', light: '#FFEDD5', text: '#9A3412' },
]

export default function StudentDashboard({ onLogout, user }) {
  // ========== STATE ==========
  const [student, setStudent] = useState(null)
  const [myCourses, setMyCourses] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('all')
  const [readNotices, setReadNotices] = useState([])
  const [newNoticeAlert, setNewNoticeAlert] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const fileInputRef = useRef(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareData, setShareData] = useState({ title: '', message: '', url: window.location.href })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editProfileData, setEditProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    student_id: '',
    year: '',
    program: '',
    faculty: ''
  })

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Track window width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Browser history / back navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'notices', 'courses'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['dashboard', 'notices', 'courses'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.body.classList.add('dark-mode')
    }
  }, [])

  // Load read notices from localStorage on mount - FIXED
  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(`read_${user.email}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setReadNotices(parsed)
        } catch (e) {
        }
      }
    }
  }, [user?.email])

  // Save read notices to localStorage whenever they change - FIXED
  useEffect(() => {
    if (user?.email && readNotices.length > 0) {
      localStorage.setItem(`read_${user.email}`, JSON.stringify(readNotices))
    }
  }, [readNotices, user?.email])

  // ========== NOTIFICATION FUNCTIONS ==========
  
  const playNotificationSound = () => {
    if (!soundEnabled) return
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 880
      gainNode.gain.value = 0.3
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
    }
  }

  const showBrowserNotification = (title, body, courseName) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: `${courseName}: ${body}`,
          icon: '/campusboard-icon.png',
          vibrate: [200, 100, 200],
          silent: false,
          requireInteraction: true
        })
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (e) {
      }
    }
  }

  const vibrateDevice = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        alert('✅ Notifications enabled! You will receive alerts for new notices.')
      } else if (permission === 'denied') {
        alert('❌ Notifications blocked. Please enable in browser settings.')
      }
    } else {
      alert('Your browser does not support notifications')
    }
  }

  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    localStorage.setItem('soundEnabled', newState)
    if (newState) {
      playNotificationSound()
    }
  }

  const recordNoticeView = async (noticeId) => {
    if (!student?.id) return
    try {
      await supabase
        .from('notice_views')
        .insert({ notice_id: noticeId, student_id: student.id, viewed_at: new Date().toISOString() })
    } catch (err) {
    }
  }

  const markAsRead = async (id) => {
    if (readNotices.includes(id)) return
    const newReadNotices = [...readNotices, id]
    setReadNotices(newReadNotices)
    localStorage.setItem(`read_${user?.email}`, JSON.stringify(newReadNotices))
    await recordNoticeView(id)
  }

  const markAllRead = async () => {
    const currentNotices = notices
    const newRead = [...readNotices]
    for (const notice of currentNotices) {
      if (!newRead.includes(notice.id)) {
        newRead.push(notice.id)
        await recordNoticeView(notice.id)
      }
    }
    setReadNotices(newRead)
    localStorage.setItem(`read_${user?.email}`, JSON.stringify(newRead))
  }

  const markCourseRead = async (courseId) => {
    const courseNotices = notices.filter(n => n.course_id === courseId)
    const newRead = [...readNotices]
    for (const notice of courseNotices) {
      if (!newRead.includes(notice.id)) {
        newRead.push(notice.id)
        await recordNoticeView(notice.id)
      }
    }
    setReadNotices(newRead)
    localStorage.setItem(`read_${user?.email}`, JSON.stringify(newRead))
  }

  const loadData = async () => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    setLoading(true)
    
    try {
      const cachedStudent = localStorage.getItem('studentData')
      let studentData = null
      
      if (cachedStudent) {
        try {
          studentData = JSON.parse(cachedStudent)
          if (studentData && studentData.email === user.email) {
            setStudent(studentData)
            setProfileImageUrl(studentData.profile_image || null)
            setEditProfileData({
              full_name: studentData.full_name || '',
              email: studentData.email || user?.email || '',
              phone: studentData.phone || '',
              bio: studentData.bio || '',
              address: studentData.address || '',
              student_id: studentData.student_id || '',
              year: studentData.year || 'Year 1',
              program: studentData.program || 'Bachelor of Science in Information Technology',
              faculty: studentData.faculty || 'Faculty of Engineering, Design and Technology'
            })
            setLoading(false)
          } else {
            studentData = null
          }
        } catch (e) {}
      }

      const { data: freshStudentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (freshStudentData) {
        studentData = freshStudentData
        setStudent(studentData)
        localStorage.setItem('studentData', JSON.stringify(studentData))
        setProfileImageUrl(studentData.profile_image || null)
        setEditProfileData({
          full_name: studentData.full_name || '',
          email: studentData.email || user?.email || '',
          phone: studentData.phone || '',
          bio: studentData.bio || '',
          address: studentData.address || '',
          student_id: studentData.student_id || '',
          year: studentData.year || 'Year 1',
          program: studentData.program || 'Bachelor of Science in Information Technology',
          faculty: studentData.faculty || 'Faculty of Engineering, Design and Technology'
        })
      }
      
      if (studentData) {
        const { data: enrolled, error: enrolledError } = await supabase
          .from('student_courses')
          .select(`
            course_id,
            courses (
              id,
              code,
              name,
              description,
              credits,
              department
            )
          `)
          .eq('student_id', studentData.id)
        
        const courses = enrolled?.map(item => item.courses).filter(c => c !== null) || []
        setMyCourses(courses)
        
        if (courses.length > 0) {
          const courseIds = courses.map(c => c.id)
          const { data: noticesData, error: noticesError } = await supabase
            .from('notices')
            .select('*, courses(id, code, name)')
            .in('course_id', courseIds)
            .order('created_at', { ascending: false })
          
          setNotices(noticesData || [])
        } else {
          setNotices([])
        }
      }
    } catch (err) {}
    
    setLoading(false)
  }

  // Load data effect
  useEffect(() => {
    if (!user?.email) return
    loadData()
  }, [user?.email])

  // Real-time notifications
  useEffect(() => {
    if (!myCourses.length) return

    const courseIds = myCourses.map(c => c.id)
    
    const channel = supabase
      .channel('student-notices')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notices'
      }, async (payload) => {
        // Filter manually if needed, or use a more precise filter if Supabase supports it well
        if (!courseIds.includes(payload.new.course_id)) return

        const { data: course } = await supabase
          .from('courses')
          .select('id, name, code')
          .eq('id', payload.new.course_id)
          .single()
        
        const newNotice = { ...payload.new, courses: course }
        setNotices(prev => [newNotice, ...prev])
        
        setNewNoticeAlert({ course: course?.name, title: payload.new.title })
        setTimeout(() => setNewNoticeAlert(null), 8000)
        
        playNotificationSound()
        vibrateDevice()
        showBrowserNotification(
          `📢 New Notice from ${course?.code}`,
          payload.new.title,
          course?.name
        )
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [myCourses])

  // Share functions
  const openShareModal = () => {
    setShareData({
      title: 'CampusBoard Student Dashboard',
      message: 'Check out my academic notices on CampusBoard',
      url: window.location.href
    })
    setShowShareModal(true)
  }

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareData.message + '\n\n' + shareData.url)}`, '_blank')
  }

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.message)}`, '_blank')
  }

  const shareToEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.message + '\n\n' + shareData.url)}`, '_blank')
  }

  // Export notice to PDF
  const exportNoticeToPDF = (notice) => {
    const doc = new jsPDF()
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text('CampusBoard - Academic Notice', 14, 22)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text(notice.title, 14, 55)
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Course: ${notice.courses?.code} - ${notice.courses?.name}`, 14, 70)
    doc.text(`Date: ${new Date(notice.created_at).toLocaleString()}`, 14, 80)
    doc.setTextColor(0, 0, 0)
    const splitMessage = doc.splitTextToSize(notice.message, 180)
    doc.text(splitMessage, 14, 100)
    doc.save(`notice_${notice.courses?.code}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Profile functions
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Max 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      setProfileImage(base64String)
      setProfileImageUrl(base64String)
      await supabase.from('students').update({ profile_image: base64String }).eq('id', student.id)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!student?.id) return
    
    const updateData = {
      full_name: editProfileData.full_name,
      phone: editProfileData.phone,
      bio: editProfileData.bio,
      address: editProfileData.address,
      year: editProfileData.year,
      program: editProfileData.program,
      faculty: editProfileData.faculty
    }
    if (profileImage) updateData.profile_image = profileImage
    
    const { error } = await supabase.from('students').update(updateData).eq('id', student.id)
    
    if (error) {
      alert('Error updating profile')
    } else {
      setStudent(prev => ({ ...prev, ...updateData }))
      setIsEditingProfile(false)
      alert('Profile updated successfully!')
    }
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    document.body.classList.toggle('dark-mode', newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  // Helper functions
  const getUnreadCountByCourse = (courseId) => {
    return notices.filter(n => n.course_id === courseId && !readNotices.includes(n.id)).length
  }

  const getNoticeCountByCourse = (courseId) => {
    return notices.filter(n => n.course_id === courseId).length
  }

  // Stats
  const unreadCount = notices.filter(n => !readNotices.includes(n.id)).length
  const urgentCount = notices.filter(n => {
    const urgentKeywords = ['exam', 'test', 'urgent', 'deadline', 'submit', 'quiz', 'assignment', 'project']
    return urgentKeywords.some(k => n.title?.toLowerCase().includes(k) || n.message?.toLowerCase().includes(k))
  }).length

  // Filter notices
  const filteredNotices = useMemo(() => {
    let list = notices
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(n => 
        n.title?.toLowerCase().includes(q) || 
        n.message?.toLowerCase().includes(q)
      )
    }
    
    if (selectedCourseId !== 'all') {
      list = list.filter(n => n.course_id === selectedCourseId)
    }
    
    return list
  }, [notices, searchTerm, selectedCourseId])

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const isMobile = windowWidth < 576

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: darkMode ? '#111827' : '#f0fdf4' }}>
        <FaSpinner className="fa-spin text-success" size={40} />
      </div>
    )
  }

  return (
    <div className="min-vh-100" style={{ background: darkMode ? '#111827' : 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d5 50%, #d4c5b5 100%)' }}>
      
      {/* Toast Notification */}
      {newNoticeAlert && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
          <div className="shadow rounded-3 p-3" style={{ background: darkMode ? '#1f2937' : 'white', borderLeft: '4px solid #10B981', minWidth: '280px' }}>
            <div className="d-flex gap-2">
              <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <FaBell color="white" size={16} />
              </div>
              <div>
                <strong className="small text-success">🔔 New Notice from {newNoticeAlert.course}</strong>
                <p className="mb-0 small fw-bold">{newNoticeAlert.title}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }} onClick={() => setShowShareModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header">
                <h5 className="modal-title"><FaShareAlt className="me-2" /> Share CampusBoard</h5>
                <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Share via</h6>
                  <div className="d-flex gap-3 justify-content-center">
                    <button onClick={shareToWhatsApp} className="btn btn-success rounded-circle p-3" style={{ width: '60px', height: '60px' }}><FaWhatsapp size={24} /></button>
                    <button onClick={shareToTelegram} className="btn btn-primary rounded-circle p-3" style={{ width: '60px', height: '60px' }}><FaTelegram size={24} /></button>
                    <button onClick={shareToEmail} className="btn btn-secondary rounded-circle p-3" style={{ width: '60px', height: '60px' }}><FaEnvelopeIcon size={24} /></button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 30px 60px 30px', textAlign: 'center' }}>
                <div className="position-relative d-inline-block">
                  <div className="rounded-circle bg-white p-1 d-inline-block" style={{ width: '120px', height: '120px' }}>
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center w-100 h-100" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        <span className="text-white display-4 fw-bold">{student?.full_name?.charAt(0) || 'S'}</span>
                      </div>
                    )}
                  </div>
                  <button className="btn btn-light rounded-circle position-absolute bottom-0 end-0 p-2 shadow-sm" style={{ width: '36px', height: '36px' }} onClick={() => fileInputRef.current?.click()}>
                    <FaCamera size={14} />
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleProfileImageUpload} />
                </div>
                
                {!isEditingProfile ? (
                  <>
                    <h3 className="text-white mt-3 mb-1">{student?.full_name || 'Student'}</h3>
                    <p className="text-white-50 mb-0">{editProfileData.program}</p>
                    <p className="text-white-50 small mt-1"><FaUniversity className="me-1" size={12} /> {editProfileData.faculty}</p>
                    <p className="text-white-50 small">Student ID: {student?.student_id || 'Not assigned'}</p>
                  </>
                ) : (
                  <>
                    <input type="text" className="form-control form-control-lg text-center mt-3 mb-2" style={{ maxWidth: '300px', margin: '0 auto', borderRadius: '50px' }} value={editProfileData.full_name} onChange={(e) => setEditProfileData({...editProfileData, full_name: e.target.value})} />
                    <select className="form-select text-center mt-2" style={{ width: '150px', margin: '0 auto', borderRadius: '50px' }} value={editProfileData.year} onChange={(e) => setEditProfileData({...editProfileData, year: e.target.value})}>
                      <option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option>
                    </select>
                  </>
                )}
              </div>
              
              <div className={`modal-body p-4 ${darkMode ? 'bg-dark' : ''}`}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className={`p-3 rounded-3 ${darkMode ? 'bg-secondary' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-3"><FaEnvelope className="me-2 text-success" /> Contact</h6>
                      {!isEditingProfile ? (
                        <>
                          <p className="mb-2"><strong>Email:</strong> {student?.email || user?.email}</p>
                          <p className="mb-2"><strong>Phone:</strong> {student?.phone || 'Not provided'}</p>
                          <p className="mb-0"><strong>Address:</strong> {student?.address || 'Not provided'}</p>
                        </>
                      ) : (
                        <>
                          <div className="mb-2"><label className="small text-muted">Phone</label><input type="tel" className="form-control" value={editProfileData.phone} onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})} /></div>
                          <div className="mb-2"><label className="small text-muted">Address</label><input type="text" className="form-control" value={editProfileData.address} onChange={(e) => setEditProfileData({...editProfileData, address: e.target.value})} /></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className={`p-3 rounded-3 ${darkMode ? 'bg-secondary' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-3"><FaUserGraduate className="me-2 text-success" /> Academic</h6>
                      {!isEditingProfile ? (
                        <>
                          <p className="mb-2"><strong>Program:</strong> {editProfileData.program}</p>
                          <p className="mb-2"><strong>Faculty:</strong> {editProfileData.faculty}</p>
                          <p className="mb-0"><strong>Year:</strong> {student?.year || 'Year 1'}</p>
                        </>
                      ) : (
                        <>
                          <div className="mb-2"><label className="small text-muted">Program</label><input type="text" className="form-control" value={editProfileData.program} onChange={(e) => setEditProfileData({...editProfileData, program: e.target.value})} /></div>
                          <div className="mb-2"><label className="small text-muted">Faculty</label><input type="text" className="form-control" value={editProfileData.faculty} onChange={(e) => setEditProfileData({...editProfileData, faculty: e.target.value})} /></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className={`p-3 rounded-3 ${darkMode ? 'bg-secondary' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-3">About Me</h6>
                      {!isEditingProfile ? (
                        <p className="mb-0 small">{student?.bio || 'No bio provided.'}</p>
                      ) : (
                        <textarea className="form-control" rows="3" value={editProfileData.bio} onChange={(e) => setEditProfileData({...editProfileData, bio: e.target.value})} placeholder="Tell something about yourself..." />
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                      {!isEditingProfile ? (
                        <>
                          <button className="btn btn-primary rounded-pill px-4" onClick={() => setIsEditingProfile(true)}><FaEdit className="me-2" /> Edit Profile</button>
                          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowProfileModal(false)}>Close</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-success rounded-pill px-4" onClick={handleSaveProfile}><FaSave className="me-2" /> Save</button>
                          <button className="btn btn-outline-danger rounded-pill px-4" onClick={() => { setIsEditingProfile(false); }}><FaTimes className="me-2" /> Cancel</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ========== HEADER ========== */}
      <nav className="navbar sticky-top shadow-sm px-3 py-2" style={{ background: darkMode ? '#1f2937' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${darkMode ? '#374151' : 'rgba(0,0,0,0.05)'}` }}>
        <div className="d-flex align-items-center w-100">
          {/* Mobile Menu Button */}
          <button 
            className="btn d-md-none me-2 p-2" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'transparent', border: 'none', fontSize: '22px', color: darkMode ? 'white' : '#333' }}
          >
            ☰
          </button>
          
          <a className="navbar-brand d-flex align-items-center gap-2" href="#">
            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', width: '36px', height: '36px' }}>
              <FaGraduationCap size={18} color="white" />
            </div>
            <span className="fw-bold" style={{ color: darkMode ? 'white' : '#1a202c' }}>CampusBoard Student</span>
          </a>
          
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Date and Time */}
            <div className="d-none d-md-block text-end">
              <div className="small fw-semibold" style={{ fontSize: '12px', color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                {dateString}
              </div>
              <div className="small text-muted" style={{ fontSize: '10px' }}>
                {timeString}
              </div>
            </div>
            
            {/* Enable Notifications Button */}
            {notificationPermission !== 'granted' ? (
              <button 
                onClick={requestNotificationPermission} 
                className="btn btn-outline-warning rounded-circle p-1"
                style={{ width: '32px', height: '32px', fontSize: '12px' }}
                title="Enable Notifications"
              >
                <FaBellSlash size={14} />
              </button>
            ) : (
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', background: '#10B981', cursor: 'default' }}
                title="Notifications Enabled ✓"
              >
                <FaBellActive size={14} color="white" />
              </div>
            )}
            
            {/* Sound Toggle */}
            <button 
              onClick={toggleSound}
              className="btn btn-outline-secondary rounded-circle p-1"
              style={{ width: '32px', height: '32px', fontSize: '12px' }}
              title={soundEnabled ? 'Sound On - Click to mute' : 'Sound Off - Click to unmute'}
            >
              <FaVolumeUp size={14} style={{ opacity: soundEnabled ? 1 : 0.3 }} />
            </button>
            
            {/* Share Button */}
            <button onClick={openShareModal} className="btn btn-outline-success rounded-circle p-1" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
              <FaShareAlt size={14} />
            </button>
            
            {/* Dark Mode Toggle */}
            <div onClick={toggleDarkMode} style={{ cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(90deg, #1e293b 50%, #f1f5f9 50%)' }} />
            
            {/* Profile */}
            <div onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-100 h-100" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <span className="text-white fw-bold" style={{ fontSize: '14px' }}>{student?.full_name?.charAt(0)?.toUpperCase() || 'S'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========== SIDEBAR + MAIN CONTENT ========== */}
      <div className="container-fluid px-0">
        <div className="row g-0">
          
          {/* Sidebar */}
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="p-2">
              <ul className="nav flex-column gap-2">
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} 
                    className="nav-link-dashboard w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaHome className="me-2" size={16} /> Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('notices'); setSidebarOpen(false); }} 
                    className="nav-link-notices w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaBell className="me-2" size={16} /> My Notices
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('courses'); setSidebarOpen(false); }} 
                    className="nav-link-courses w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaBook className="me-2" size={16} /> My Courses
                  </button>
                </li>
                <li className="nav-item mt-3">
                  <button onClick={onLogout} 
                    className="btn btn-outline-danger w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaSignOutAlt className="me-2" size={16} /> Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && <div className="d-md-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />}

          {/* Main Content */}
          <div className="main-content" style={{ width: '100%', minHeight: 'calc(100vh - 56px)', transition: 'margin-left 0.3s ease' }}>
            
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">Dashboard</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                  </div>
                </div>
                
                {/* Welcome Section */}
                <div className="mb-4">
                  <h2 className="fw-bold mb-1" style={{ fontSize: '1.3rem', color: darkMode ? 'white' : '#1e293b' }}>
                    {greeting}, {student?.full_name?.split(' ')[0] || 'Student'}! 👋
                  </h2>
                  <p className="text-muted small">You have {unreadCount} unread notice{unreadCount !== 1 ? 's' : ''}</p>
                </div>
                
                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-4">
                    <div 
                      className="card text-white border-0 shadow-sm hover-up cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '16px', cursor: 'pointer' }}
                      onClick={() => setActiveTab('notices')}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between">
                          <div className="bg-white bg-opacity-25 rounded-circle p-2"><FaBell size={16} /></div>
                        </div>
                        <h3 className="fw-bold mt-2 mb-0">{notices.length}</h3>
                        <p className="mb-0 small">Total Notices</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div 
                      className="card text-white border-0 shadow-sm hover-up cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', borderRadius: '16px', cursor: 'pointer' }}
                      onClick={() => setActiveTab('notices')}
                    >
                      <div className="card-body p-3">
                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaEye size={16} /></div>
                        <h3 className="fw-bold mb-0">{unreadCount}</h3>
                        <p className="mb-0 small">Unread</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div 
                      className="card text-white border-0 shadow-sm hover-up cursor-pointer" 
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: '16px', cursor: 'pointer' }}
                      onClick={() => setActiveTab('notices')}
                    >
                      <div className="card-body p-3">
                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaClock size={16} /></div>
                        <h3 className="fw-bold mb-0">{urgentCount}</h3>
                        <p className="mb-0 small">Urgent</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-2">Quick Actions</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <button onClick={() => setActiveTab('notices')} className="btn btn-primary btn-sm rounded-pill"><FaEye size={10} className="me-1" /> View Notices</button>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="btn btn-success btn-sm rounded-pill"><FaCheckCircle size={10} className="me-1" /> Mark All Read</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Notices Tab */}
            {activeTab === 'notices' && (
              <div className="p-3">
                <div className="d-flex justify-content-between flex-wrap align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">My Notices</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="row g-2 mb-4">
                  <div className="col-md-6">
                    <select 
                      className={`form-select rounded-pill ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                    >
                      <option value="all">All Courses ({notices.length})</option>
                      {myCourses.map((course) => {
                        const noticeCount = getNoticeCountByCourse(course.id)
                        const unreadCountByCourse = getUnreadCountByCourse(course.id)
                        return (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.name} ({noticeCount} {unreadCountByCourse > 0 ? `• ${unreadCountByCourse} new` : ''})
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <div className="position-relative">
                      <FaSearch className="position-absolute top-50 start-0 translate-middle-y text-muted ms-3" size={14} />
                      <input 
                        type="text" 
                        className={`form-control ps-5 rounded-pill ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} 
                        placeholder="Search notices..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Mark All Read Button */}
                {unreadCount > 0 && selectedCourseId === 'all' && (
                  <div className="d-flex justify-content-end mb-3">
                    <button onClick={markAllRead} className="btn btn-sm btn-outline-success rounded-pill">
                      <FaCheckCircle size={12} className="me-1" /> Mark all read
                    </button>
                  </div>
                )}
                
                {selectedCourseId !== 'all' && getUnreadCountByCourse(selectedCourseId) > 0 && (
                  <div className="d-flex justify-content-end mb-3">
                    <button onClick={() => markCourseRead(selectedCourseId)} className="btn btn-sm btn-outline-success rounded-pill">
                      <FaCheckCircle size={12} className="me-1" /> Mark this course read
                    </button>
                  </div>
                )}
                
                {/* Notices List */}
                {myCourses.length === 0 ? (
                  <div className="text-center py-5 rounded-3" style={{ background: darkMode ? '#1f2937' : '#f8fafc' }}>
                    <FaBook size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted">No courses enrolled</p>
                    <small className="text-muted">Please contact the administrator to enroll you in courses</small>
                  </div>
                ) : filteredNotices.length === 0 ? (
                  <div className="text-center py-5 rounded-3" style={{ background: darkMode ? '#1f2937' : '#f8fafc' }}>
                    <FaBell size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted mb-0">No notices found</p>
                    {searchTerm && <small className="text-muted">Try a different search term</small>}
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {filteredNotices.map(notice => {
                      const isRead = readNotices.includes(notice.id)
                      const courseIdx = myCourses.findIndex(c => c.id === notice.course_id)
                      const courseColor = courseColors[courseIdx >= 0 ? courseIdx : 0]
                      const isUrgent = ['exam', 'test', 'urgent', 'deadline', 'submit', 'quiz', 'assignment', 'project'].some(k => 
                        notice.title?.toLowerCase().includes(k) || notice.message?.toLowerCase().includes(k)
                      )
                      const isToday = new Date(notice.created_at).toDateString() === new Date().toDateString()
                      
                      return (
                        <div 
                          key={notice.id}
                          className="p-3 rounded-3"
                          style={{ 
                            background: darkMode ? '#1f2937' : 'white',
                            borderLeft: `4px solid ${courseColor.bg}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            opacity: isRead ? 0.7 : 1
                          }}
                          onClick={() => { setSelectedNotice(notice); markAsRead(notice.id); }}
                        >
                          <div>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              <span className="badge rounded-pill" style={{ background: courseColor.bg, color: 'white' }}>
                                {notice.courses?.code} - {notice.courses?.name}
                              </span>
                              <span className="small text-muted">
                                {new Date(notice.created_at).toLocaleString()}
                              </span>
                              {isToday && <span className="badge bg-info text-white">Today</span>}
                              {isUrgent && !isRead && <span className="badge bg-danger">Urgent</span>}
                              {!isRead && <span className="badge bg-danger">New</span>}
                            </div>
                            <h6 className="fw-bold mb-2" style={{ fontSize: '1rem' }}>{notice.title}</h6>
                            <p className="small mb-2" style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                              {notice.message.length > 200 ? notice.message.substring(0, 200) + '...' : notice.message}
                            </p>
                            {notice.attachments && notice.attachments.length > 0 && (
                              <div className="mt-2 mb-2">
                                <small className="text-muted"><FaPaperclip className="me-1" size={10} /> {notice.attachments.length} attachment(s)</small>
                              </div>
                            )}
                            <div className="mt-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); exportNoticeToPDF(notice); }}
                                className="btn btn-sm btn-outline-secondary rounded-pill"
                                style={{ fontSize: '11px', padding: '4px 12px' }}
                              >
                                <FaFilePdf size={11} className="me-1" /> Save as PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Courses Tab */}
            {activeTab === 'courses' && (
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">My Courses</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                  </div>
                </div>
                
                {myCourses.length === 0 ? (
                  <div className="text-center py-5 rounded-3" style={{ background: darkMode ? '#1f2937' : '#f8fafc' }}>
                    <FaBook size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted">No courses enrolled yet.</p>
                    <small className="text-muted">Contact the administrator to enroll you in courses</small>
                  </div>
                ) : (
                  <div className="row g-3">
                    {myCourses.map((course, idx) => {
                      const color = courseColors[idx % courseColors.length]
                      const noticeCount = getNoticeCountByCourse(course.id)
                      const unreadCountByCourse = getUnreadCountByCourse(course.id)
                      
                      return (
                        <div key={course.id} className="col-12 col-md-6 col-lg-4">
                          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ background: color.bg, padding: '15px', color: 'white' }}>
                              <h5 className="fw-bold mb-0">{course.code}</h5>
                              <small className="opacity-75">{course.name}</small>
                            </div>
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between mb-2">
                                <span className="small text-muted">Credits: {course.credits || 3}</span>
                                <span className="small text-muted">{course.department || 'General'}</span>
                              </div>
                              <div className="d-flex gap-2 mt-2">
                                <span className="badge bg-info">📄 {noticeCount} notices</span>
                                {unreadCountByCourse > 0 && (
                                  <span className="badge bg-danger">🔔 {unreadCountByCourse} unread</span>
                                )}
                              </div>
                              <div className="mt-3">
                                <button 
                                  onClick={() => setSelectedCourseId(course.id)}
                                  className="btn btn-sm btn-outline-primary rounded-pill w-100"
                                >
                                  View Notices
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={() => setSelectedNotice(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill" style={{ background: courseColors[myCourses.findIndex(c => c.id === selectedNotice.course_id) % courseColors.length]?.bg || '#10B981' }}>
                    {selectedNotice.courses?.code}
                  </span>
                  <small className="text-muted">{new Date(selectedNotice.created_at).toLocaleString()}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedNotice(null)}></button>
              </div>
              <div className="modal-body p-4">
                <h4 className="fw-bold mb-3">{selectedNotice.title}</h4>
                <div className={`p-4 rounded-4 mb-4 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`} style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: '1.6' }}>
                  {selectedNotice.message}
                </div>
                
                {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3"><FaPaperclip className="me-2" /> Attachments ({selectedNotice.attachments.length})</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedNotice.attachments.map((file, idx) => (
                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                          <FaDownload size={12} className="me-2" /> {file.name || `Attachment ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setSelectedNotice(null)}>Close</button>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => exportNoticeToPDF(selectedNotice)}>
                  <FaFilePdf className="me-2" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fa-spin { animation: fa-spin 2s infinite linear; }
        @keyframes fa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        body.dark-mode { background-color: #111827; }
        body.dark-mode .card, body.dark-mode .bg-white { background-color: #1f2937 !important; color: #f9fafb; }
        body.dark-mode .text-muted { color: #9ca3af !important; }
        body.dark-mode .bg-light { background-color: #374151 !important; }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #e0e0e0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #10B981; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #059669; }
        
        body.dark-mode ::-webkit-scrollbar-track { background: #2d3748; }
        body.dark-mode ::-webkit-scrollbar-thumb { background: #10B981; }
        
        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 56px;
          left: 0;
          bottom: 0;
          width: 260px;
          background: white;
          z-index: 1000;
          overflow-y: auto;
          box-shadow: 2px 0 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }
        
        body.dark-mode .sidebar { background: #1f2937; }
        
        /* Sidebar Navigation Items */
        .nav-link-dashboard { background: linear-gradient(135deg, #667eea, #764ba2); color: white !important; }
        .nav-link-notices { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white !important; }
        .nav-link-courses { background: linear-gradient(135deg, #F59E0B, #D97706); color: white !important; }
        
        .nav-link-dashboard:hover, .nav-link-notices:hover, .nav-link-courses:hover {
          transform: translateX(5px);
          opacity: 0.9;
          transition: all 0.2s ease;
        }

        .hover-up { transition: transform 0.2s ease; }
        .hover-up:hover { transform: translateY(-5px); }
        .cursor-pointer { cursor: pointer; }
        
        /* Desktop */
        @media (min-width: 768px) {
          .sidebar { transform: translateX(0) !important; position: fixed; }
          .main-content { margin-left: 260px !important; width: calc(100% - 260px) !important; }
        }
        
        /* Mobile */
        @media (max-width: 767px) {
          .sidebar { transform: translateX(-100%); position: fixed; }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; width: 100% !important; }
        }
        
        @media print { 
          .sidebar, .btn, .modal, .navbar .btn { display: none !important; } 
          .main-content { margin-left: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  )
}