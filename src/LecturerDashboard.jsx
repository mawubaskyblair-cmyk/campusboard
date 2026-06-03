import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from './lib/supabase'
import { 
  FaBell, FaUsers, FaChartLine, FaCalendarAlt, FaSearch, FaEye, 
  FaArrowUp, FaArrowDown, FaBook, FaClock, FaCheckCircle, 
  FaGraduationCap, FaEnvelope, FaPhone, FaEdit,
  FaSave, FaTimes, FaStar, FaCamera, FaSignOutAlt,
  FaTrashAlt, FaFileAlt, FaShareAlt, FaPaperclip, FaCalendarCheck,
  FaWhatsapp, FaTelegram, FaEnvelope as FaEnvelopeIcon,
  FaFileExcel, FaFilePdf, FaPrint, FaTrash, FaThumbtack, FaBan,
  FaUserGraduate, FaSpinner, FaEyeSlash, FaTachometerAlt,
  FaChalkboardTeacher, FaBell as FaBellIcon, FaHistory, FaChevronLeft,
  FaPlus
} from 'react-icons/fa'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

export default function LecturerDashboard({ onLogout, user }) {
  // ========== STATE DECLARATIONS ==========
  const [lecturer, setLecturer] = useState(null)
  const [myCourses, setMyCourses] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [myNotices, setMyNotices] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [stats, setStats] = useState({
    totalNotices: 0,
    totalStudents: 0,
    avgEngagement: 0,
    noticesThisMonth: 0,
    trend: 0
  })
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [chartData, setChartData] = useState({ labels: [], datasets: [] })
  const [editingNotice, setEditingNotice] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const fileInputRef = useRef(null)
  const notifRef = useRef(null)
  const [noticeViews, setNoticeViews] = useState({})
  const [editProfileData, setEditProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    title: '',
    specialization: '',
    bio: '',
    office: ''
  })
  
  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // State for course selection & roles
  const [lecturerRoles, setLecturerRoles] = useState({})
  const [filterCourseId, setFilterCourseId] = useState('all')
  
  // State for student list
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null)
  const [courseStudents, setCourseStudents] = useState([])
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareData, setShareData] = useState({ title: '', message: '', url: window.location.href })
  
  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date())
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Track window width for responsive design
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on resize (desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Browser history / back navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'post', 'notices', 'analytics', 'calendar'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['dashboard', 'post', 'notices', 'analytics', 'calendar'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-clear old notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notifications.length > 5) {
        setNotifications(prev => prev.slice(0, 5))
      }
    }, 8000)
    return () => clearInterval(timer)
  }, [notifications])

  // Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.body.classList.add('dark-mode')
    }
  }, [])

  // Load data when user is available
  useEffect(() => {
    if (!user?.email) return
    loadLecturerData()
  }, [user?.email])

  const addNotification = useCallback((msg, type = 'info') => {
    const newNotif = { id: Date.now(), message: msg, type, read: false, timestamp: new Date() }
    setNotifications(prev => [newNotif, ...prev].slice(0, 15))
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === newNotif.id ? { ...n, read: true } : n))
    }, 4000)
  }, [])

  // ========== LOAD LECTURER DATA ==========
  const loadLecturerData = async () => {
    const { data: lecturerData, error: lecturerError } = await supabase
      .from('lecturers')
      .select('*')
      .eq('email', user.email)
      .single()
    
    if (lecturerError) {
      console.error('Error loading lecturer:', lecturerError)
      return
    }
    
    if (!lecturerData) return
    
    setLecturer(lecturerData)
    setProfileImageUrl(lecturerData.profile_image || null)
    setEditProfileData({
      full_name: lecturerData.full_name || '',
      email: lecturerData.email || user?.email || '',
      phone: lecturerData.phone || '',
      title: lecturerData.title || 'Mr.',
      specialization: lecturerData.specialization || '',
      bio: lecturerData.bio || '',
      office: lecturerData.office || 'Room 204, Engineering Block'
    })
    
    const courses = await loadMyCourses(lecturerData.id)
    await loadLecturerRoles(lecturerData.id)
    const notices = await loadNotices(lecturerData.id)
    await loadStats(lecturerData.id, courses, notices)
    buildChartData(notices)
  }

  const loadLecturerRoles = async (lecturerId) => {
    const { data } = await supabase
      .from('lecturer_courses')
      .select('course_id, role')
      .eq('lecturer_id', lecturerId)
    
    const rolesMap = {}
    data?.forEach(item => {
      rolesMap[item.course_id] = item.role
    })
    setLecturerRoles(rolesMap)
  }

  const loadMyCourses = async (lecturerId) => {
    const { data } = await supabase
      .from('lecturer_courses')
      .select('course_id, courses(*)')
      .eq('lecturer_id', lecturerId)
    
    const courses = data ? data.map(c => c.courses).filter(Boolean) : []
    setMyCourses(courses)
    return courses
  }

  const loadNotices = async (lecturerId) => {
    const { data: assignedCourses } = await supabase
      .from('lecturer_courses')
      .select('course_id, role')
      .eq('lecturer_id', lecturerId)
    
    const courseIds = assignedCourses?.map(c => c.course_id) || []
    const roleMap = {}
    assignedCourses?.forEach(c => { roleMap[c.course_id] = c.role })
    
    if (courseIds.length === 0) {
      setMyNotices([])
      return []
    }
    
    const { data, error } = await supabase
      .from('notices')
      .select('*, courses(code, name)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading notices:', error)
      return []
    }
    
    let filteredNotices = data || []
    
    const isOnlyAssistant = Object.values(roleMap).every(role => role === 'assistant')
    
    if (isOnlyAssistant) {
      filteredNotices = filteredNotices.filter(notice => notice.lecturer_id === lecturerId)
    }
    
    setMyNotices(filteredNotices)
    
    if (filteredNotices.length > 0) {
      await loadNoticeViews(filteredNotices.map(n => n.id))
    }
    
    return filteredNotices
  }

  const loadCourseStudents = async (courseId) => {
    setLoading(true)
    const { data } = await supabase
      .from('student_courses')
      .select('student_id, students(full_name, email, student_id, year, phone)')
      .eq('course_id', courseId)
    
    const students = data?.map(item => item.students).filter(Boolean) || []
    setCourseStudents(students)
    setLoading(false)
  }

  const loadNoticeViews = async (noticeIds) => {
    if (!noticeIds || noticeIds.length === 0) return
    
    const { data, error } = await supabase
      .from('notice_views')
      .select('notice_id')
      .in('notice_id', noticeIds)
  
    if (error) {
      console.error('Error loading views:', error)
      return
    }
    
    const viewsCount = {}
    data?.forEach(view => {
      viewsCount[view.notice_id] = (viewsCount[view.notice_id] || 0) + 1
    })
    
    setNoticeViews(viewsCount)
  }

  useEffect(() => {
    if (!myNotices.length) return
    
    const channel = supabase
      .channel('notice-views-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notice_views'
      }, (payload) => {
        setNoticeViews(prev => ({
          ...prev,
          [payload.new.notice_id]: (prev[payload.new.notice_id] || 0) + 1
        }))
      })
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [myNotices.length])

  const loadStats = async (lecturerId, courses, notices) => {
    const uniqueStudents = new Set()
    for (const course of courses) {
      const { data: students } = await supabase.from('student_courses').select('student_id').eq('course_id', course.id)
      if (students) students.forEach(s => uniqueStudents.add(s.student_id))
    }
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const noticesThisMonth = notices.filter(n => new Date(n.created_at).getMonth() === currentMonth && new Date(n.created_at).getFullYear() === currentYear).length
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const noticesLastMonth = notices.filter(n => new Date(n.created_at).getMonth() === lastMonth.getMonth() && new Date(n.created_at).getFullYear() === lastMonth.getFullYear()).length
    const trend = noticesThisMonth - noticesLastMonth
    setStats({ totalNotices: notices.length, totalStudents: uniqueStudents.size, avgEngagement: 68, noticesThisMonth, trend })
  }

  const buildChartData = (notices) => {
    const months = []
    const counts = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push(date.toLocaleString('default', { month: 'short' }))
      counts.push(notices.filter(n => new Date(n.created_at).getMonth() === date.getMonth() && new Date(n.created_at).getFullYear() === date.getFullYear()).length)
    }
    setChartData({ labels: months, datasets: [{ label: 'Notices Posted', data: counts, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true }] })
  }

  // ========== HANDLE POST NOTICE ==========
  const handlePostNotice = async (e) => {
    e.preventDefault()
    if (!lecturer?.id) return
    
    if (myCourses.length === 0) {
      setError('No courses assigned to you. Please contact administrator.')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    if (!title.trim()) {
      setError('Please enter a title')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    if (!message.trim()) {
      setError('Please enter a message')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    const courseId = myCourses[0]?.id
    const role = lecturerRoles[courseId] || 'assistant'
    
    const { error: postError } = await supabase.from('notices').insert([{ 
      course_id: courseId, 
      lecturer_id: lecturer.id, 
      title, 
      message, 
      posted_by_role: role,
      created_at: new Date().toISOString() 
    }])
    
    if (postError) {
      setError(postError.message)
      addNotification(`Error: ${postError.message}`, 'error')
    } else {
      setSuccess('Notice posted successfully!')
      addNotification('Notice posted successfully', 'success')
      setTitle('')
      setMessage('')
      await loadNotices(lecturer.id)
      await loadStats(lecturer.id, myCourses, myNotices)
    }
    setLoading(false)
  }

  const openEditModal = (notice) => {
    setEditingNotice(notice)
    setEditTitle(notice.title)
    setEditMessage(notice.message)
  }

  const handleUpdateNotice = async () => {
    if (!editingNotice) return
    setLoading(true)
    const { error } = await supabase
      .from('notices')
      .update({ title: editTitle, message: editMessage, updated_at: new Date().toISOString() })
      .eq('id', editingNotice.id)
    
    if (error) {
      setError(error.message)
      addNotification(`Error: ${error.message}`, 'error')
    } else {
      setSuccess('Notice updated successfully!')
      addNotification('Notice updated successfully', 'success')
      setEditingNotice(null)
      await loadNotices(lecturer.id)
      await loadStats(lecturer.id, myCourses, myNotices)
    }
    setLoading(false)
  }

  const handleDeleteNotice = async (id, title) => {
    const confirm = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)
    if (!confirm) return
    setLoading(true)
    const { error } = await supabase.from('notices').delete().eq('id', id)
    if (error) {
      setError(error.message)
      addNotification(`Error: ${error.message}`, 'error')
    } else {
      setSuccess('Notice deleted successfully!')
      addNotification(`Notice "${title}" deleted`, 'info')
      await loadNotices(lecturer.id)
      await loadStats(lecturer.id, myCourses, myNotices)
    }
    setLoading(false)
  }

  // ========== SHARE FUNCTIONS ==========
  const openShareModal = () => {
    setShareData({
      title: 'CampusBoard Lecturer Dashboard',
      message: 'Check out my notices on CampusBoard',
      url: window.location.href
    })
    setShowShareModal(true)
  }

  const shareToWhatsApp = () => {
    const text = `${shareData.message}\n\n${shareData.url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    addNotification('Shared via WhatsApp', 'success')
  }

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.message)}`, '_blank')
    addNotification('Shared via Telegram', 'success')
  }

  const shareToEmail = () => {
    const subject = encodeURIComponent(shareData.title)
    const body = encodeURIComponent(shareData.message + '\n\n' + shareData.url)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    addNotification('Shared via Email', 'success')
  }

  // ========== EXPORT FUNCTIONS ==========
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('My Notices')
      
      worksheet.columns = [
        { header: 'Course', key: 'course', width: 15 },
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Message', key: 'message', width: 50 },
        { header: 'Posted Date', key: 'date', width: 20 },
        { header: 'Views', key: 'views', width: 10 }
      ]
      
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      }
      
      myNotices.forEach(notice => {
        worksheet.addRow({
          course: notice.courses?.code || '',
          title: notice.title,
          message: notice.message,
          date: new Date(notice.created_at).toLocaleString(),
          views: noticeViews[notice.id] || 0
        })
      })
      
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `notices_${lecturer?.full_name}_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
      
      addNotification('Exported to Excel', 'success')
    } catch (error) {
      console.error('Export error:', error)
      addNotification('Export failed', 'error')
    }
  }

  const exportToPDF = () => {
    if (myNotices.length === 0) { addNotification('No notices to export', 'warning'); return }
    const doc = new jsPDF()
    doc.text(`Notices — ${lecturer?.full_name}`, 14, 10)
    autoTable(doc, {
      head: [['Course', 'Title', 'Message', 'Date', 'Views']],
      body: myNotices.map(n => [
        n.courses?.code || '',
        n.title,
        n.message.length > 50 ? n.message.substring(0, 50) + '...' : n.message,
        new Date(n.created_at).toLocaleDateString(),
        (noticeViews[n.id] || 0).toString()
      ]),
      startY: 20
    })
    doc.save(`notices_${lecturer?.full_name}_${new Date().toISOString().split('T')[0]}.pdf`)
    addNotification('Exported to PDF', 'success')
  }

  const printPage = () => {
    window.print()
    addNotification('Printing page', 'info')
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.body.classList.toggle('dark-mode', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addNotification('Image too large. Max 2MB', 'error')
      return
    }
    if (!file.type.startsWith('image/')) {
      addNotification('Please upload an image file', 'error')
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      setProfileImage(base64String)
      setProfileImageUrl(base64String)
      const { error } = await supabase.from('lecturers').update({ profile_image: base64String }).eq('id', lecturer.id)
      if (error) {
        addNotification('Error saving profile image', 'error')
      } else {
        addNotification('Profile image updated!', 'success')
        await loadLecturerData()
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteLecturerImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile image?')) return
    setLoading(true)
    const { error } = await supabase.from('lecturers').update({ profile_image: null }).eq('id', lecturer.id)
    if (error) {
      addNotification('Error removing image', 'error')
    } else {
      setProfileImageUrl(null)
      setProfileImage(null)
      addNotification('Profile image removed!', 'success')
      await loadLecturerData()
    }
    setLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!lecturer?.id) {
      addNotification('Lecturer not found', 'error')
      return
    }
    
    setLoading(true)
    
    const updateData = {
      full_name: editProfileData.full_name,
      phone: editProfileData.phone,
      title: editProfileData.title,
      specialization: editProfileData.specialization
    }
    
    if (profileImage) {
      updateData.profile_image = profileImage
    }
    
    const { error, data } = await supabase
      .from('lecturers')
      .update(updateData)
      .eq('id', lecturer.id)
      .select()
    
    if (error) {
      setError(error.message)
      addNotification(`Error: ${error.message}`, 'error')
    } else {
      if (data && data[0]) {
        setLecturer(data[0])
        setProfileImageUrl(data[0].profile_image || null)
      } else {
        setLecturer(prev => ({ ...prev, ...updateData }))
      }
      
      setSuccess('Profile updated successfully!')
      addNotification('Profile updated successfully', 'success')
      setIsEditingProfile(false)
      setProfileImage(null)
      
      setTimeout(() => setSuccess(''), 3000)
    }
    
    setLoading(false)
  }

  // ========== FILTERED NOTICES ==========
  const filteredNotices = useMemo(() => {
    let list = myNotices
    
    if (filterCourseId !== 'all') {
      list = list.filter(n => n.course_id === filterCourseId)
    }
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(n => 
        n.title?.toLowerCase().includes(q) || 
        n.message?.toLowerCase().includes(q)
      )
    }
    
    return list
  }, [myNotices, searchTerm, filterCourseId])

  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage)
  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredNotices.slice(start, start + itemsPerPage)
  }, [filteredNotices, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterCourseId])

  const calendarEvents = myNotices.map(n => ({ 
    title: n.title, 
    date: new Date(n.created_at).toISOString().split('T')[0], 
    backgroundColor: '#10B981',
    extendedProps: { course: n.courses?.code, message: n.message } 
  }))

  const courseEngagementData = {
    labels: myCourses.map(c => c.code),
    datasets: [{ data: myCourses.map(() => Math.floor(Math.random() * 60) + 30), backgroundColor: ['#10B981', '#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444', '#EC4899'] }]
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const isMobile = windowWidth < 576

  const isMainLecturer = Object.values(lecturerRoles).includes('main')
  const assignedCourse = myCourses[0]

  if (!lecturer) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: darkMode ? '#111827' : '#f0fdf4' }}>
        <FaSpinner className="fa-spin text-success" size={40} />
      </div>
    )
  }

  return (
    <div className="min-vh-100" style={{ background: darkMode ? '#111827' : 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d5 50%, #d4c5b5 100%)' }}>
      
      {/* ========== SHARE MODAL ========== */}
      {showShareModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }} onClick={() => setShowShareModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header">
                <h5 className="modal-title"><FaShareAlt className="me-2" /> Share & Export</h5>
                <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">📱 Share via</h6>
                  <div className="d-flex gap-3 justify-content-center">
                    <button onClick={shareToWhatsApp} className="btn btn-success rounded-circle p-3" style={{ width: '60px', height: '60px' }}><FaWhatsapp size={24} /></button>
                    <button onClick={shareToTelegram} className="btn btn-primary rounded-circle p-3" style={{ width: '60px', height: '60px' }}><FaTelegram size={24} /></button>
                    <button onClick={shareToEmail} className="btn btn-secondary rounded-circle p-3" style={{ width: '60px', height: '60px' }}><FaEnvelopeIcon size={24} /></button>
                  </div>
                </div>
                <div className="border-top pt-3">
                  <h6 className="fw-bold mb-3">📄 Export as</h6>
                  <div className="d-flex gap-3 justify-content-center">
                    <button onClick={exportToExcel} className="btn btn-success rounded-pill px-4"><FaFileExcel className="me-2" /> Excel</button>
                    <button onClick={exportToPDF} className="btn btn-danger rounded-pill px-4"><FaFilePdf className="me-2" /> PDF</button>
                    <button onClick={printPage} className="btn btn-info rounded-pill px-4"><FaPrint className="me-2" /> Print</button>
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
      
      {/* ========== STUDENTS MODAL ========== */}
      {showStudentsModal && selectedCourseForStudents && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }} onClick={() => setShowStudentsModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header">
                <h5 className="modal-title"><FaUserGraduate className="me-2" /> Students Enrolled in {selectedCourseForStudents.code} - {selectedCourseForStudents.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowStudentsModal(false)}></button>
              </div>
              <div className="modal-body">
                {courseStudents.length === 0 ? (
                  <div className="text-center py-4 text-muted">No students enrolled in this course yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr><th>Student ID</th><th>Name</th><th>Email</th><th>Year</th><th>Phone</th></tr>
                      </thead>
                      <tbody>
                        {courseStudents.map(student => (
                          <tr key={student.id}>
                            <td>{student.student_id || 'N/A'}</td>
                            <td>{student.full_name}</td>
                            <td>{student.email}</td>
                            <td>Year {student.year || 'N/A'}</td>
                            <td>{student.phone || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowStudentsModal(false)}>Close</button>
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
              <FaChalkboardTeacher size={18} color="white" />
            </div>
            <span className="fw-bold" style={{ color: darkMode ? 'white' : '#1a202c' }}>CampusBoard Lecturer</span>
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
            
            {/* Role Badge */}
            <div className="d-none d-lg-block">
              <span className={`badge ${isMainLecturer ? 'bg-primary' : 'bg-secondary'} px-2 py-1`} style={{ fontSize: '11px' }}>
                {isMainLecturer ? '⭐ Main Lecturer' : '👥 Assistant Lecturer'}
              </span>
            </div>
            
            {/* Share Button */}
            <button onClick={openShareModal} className="btn btn-outline-success rounded-pill px-2" style={{ fontSize: '12px' }}>
              <FaShareAlt className="me-1" size={12} /> <span className="d-none d-sm-inline">Share</span>
            </button>
            
            {/* Dark Mode Toggle */}
            <div onClick={toggleDarkMode} style={{ cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(90deg, #1e293b 50%, #f1f5f9 50%)' }} />
            
            {/* Profile */}
            <button className="btn btn-link p-0" onClick={() => setShowProfileModal(true)}>
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
              ) : (
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <span className="text-white fw-bold">{lecturer?.full_name?.charAt(0) || 'L'}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ========== PROFILE MODAL ========== */}
      {showProfileModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '30px', textAlign: 'center' }}>
                <div className="position-relative d-inline-block">
                  <div className="rounded-circle bg-white p-1 d-inline-block" style={{ width: '100px', height: '100px' }}>
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center w-100 h-100" style={{ background: '#10B981' }}>
                        <span className="text-white display-4 fw-bold">{lecturer?.full_name?.charAt(0) || 'L'}</span>
                      </div>
                    )}
                  </div>
                  {isEditingProfile && (
                    <button className="btn btn-light rounded-circle position-absolute bottom-0 end-0 p-1 shadow-sm" style={{ width: '30px', height: '30px' }} onClick={() => fileInputRef.current?.click()}>
                      <FaCamera size={12} />
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleProfileImageUpload} />
                </div>
                {!isEditingProfile ? (
                  <>
                    <h4 className="text-white mt-2 mb-0">{lecturer?.full_name}</h4>
                    <p className="text-white-50 mb-0">{lecturer?.title} • {lecturer?.specialization}</p>
                    <div className="mt-2">
                      <span className={`badge ${isMainLecturer ? 'bg-primary' : 'bg-secondary'} px-3 py-2`}>
                        {isMainLecturer ? '⭐ Main Lecturer' : '👥 Assistant Lecturer'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <input type="text" className="form-control text-center mt-2" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} />
                    <select className="form-select text-center mt-2 d-inline-block w-auto" value={editProfileData.title} onChange={e => setEditProfileData({...editProfileData, title: e.target.value})}>
                      <option>Dr.</option><option>Prof.</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option>
                    </select>
                  </>
                )}
              </div>
              <div className={`modal-body p-3 ${darkMode ? 'bg-dark' : ''}`}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className={`p-2 rounded-3 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-2"><FaEnvelope className="me-2" /> Contact</h6>
                      {!isEditingProfile ? (
                        <>
                          <p className="mb-1"><strong>Email:</strong> {lecturer?.email}</p>
                          <p className="mb-0"><strong>Phone:</strong> {lecturer?.phone || 'Not provided'}</p>
                        </>
                      ) : (
                        <>
                          <div className="mb-2"><label className="small text-muted">Phone</label><input type="tel" className="form-control" value={editProfileData.phone} onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} /></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className={`p-2 rounded-3 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-2"><FaBook className="me-2" /> Course</h6>
                      <p className="mb-0"><strong>Assigned Course:</strong> {assignedCourse?.code} - {assignedCourse?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer p-3">
                {!isEditingProfile ? (
                  <><button className="btn btn-primary rounded-pill" onClick={() => setIsEditingProfile(true)}><FaEdit /> Edit</button>
                  <button className="btn btn-secondary rounded-pill" onClick={() => setShowProfileModal(false)}>Close</button></>
                ) : (
                  <><button className="btn btn-success rounded-pill" onClick={handleSaveProfile} disabled={loading}><FaSave /> Save</button>
                  <button className="btn btn-outline-danger rounded-pill" onClick={() => { setIsEditingProfile(false); }}><FaTimes /> Cancel</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <FaTachometerAlt className="me-2" size={16} /> Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('post'); setSidebarOpen(false); }} 
                    className="nav-link-post w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaBellIcon className="me-2" size={16} /> Post Notice
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('notices'); setSidebarOpen(false); }} 
                    className="nav-link-notices w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaFileAlt className="me-2" size={16} /> My Notices
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }} 
                    className="nav-link-analytics w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaChartLine className="me-2" size={16} /> Analytics
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => { setActiveTab('calendar'); setSidebarOpen(false); }} 
                    className="nav-link-calendar w-100 text-start rounded-3 border-0 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaCalendarAlt className="me-2" size={16} /> Calendar
                  </button>
                </li>
                <li className="nav-item mt-3">
                  <button onClick={onLogout} 
                    className="btn btn-outline-danger w-100 text-start rounded-3 py-2 px-3"
                    style={{ fontWeight: '500' }}>
                    <FaSignOutAlt className="me-2" size={16} /> Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && <div className="d-md-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />}

          {/*{Main/Content */}
          <div className="main-content" style={{ width: '100%', minHeight: 'calc(100vh - 56px)', transition: 'margin-left 0.3s ease' }}>
      
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="p-0">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">Dashboard</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                    <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Export</button>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('notices')}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between">
                          <div className="bg-white bg-opacity-25 rounded-circle p-2"><FaBell size={16} /></div>
                          <span className="badge bg-light text-dark">+{stats.trend}%</span>
                        </div>
                        <h3 className="fw-bold mt-2 mb-0">{stats.totalNotices}</h3>
                        <p className="mb-0 small">Total Notices</p>
                        <small>{stats.noticesThisMonth} this month</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('analytics')}>
                      <div className="card-body p-3">
                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaUsers size={16} /></div>
                        <h3 className="fw-bold mb-0">{stats.totalStudents}</h3>
                        <p className="mb-0 small">Total Students</p>
                        <small>Enrolled in your course</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('calendar')}>
                      <div className="card-body p-3">
                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaCalendarAlt size={16} /></div>
                        <h3 className="fw-bold mb-0">{stats.noticesThisMonth}</h3>
                        <p className="mb-0 small">This Month</p>
                        <small>Notices posted</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('post')}>
                      <div className="card-body p-3">
                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaEdit size={16} /></div>
                        <h3 className="fw-bold mb-0">{myCourses[0]?.code || 'N/A'}</h3>
                        <p className="mb-0 small">Your Course</p>
                        <small>{myCourses[0]?.name?.substring(0, 20) || 'No course'}</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-2">Quick Actions</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <button onClick={() => setActiveTab('post')} className="btn btn-primary btn-sm rounded-pill"><FaPlus size={10} className="me-1" /> Post Notice</button>
                      <button onClick={() => setActiveTab('notices')} className="btn btn-success btn-sm rounded-pill"><FaEye size={10} className="me-1" /> View Notices</button>
                      <button onClick={() => setActiveTab('analytics')} className="btn btn-info btn-sm rounded-pill"><FaChartLine size={10} className="me-1" /> View Analytics</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Post Notice Tab */}
            {activeTab === 'post' && (
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">Post Notice</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                  </div>
                </div>
                
                <div className="row justify-content-center">
                  <div className="col-12 col-lg-8">
                    <div className={`card border-0 shadow-lg ${darkMode ? 'bg-dark' : ''}`} style={{ borderRadius: '20px' }}>
                      <div className="card-body p-4">
                        <div className="text-center mb-4">
                          <div className="rounded-circle p-3 d-inline-block mb-3" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                            <FaBell size={24} color="white" />
                          </div>
                          <h2 className="fw-bold">Create New Notice</h2>
                          <p className="text-muted">Post important announcements to your students</p>
                        </div>
                        
                        {success && <div className="alert alert-success mb-4">{success}<button className="btn-close float-end" onClick={() => setSuccess('')} /></div>}
                        {error && <div className="alert alert-danger mb-4">{error}<button className="btn-close float-end" onClick={() => setError('')} /></div>}
                        
                        {/* Course Information */}
                        <div className="mb-4 p-3 rounded-4" style={{ background: darkMode ? '#374151' : '#f0fdf4', border: '1px solid #10B981' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle p-2" style={{ background: '#10B981' }}>
                              <FaBook size={16} color="white" />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-0">{assignedCourse?.code} – {assignedCourse?.name}</h6>
                              <small className="text-muted">You are posting to this course</small>
                            </div>
                          </div>
                        </div>
                        
                        <form onSubmit={handlePostNotice}>
                          <div className="mb-4">
                            <label className="form-label fw-semibold">Notice Title *</label>
                            <input 
                              type="text" 
                              className={`form-control form-control-lg rounded-4 ${darkMode ? 'bg-dark text-white' : ''}`} 
                              placeholder="e.g., Assignment Deadline Extension, Exam Schedule"
                              value={title} 
                              onChange={e => setTitle(e.target.value)} 
                              required 
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="form-label fw-semibold">Message *</label>
                            <textarea 
                              className={`form-control rounded-4 ${darkMode ? 'bg-dark text-white' : ''}`} 
                              rows="6" 
                              placeholder="Write your notice message here..."
                              value={message} 
                              onChange={e => setMessage(e.target.value)} 
                              required 
                            />
                          </div>
                          
                          <div className="d-flex gap-3 justify-content-end">
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => { setTitle(''); setMessage(''); }}>Clear</button>
                            <button type="submit" disabled={loading} className="btn rounded-pill px-5 text-white" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                              {loading ? 'Posting...' : '📢 Post Notice'}
                            </button>
                          </div>
                        </form>
                      </div>
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
                    <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Excel</button>
                    <button onClick={exportToPDF} className="btn btn-sm btn-outline-danger"><FaFilePdf size={12} className="me-1" /> PDF</button>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="row g-2 mb-4">
                  <div className="col-md-6">
                    <select className={`form-select rounded-pill ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} value={filterCourseId} onChange={e => setFilterCourseId(e.target.value)}>
                      <option value="all">All Courses ({myNotices.length})</option>
                      {myCourses.map(course => {
                        const count = myNotices.filter(n => n.course_id === course.id).length
                        return <option key={course.id} value={course.id}>{course.code} ({count})</option>
                      })}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <div className="position-relative">
                      <FaSearch className="position-absolute top-50 start-0 translate-middle-y text-muted ms-3" />
                      <input type="text" className={`form-control ps-5 rounded-pill ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} placeholder="Search notices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                </div>
                
                {paginatedNotices.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">No notices found.</p>
                    <button onClick={() => setActiveTab('post')} className="btn btn-success rounded-pill">+ Create Notice</button>
                  </div>
                ) : (
                  <>
                    <div className="row g-3">
                      {paginatedNotices.map(notice => {
                        const isOwnNotice = notice.lecturer_id === lecturer?.id
                        return (
                          <div key={notice.id} className="col-12">
                            <div className={`border rounded-4 p-3 ${darkMode ? 'border-secondary' : ''}`}>
                              <div className="d-flex justify-content-between flex-wrap">
                                <div className="flex-grow-1">
                                  <div className="d-flex gap-2 mb-2 flex-wrap">
                                    <span className="badge bg-primary">{notice.courses?.code}</span>
                                    <span className="badge bg-secondary">{new Date(notice.created_at).toLocaleString()}</span>
                                    <span className="badge bg-info"><FaEye className="me-1" size={10} /> {noticeViews[notice.id] || 0} views</span>
                                    {!isOwnNotice && <span className="badge bg-secondary">Posted by Assistant</span>}
                                  </div>
                                  <h6 className="fw-bold mb-1">{notice.title}</h6>
                                  <p className="small mb-0 text-muted">{notice.message}</p>
                                </div>
                                {isOwnNotice && (
                                  <div className="d-flex gap-2 mt-2 mt-sm-0 ms-2">
                                    <button onClick={() => openEditModal(notice)} className="btn btn-sm btn-outline-primary rounded-pill">Edit</button>
                                    <button onClick={() => handleDeleteNotice(notice.id, notice.title)} className="btn btn-sm btn-outline-danger rounded-pill">Delete</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {totalPages > 1 && (
                      <nav className="mt-4">
                        <ul className="pagination justify-content-center">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Prev</button></li>
                          {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}><button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button></li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button></li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">Analytics</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                  </div>
                </div>
                
                <div className="row g-4">
                  <div className="col-12 col-lg-8">
                    <div className={`card border-0 shadow-sm ${darkMode ? 'bg-dark' : ''}`} style={{ borderRadius: '16px' }}>
                      <div className="card-body p-3">
                        <h6 className="fw-bold mb-3">Activity — Last 6 Months</h6>
                        {chartData.labels.length > 0 && <Line data={chartData} options={{ responsive: true }} />}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-4">
                    <div className={`card border-0 shadow-sm ${darkMode ? 'bg-dark' : ''}`} style={{ borderRadius: '16px' }}>
                      <div className="card-body p-3">
                        <h6 className="fw-bold mb-3">Course Engagement</h6>
                        {myCourses.length > 0 ? <Doughnut data={courseEngagementData} options={{ responsive: true }} /> : <p className="text-muted">No data</p>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`card border-0 shadow-sm mt-4 ${darkMode ? 'bg-dark' : ''}`} style={{ borderRadius: '16px' }}>
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-3">Performance Summary</h6>
                    <div className="row text-center">
                      <div className="col-4"><h4 className="fw-bold text-success mb-0">{stats.totalNotices}</h4><small>Total Notices</small></div>
                      <div className="col-4"><h4 className="fw-bold text-success mb-0">{stats.totalStudents}</h4><small>Students</small></div>
                      <div className="col-4"><h4 className="fw-bold text-success mb-0">{stats.noticesThisMonth}</h4><small>This Month</small></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h1 className="h4">Calendar</h1>
                  <div className="d-flex gap-2">
                    <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                  </div>
                </div>
                
                <div className={`card border-0 shadow-sm ${darkMode ? 'bg-dark' : ''}`} style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <div className="card-body p-3">
                    <FullCalendar 
                      plugins={[dayGridPlugin, interactionPlugin]} 
                      initialView="dayGridMonth" 
                      events={calendarEvents} 
                      height="500px" 
                      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
                      eventClick={info => alert(`Notice: ${info.event.title}\nCourse: ${info.event.extendedProps.course}\n\n${info.event.extendedProps.message}`)}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .fa-spin { animation: fa-spin 2s infinite linear; }
        @keyframes fa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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
        .nav-link-post { background: linear-gradient(135deg, #10B981, #059669); color: white !important; }
        .nav-link-notices { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white !important; }
        .nav-link-analytics { background: linear-gradient(135deg, #f093fb, #f5576c); color: white !important; }
        .nav-link-calendar { background: linear-gradient(135deg, #F59E0B, #D97706); color: white !important; }
        
        .nav-link-dashboard:hover, .nav-link-post:hover, .nav-link-notices:hover,
        .nav-link-analytics:hover, .nav-link-calendar:hover {
          transform: translateX(5px);
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
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