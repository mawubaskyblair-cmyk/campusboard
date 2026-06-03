import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from './lib/supabase'
import { 
  FaUsers, FaChalkboardTeacher, FaBell, FaEye, 
  FaEdit, FaTrashAlt, FaPlus, FaSearch, FaTimes,
  FaSignOutAlt, FaGraduationCap, FaFileAlt, FaHistory,
  FaCheckCircle, FaBan, FaUndo, FaUserGraduate,
  FaEnvelope, FaPhone, FaCalendarAlt, FaBook, FaBookOpen,
  FaSpinner, FaChartLine, FaChartBar, FaChartPie,
  FaKey, FaCamera, FaSave, FaEyeSlash,
  FaUserCircle, FaChevronDown, FaIdCard,
  FaTrash, FaLock, FaUnlockAlt, FaClock,
  FaTachometerAlt, FaUserTie, FaSchool, FaClipboardList,
  FaCalendarCheck, FaChartPie as FaChartPieIcon,
  FaShareAlt, FaWhatsapp, FaTelegram, FaEnvelope as FaEnvelopeIcon,
  FaFileExcel, FaFilePdf, FaPrint, FaDownload,
  FaShieldAlt, FaLink, FaUnlink, FaUserPlus, FaStar, FaStarHalfAlt
} from 'react-icons/fa'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminPanel({ onLogout }) {
  // ========== STATE DECLARATIONS ==========
  const [admin, setAdmin] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const fileInputRef = useRef(null)
  const [editProfileData, setEditProfileData] = useState({
    full_name: '',
    email: '',
    phone: ''
  })
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareData, setShareData] = useState({ title: '', message: '', url: window.location.href })
  
  // Calendar State
  const [calendarNotices, setCalendarNotices] = useState([])
  
  // ========== COURSES STATE ==========
  const [courses, setCourses] = useState([])
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '', credits: 3, department: '' })
  
  // ========== LECTURER-COURSE ASSIGNMENT WITH ROLES ==========
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedLecturerForAssignment, setSelectedLecturerForAssignment] = useState(null)
  const [lecturerCourses, setLecturerCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [selectedCourseRoles, setSelectedCourseRoles] = useState({})
  
  // ========== STUDENT ENROLLMENT ==========
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [availableCoursesForStudent, setAvailableCoursesForStudent] = useState([])
  const [selectedEnrollmentCourseIds, setSelectedEnrollmentCourseIds] = useState([])
  
  // Lecturers State
  const [lecturers, setLecturers] = useState([])
  const [showLecturerModal, setShowLecturerModal] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState(null)
  const [lecturerForm, setLecturerForm] = useState({ 
    full_name: '', 
    email: '', 
    password: '', 
    phone: '', 
    title: 'Mr.', 
    specialization: '' 
  })
  
  // Lecturer Profile Modal
  const [showLecturerProfileModal, setShowLecturerProfileModal] = useState(false)
  const [selectedLecturer, setSelectedLecturer] = useState(null)
  const [isEditingLecturerProfile, setIsEditingLecturerProfile] = useState(false)
  const [lecturerProfileImage, setLecturerProfileImage] = useState(null)
  const [lecturerProfilePreview, setLecturerProfilePreview] = useState(null)
  const [lecturerProfileData, setLecturerProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    title: '',
    specialization: '',
    lecturer_id: '',
    password: ''
  })
  const lecturerFileInputRef = useRef(null)
  
  // Password Reset Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedLecturerForPassword, setSelectedLecturerForPassword] = useState(null)
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
  // Student Password View
  const [showStudentPassword, setShowStudentPassword] = useState({})
  
  // Edit Notice Modal
  const [showEditNoticeModal, setShowEditNoticeModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [editNoticeData, setEditNoticeData] = useState({ title: '', message: '' })
  const [editNoticeLoading, setEditNoticeLoading] = useState(false)
  
  // Students State
  const [students, setStudents] = useState([])
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [studentForm, setStudentForm] = useState({ 
    full_name: '', 
    email: '', 
    password: '', 
    student_id: '', 
    year: '1', 
    phone: '' 
  })
  
  // Notices State
  const [allNotices, setAllNotices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([])
  const [actionFilter, setActionFilter] = useState('all')
  
  const exportAuditToExcel = async () => {
    if (auditLogs.length === 0) { alert('No logs to export'); return; }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit_Logs');
    
    worksheet.columns = [
      { header: 'Action', key: 'action', width: 25 },
      { header: 'User', key: 'user', width: 25 },
      { header: 'Details', key: 'details', width: 50 },
      { header: 'Timestamp (Kampala)', key: 'time', width: 30 }
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };

    filteredAuditLogs.forEach(log => {
      worksheet.addRow({
        action: log.action,
        user: log.admin_email || 'System',
        details: log.details || 'No details',
        time: new Date(log.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    logAction('EXPORT_EXCEL', 'Exported audit logs');
  };

  const filteredAuditLogs = useMemo(() => {
    if (!auditLogs) return []
    if (actionFilter === 'all') return auditLogs
    return auditLogs.filter(log => log.action === actionFilter)
  }, [auditLogs, actionFilter])

  // Statistics
  const [stats, setStats] = useState({
    totalLecturers: 0,
    activeLecturers: 0,
    totalStudents: 0,
    totalNotices: 0,
    totalCourses: 0,
    noticesThisMonth: 0,
    growth: 12
  })

  // ========== BROWSER HISTORY / BACK NAVIGATION ==========
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'lecturers', 'students', 'courses', 'notices', 'month', 'audit'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Live clock update every second
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date())
  }, 1000)
  return () => clearInterval(timer)
}, [])

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['dashboard', 'lecturers', 'students', 'courses', 'notices', 'month', 'audit'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ========== THEME MANAGEMENT ==========
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.body.classList.add('dark-mode')
    }
  }, [])

  // ========== SHARE FUNCTIONS ==========
  const openShareModal = () => {
    setShareData({
      title: 'CampusBoard Admin Panel',
      message: 'Check out the CampusBoard Admin Dashboard',
      url: window.location.href
    })
    setShowShareModal(true)
  }

  const shareToWhatsApp = () => {
    const text = `${shareData.message}\n\n${shareData.url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    logAction('SHARE_WHATSAPP', 'Shared via WhatsApp')
  }

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.message)}`, '_blank')
    logAction('SHARE_TELEGRAM', 'Shared via Telegram')
  }

  const shareToEmail = () => {
    const subject = encodeURIComponent(shareData.title)
    const body = encodeURIComponent(shareData.message + '\n\n' + shareData.url)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    logAction('SHARE_EMAIL', 'Shared via Email')
  }

  // ========== EXPORT FUNCTIONS ==========
  const exportToExcel = async () => {
    let exportData = [];
    if (activeTab === 'lecturers') {
      exportData = lecturers.map(l => ({
        Name: l.full_name, Email: l.email, Phone: l.phone, Title: l.title, Status: l.is_active ? 'Active' : 'Inactive'
      }));
    } else if (activeTab === 'students') {
      exportData = students.map(s => ({
        Name: s.full_name, "Student ID": s.student_id, Email: s.email, Year: s.year, Phone: s.phone
      }));
    } else if (activeTab === 'courses') {
      exportData = courses.map(c => ({
        Code: c.code, Name: c.name, Credits: c.credits, Department: c.department
      }));
    } else if (activeTab === 'notices') {
      exportData = allNotices.map(n => ({
        Course: n.courses?.code, Title: n.title, Date: new Date(n.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })
      }));
    }
    if (exportData.length === 0) { alert('No data to export'); return; }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${activeTab}_data`);
    worksheet.columns = Object.keys(exportData[0]).map(key => ({ header: key, key: key, width: 25 }));
    
    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };

    exportData.forEach(row => worksheet.addRow(row));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    logAction('EXPORT_EXCEL', `Exported ${activeTab} data`);
    alert('Exported successfully!');
  };

  const exportToPDF = async () => {
    const doc = new jsPDF()
    doc.setFillColor(16, 185, 129) // Emerald color
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text('CAMPUSBOARD REPORT', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`CATEGORY: ${activeTab.toUpperCase()} | GENERATED: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })}`, 105, 30, { align: 'center' })
    
    let tableData = [], headers = []
    if (activeTab === 'lecturers') {
      headers = ['Name', 'Email', 'Phone', 'Title', 'Status']
      tableData = lecturers.map(l => [l.full_name, l.email, l.phone || '-', l.title, l.is_active ? 'Active' : 'Inactive'])
    } else if (activeTab === 'students') {
      headers = ['Name', 'Student ID', 'Email', 'Year', 'Phone']
      tableData = students.map(s => [s.full_name, s.student_id, s.email, s.year, s.phone || '-'])
    } else if (activeTab === 'courses') {
      headers = ['Code', 'Name', 'Credits', 'Department']
      tableData = courses.map(c => [c.code, c.name, c.credits, c.department || '-'])
    } else if (activeTab === 'notices') {
      headers = ['Course', 'Title', 'Date']
      tableData = allNotices.map(n => [n.courses?.code, n.title, new Date(n.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })])
    }
    autoTable(doc, { 
      head: [headers], 
      body: tableData, 
      startY: 50,
      headStyles: { fillColor: [16, 185, 129] },
      alternateRowStyles: { fillColor: [240, 253, 244] }
    })
    doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`)
    logAction('EXPORT_PDF', `Exported ${activeTab} data`)
    alert('Exported to PDF successfully!')
  }

  const printPage = () => {
    window.print()
    logAction('PRINT', 'Printed page')
  }

  // ========== DARK MODE TOGGLE ==========
  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    document.body.classList.toggle('dark-mode', newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  // ========== LOAD ALL DATA ==========
  useEffect(() => {
    loadAdminData()
    loadLecturers()
    loadStudents()
    loadCourses()
    loadAllNotices()
    loadAuditLogs()
    loadStats()
    loadMonthlyNotices()
  }, [])
    
  const loadAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('No user logged in')
        return
      }
      
      let { data: adminData, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (error) console.error('Error loading admin:', error)
      
      if (adminData) {
        setAdmin(adminData)
        setProfileImageUrl(adminData.profile_image || null)
        setEditProfileData({
          full_name: adminData.full_name || '',
          email: adminData.email || '',
          phone: adminData.phone || ''
        })
      } else {
        setAdmin({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          phone: ''
        })
        setEditProfileData({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          email: user.email,
          phone: ''
        })
      }
    } catch (err) {
      console.error('Error in loadAdminData:', err)
    }
  }

  const loadLecturers = async () => {
    const { data } = await supabase.from('lecturers').select('*').order('created_at', { ascending: false })
    setLecturers(data || [])
  }

  const loadStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    setStudents(data || [])
  }

  // ========== COURSE MANAGEMENT FUNCTIONS ==========
  const loadCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('code', { ascending: true })
      if (error) throw error
      const safeCourses = (data || []).map(course => ({
        ...course,
        credits: course.credits || 3,
        department: course.department || 'General',
        description: course.description || ''
      }))
      setCourses(safeCourses)
    } catch (err) {
      console.error('Error loading courses:', err)
      setCourses([])
    }
  }

  const handleAddCourse = async () => {
    if (!courseForm.code || !courseForm.name) {
      alert('Please fill Course Code and Name')
      return
    }
    setLoading(true)
    
    const courseData = {
      code: courseForm.code.toUpperCase(),
      name: courseForm.name,
      description: courseForm.description || '',
      credits: parseInt(courseForm.credits) || 3,
      department: courseForm.department || 'General'
    }
    
    const { error } = await supabase.from('courses').insert([courseData])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('CREATE_COURSE', `Added course: ${courseForm.code}`)
      alert('Course added successfully!')
      setShowCourseModal(false)
      setCourseForm({ code: '', name: '', description: '', credits: 3, department: '' })
      loadCourses()
      loadStats()
    }
    setLoading(false)
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return
    setLoading(true)
    
    const courseData = {
      code: courseForm.code.toUpperCase(),
      name: courseForm.name,
      description: courseForm.description || '',
      credits: parseInt(courseForm.credits) || 3,
      department: courseForm.department || ''
    }
    
    const { error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', editingCourse.id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('EDIT_COURSE', `Updated course: ${courseForm.code}`)
      alert('Course updated successfully!')
      setShowCourseModal(false)
      setEditingCourse(null)
      loadCourses()
    }
    setLoading(false)
  }

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete course "${course.code} - ${course.name}"? This will also delete all related notices and assignments.`)) return
    setLoading(true)
    
    const { error } = await supabase.from('courses').delete().eq('id', course.id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('DELETE_COURSE', `Deleted course: ${course.code}`)
      alert('Course deleted successfully!')
      loadCourses()
      loadStats()
    }
    setLoading(false)
  }

  // ========== LECTURER-COURSE ASSIGNMENT FUNCTIONS WITH ROLES ==========
  const openAssignmentModal = async (lecturer) => {
    setSelectedLecturerForAssignment(lecturer)
    setLoading(true)
    
    // Load currently assigned courses with roles
    const { data: assigned } = await supabase
      .from('lecturer_courses')
      .select('course_id, role')
      .eq('lecturer_id', lecturer.id)
    
    const assignedIds = []
    const roleMap = {}
    
    assigned?.forEach(a => {
      assignedIds.push(a.course_id)
      roleMap[a.course_id] = a.role || 'assistant'
    })
    
    setSelectedCourseIds(assignedIds)
    setSelectedCourseRoles(roleMap)
    
    // Load all available courses
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, code, name')
      .order('code')
    
    setAvailableCourses(allCourses || [])
    setLoading(false)
    setShowAssignmentModal(true)
  }

  const handleAssignCourses = async () => {
    if (!selectedLecturerForAssignment) return
    setLoading(true)
    
    // Check for multiple main lecturers warning
    const mainCount = Object.values(selectedCourseRoles).filter(r => r === 'main').length
    if (mainCount > 3) {
      if (!window.confirm(`Warning: This lecturer is set as MAIN for ${mainCount} courses. Having many main courses may be overwhelming. Continue anyway?`)) {
        setLoading(false)
        return
      }
    }
    
    // Get current assignments
    const { data: current } = await supabase
      .from('lecturer_courses')
      .select('course_id, role')
      .eq('lecturer_id', selectedLecturerForAssignment.id)
    
    const currentMap = {}
    current?.forEach(c => { currentMap[c.course_id] = c.role })
    
    let added = 0
    let removed = 0
    let updated = 0
    
    // Process each selected course
    for (const courseId of selectedCourseIds) {
      const newRole = selectedCourseRoles[courseId] || 'assistant'
      const currentRole = currentMap[courseId]
      
      if (!currentRole) {
        // New assignment
        const { error } = await supabase
          .from('lecturer_courses')
          .insert([{
            lecturer_id: selectedLecturerForAssignment.id,
            course_id: courseId,
            role: newRole
          }])
        if (!error) added++
      } else if (currentRole !== newRole) {
        // Update role
        const { error } = await supabase
          .from('lecturer_courses')
          .update({ role: newRole })
          .eq('lecturer_id', selectedLecturerForAssignment.id)
          .eq('course_id', courseId)
        if (!error) updated++
      }
    }
    
    // Remove unassigned courses
    for (const courseId of Object.keys(currentMap)) {
      if (!selectedCourseIds.includes(courseId)) {
        const { error } = await supabase
          .from('lecturer_courses')
          .delete()
          .eq('lecturer_id', selectedLecturerForAssignment.id)
          .eq('course_id', courseId)
        if (!error) removed++
      }
    }
    
    await logAction('ASSIGN_COURSES', `Assigned ${added} courses to ${selectedLecturerForAssignment.full_name}, removed ${removed}, updated ${updated} roles`)
    alert(`Courses updated! Added: ${added}, Removed: ${removed}, Role changes: ${updated}`)
    setShowAssignmentModal(false)
    setSelectedLecturerForAssignment(null)
    setLoading(false)
  }

  // ========== STUDENT ENROLLMENT FUNCTIONS ==========
  const openEnrollmentModal = async (student) => {
    setSelectedStudentForEnrollment(student)
    setLoading(true)
    
    // Load currently enrolled courses
    const { data: enrolled } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', student.id)
    
    const enrolledIds = enrolled?.map(e => e.course_id) || []
    setStudentCourses(enrolledIds)
    setSelectedEnrollmentCourseIds(enrolledIds)
    
    // Load all available courses
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, code, name')
      .order('code')
    
    setAvailableCoursesForStudent(allCourses || [])
    setLoading(false)
    setShowEnrollmentModal(true)
  }

  const handleEnrollCourses = async () => {
    if (!selectedStudentForEnrollment) return
    setLoading(true)
    
    // Get current enrollments
    const { data: current } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', selectedStudentForEnrollment.id)
    
    const currentIds = current?.map(c => c.course_id) || []
    
    // Courses to add
    const toAdd = selectedEnrollmentCourseIds.filter(id => !currentIds.includes(id))
    
    // Courses to remove
    const toRemove = currentIds.filter(id => !selectedEnrollmentCourseIds.includes(id))
    
    // Add new enrollments
    for (const courseId of toAdd) {
      await supabase.from('student_courses').insert([{
        student_id: selectedStudentForEnrollment.id,
        course_id: courseId
      }])
    }
    
    // Remove unenrolled courses
    if (toRemove.length > 0) {
      await supabase
        .from('student_courses')
        .delete()
        .eq('student_id', selectedStudentForEnrollment.id)
        .in('course_id', toRemove)
    }
    
    await logAction('ENROLL_COURSES', `Enrolled ${selectedStudentForEnrollment.full_name} in ${toAdd.length} courses, removed from ${toRemove.length}`)
    alert(`Enrollment updated! Added ${toAdd.length}, removed ${toRemove.length}`)
    setShowEnrollmentModal(false)
    setSelectedStudentForEnrollment(null)
    setLoading(false)
  }

  const loadAllNotices = async () => {
    const { data } = await supabase.from('notices').select('*, courses(code, name)').order('created_at', { ascending: false })
    setAllNotices(data || [])
  }

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      
      if (error) {
        console.error('Error loading audit logs:', error)
        setAuditLogs([])
      } else {
        setAuditLogs(data || [])
      }
    } catch (err) {
      console.error('Exception loading audit logs:', err)
      setAuditLogs([])
    }
  }

  const loadStats = async () => {
    try {
      const { data: lecturersData } = await supabase.from('lecturers').select('is_active')
      const { data: studentsData } = await supabase.from('students').select('id')
      const { data: noticesData } = await supabase.from('notices').select('created_at')
      const { data: coursesData } = await supabase.from('courses').select('id')
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const noticesThisMonth = noticesData?.filter(n => {
        const d = new Date(n.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      }).length || 0
      
      setStats({
        totalLecturers: lecturersData?.length || 0,
        activeLecturers: lecturersData?.filter(l => l.is_active === true).length || 0,
        totalStudents: studentsData?.length || 0,
        totalNotices: noticesData?.length || 0,
        totalCourses: coursesData?.length || 0,
        noticesThisMonth,
        growth: Math.floor(Math.random() * 20) + 5
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const loadMonthlyNotices = async () => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)
    const { data } = await supabase
      .from('notices')
      .select('*, courses(code, name)')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .order('created_at', { ascending: true })
    setCalendarNotices(data || [])
  }

  // ========== LOG ACTION ==========
  const logAction = async (action, details) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('audit_logs').insert([{
        action, 
        admin_email: user?.email || admin?.email, 
        details, 
        created_at: new Date().toISOString()
      }])
    } catch (err) {
      console.error('Error logging action:', err)
    }
  }

  // ========== ADMIN PROFILE FUNCTIONS ==========
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Max 2MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      setProfileImage(base64String)
      setProfileImageUrl(base64String)
      const { error } = await supabase
        .from('admins')
        .update({ profile_image: base64String })
        .eq('id', admin.id)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        await logAction('UPDATE_ADMIN_IMAGE', 'Updated profile image')
        alert('Profile image updated!')
      }
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteAdminImage = async () => {
    if (!window.confirm('Remove profile image?')) return
    setLoading(true)
    const { error } = await supabase
      .from('admins')
      .update({ profile_image: null })
      .eq('id', admin.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setProfileImageUrl(null)
      setProfileImage(null)
      await logAction('DELETE_ADMIN_IMAGE', 'Removed profile image')
      alert('Profile image removed!')
    }
    setLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!admin?.id) {
      alert('Admin data not loaded')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('admins')
      .update({
        full_name: editProfileData.full_name,
        phone: editProfileData.phone
      })
      .eq('id', admin.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setAdmin(prev => ({ ...prev, ...editProfileData }))
      await logAction('UPDATE_ADMIN_PROFILE', 'Updated admin profile')
      alert('Profile updated!')
      setIsEditingProfile(false)
    }
    setLoading(false)
  }

  // ========== LECTURER CRUD ==========
  const handleAddLecturer = async () => {
    if (!lecturerForm.full_name || !lecturerForm.email || !lecturerForm.password) {
      alert('Please fill Name, Email, and Password')
      return
    }
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: lecturerForm.email,
      password: lecturerForm.password,
      options: { data: { full_name: lecturerForm.full_name, role: 'lecturer' } }
    })
    if (authError) {
      alert('Auth error: ' + authError.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('lecturers').insert([{
      user_id: authData.user?.id,
      lecturer_id: 'LEC' + Date.now(),
      full_name: lecturerForm.full_name,
      email: lecturerForm.email,
      phone: lecturerForm.phone || '',
      title: lecturerForm.title || 'Mr.',
      specialization: lecturerForm.specialization || 'General',
      is_active: true,
      password: lecturerForm.password,
      status_updated_by: user?.email || admin?.email,
      status_updated_at: new Date().toISOString()
    }])
    if (insertError) {
      alert('Error: ' + insertError.message)
    } else {
      await logAction('CREATE_LECTURER', `Added lecturer: ${lecturerForm.full_name}`)
      alert('Lecturer added!')
      setShowLecturerModal(false)
      setLecturerForm({ full_name: '', email: '', password: '', phone: '', title: 'Mr.', specialization: '' })
      loadLecturers()
      loadStats()
    }
    setLoading(false)
  }

  const handleUpdateLecturer = async () => {
    if (!editingLecturer) return
    setLoading(true)
    const { error } = await supabase.from('lecturers').update({
      full_name: lecturerForm.full_name,
      phone: lecturerForm.phone,
      title: lecturerForm.title,
      specialization: lecturerForm.specialization
    }).eq('id', editingLecturer.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('EDIT_LECTURER', `Updated lecturer: ${lecturerForm.full_name}`)
      alert('Lecturer updated!')
      setShowLecturerModal(false)
      setEditingLecturer(null)
      loadLecturers()
    }
    setLoading(false)
  }

  const handleDeleteLecturer = async (lecturer) => {
    if (!window.confirm(`Delete ${lecturer.full_name}? This will also delete all their notices.`)) return
    setLoading(true)
    const { error } = await supabase.from('lecturers').delete().eq('id', lecturer.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('DELETE_LECTURER', `Deleted lecturer: ${lecturer.full_name}`)
      alert('Lecturer deleted!')
      loadLecturers()
      loadStats()
    }
    setLoading(false)
  }

  const handleToggleLecturerStatus = async (lecturer) => {
    setLoading(true)
    const newStatus = !lecturer.is_active
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('lecturers').update({ 
      is_active: newStatus,
      status_updated_by: user?.email || admin?.email,
      status_updated_at: new Date().toISOString()
    }).eq('id', lecturer.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction(newStatus ? 'ACTIVATE_LECTURER' : 'DEACTIVATE_LECTURER', 
        `${newStatus ? 'Activated' : 'Deactivated'} ${lecturer.full_name}`)
      alert(`Lecturer ${newStatus ? 'activated' : 'deactivated'}!`)
      loadLecturers()
      loadStats()
    }
    setLoading(false)
  }

  // ========== LECTURER PROFILE FUNCTIONS ==========
  const openLecturerProfileModal = (lecturer) => {
    setSelectedLecturer(lecturer)
    setLecturerProfileData({
      full_name: lecturer.full_name || '',
      email: lecturer.email || '',
      phone: lecturer.phone || '',
      title: lecturer.title || 'Mr.',
      specialization: lecturer.specialization || '',
      lecturer_id: lecturer.lecturer_id || '',
      password: lecturer.password || ''
    })
    setLecturerProfilePreview(lecturer.profile_image || null)
    setLecturerProfileImage(null)
    setIsEditingLecturerProfile(false)
    setShowLecturerProfileModal(true)
  }

  const handleLecturerProfileImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Max 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setLecturerProfilePreview(reader.result)
      setLecturerProfileImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteLecturerImage = async () => {
    if (!selectedLecturer) return
    if (!window.confirm('Remove profile image?')) return
    setLoading(true)
    const { error } = await supabase
      .from('lecturers')
      .update({ profile_image: null })
      .eq('id', selectedLecturer.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setLecturerProfilePreview(null)
      setLecturerProfileImage(null)
      await logAction('DELETE_LECTURER_IMAGE', `Removed image for ${selectedLecturer.full_name}`)
      alert('Profile image removed!')
      loadLecturers()
    }
    setLoading(false)
  }

  const handleSaveLecturerProfile = async () => {
    if (!selectedLecturer) return
    setLoading(true)
    const updateData = {
      full_name: lecturerProfileData.full_name,
      phone: lecturerProfileData.phone,
      title: lecturerProfileData.title,
      specialization: lecturerProfileData.specialization
    }
    if (lecturerProfileImage) {
      updateData.profile_image = lecturerProfileImage
    }
    const { error } = await supabase
      .from('lecturers')
      .update(updateData)
      .eq('id', selectedLecturer.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('UPDATE_LECTURER_PROFILE', `Updated profile for ${lecturerProfileData.full_name}`)
      alert('Profile updated!')
      setShowLecturerProfileModal(false)
      loadLecturers()
    }
    setLoading(false)
  }

  // ========== LECTURER PASSWORD RESET ==========
  const openPasswordModal = (lecturer) => {
    setSelectedLecturerForPassword(lecturer)
    setPasswordData({ newPassword: '', confirmPassword: '' })
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswordModal(true)
  }

  const handleResetPassword = async () => {
    if (!selectedLecturerForPassword) return
    if (!passwordData.newPassword) {
      setPasswordError('Enter a new password')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('lecturers')
      .update({ password: passwordData.newPassword })
      .eq('id', selectedLecturerForPassword.id)
    if (error) {
      setPasswordError(error.message)
    } else {
      await logAction('RESET_LECTURER_PASSWORD', `Reset password for ${selectedLecturerForPassword.full_name}`)
      setPasswordSuccess('Password changed!')
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordData({ newPassword: '', confirmPassword: '' })
        setPasswordSuccess('')
      }, 2000)
    }
    setLoading(false)
  }

  // ========== STUDENT CRUD ==========
  const handleAddStudent = async () => {
    if (!studentForm.full_name || !studentForm.email || !studentForm.password) {
      alert('Please fill Name, Email, and Password')
      return
    }
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: studentForm.email,
      password: studentForm.password,
      options: { data: { full_name: studentForm.full_name, role: 'student' } }
    })
    if (authError) {
      alert('Auth error: ' + authError.message)
      setLoading(false)
      return
    }
    const { error: insertError } = await supabase.from('students').insert([{
      user_id: authData.user?.id,
      student_id: studentForm.student_id || 'STU' + Date.now(),
      full_name: studentForm.full_name,
      email: studentForm.email,
      phone: studentForm.phone || '',
      year: parseInt(studentForm.year) || 1,
      is_active: true,
      password: studentForm.password,
      password_last_updated: new Date().toISOString(),
      password_updated_by: admin?.email
    }])
    if (insertError) {
      alert('Error: ' + insertError.message)
    } else {
      await logAction('CREATE_STUDENT', `Added student: ${studentForm.full_name}`)
      alert('Student added!')
      setShowStudentModal(false)
      setStudentForm({ full_name: '', email: '', password: '', student_id: '', year: '1', phone: '' })
      loadStudents()
      loadStats()
    }
    setLoading(false)
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return
    setLoading(true)
    const { error } = await supabase.from('students').update({
      full_name: studentForm.full_name,
      phone: studentForm.phone,
      year: parseInt(studentForm.year),
      student_id: studentForm.student_id
    }).eq('id', editingStudent.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('EDIT_STUDENT', `Updated student: ${studentForm.full_name}`)
      alert('Student updated!')
      setShowStudentModal(false)
      setEditingStudent(null)
      loadStudents()
    }
    setLoading(false)
  }

  const handleResetStudentPassword = async (student) => {
    const newPassword = prompt(`Enter new password for ${student.full_name}:`)
    if (!newPassword) return
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('students')
      .update({ 
        password: newPassword,
        password_last_updated: new Date().toISOString(),
        password_updated_by: admin?.email
      })
      .eq('id', student.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('RESET_STUDENT_PASSWORD', `Reset password for ${student.full_name}`)
      alert(`Password reset successfully!`)
      loadStudents()
    }
    setLoading(false)
  }

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.full_name}?`)) return
    setLoading(true)
    const { error } = await supabase.from('students').delete().eq('id', student.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('DELETE_STUDENT', `Deleted student: ${student.full_name}`)
      alert('Student deleted!')
      loadStudents()
      loadStats()
    }
    setLoading(false)
  }

  const toggleShowPassword = (studentId) => {
    setShowStudentPassword(prev => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  // ========== NOTICE MANAGEMENT ==========
  const openEditNoticeModal = (notice) => {
    setEditingNotice(notice)
    setEditNoticeData({ title: notice.title, message: notice.message })
    setShowEditNoticeModal(true)
  }

  const handleUpdateNotice = async () => {
    if (!editingNotice) return
    setEditNoticeLoading(true)
    const { error } = await supabase
      .from('notices')
      .update({
        title: editNoticeData.title,
        message: editNoticeData.message
      })
      .eq('id', editingNotice.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('EDIT_NOTICE', `Edited notice: ${editNoticeData.title}`)
      alert('Notice updated!')
      setShowEditNoticeModal(false)
      setEditingNotice(null)
      loadAllNotices()
    }
    setEditNoticeLoading(false)
  }

  const handleDeleteNotice = async (notice) => {
    if (!window.confirm(`Delete notice "${notice.title}"?`)) return
    setLoading(true)
    const { error } = await supabase.from('notices').delete().eq('id', notice.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await logAction('DELETE_NOTICE', `Deleted notice: ${notice.title}`)
      alert('Notice deleted!')
      loadAllNotices()
      loadStats()
    }
    setLoading(false)
  }

  // ========== FILTERED NOTICES ==========
  const filteredNotices = allNotices.filter(notice => 
    notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.courses?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // Calendar helper
  const getCalendarDays = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const noticesByDate = {}
    calendarNotices.forEach(notice => {
      const dateKey = new Date(notice.created_at).toDateString()
      if (!noticesByDate[dateKey]) noticesByDate[dateKey] = []
      noticesByDate[dateKey].push(notice)
    })
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, notices: [] })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateKey = date.toDateString()
      days.push({ day, notices: noticesByDate[dateKey] || [], isToday: date.toDateString() === today.toDateString() })
    }
    return days
  }

  if (loading && !lecturers.length && !allNotices.length) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d5 50%, #d4c5b5 100%)' }}>
        <FaSpinner className="fa-spin text-success" size={40} />
      </div>
    )
  }

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d5 50%, #d4c5b5 100%)' }}>
      
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
      
      {/* ========== HEADER ========== */}
      <nav className="navbar sticky-top shadow-sm px-3 py-2" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
  <div className="d-flex align-items-center w-100">
    <button 
      className="btn d-md-none me-2 p-2" 
      onClick={() => setSidebarOpen(!sidebarOpen)}
      style={{ background: 'transparent', border: 'none', fontSize: '22px' }}
    >
      ☰
    </button>
    
    <a className="navbar-brand d-flex align-items-center gap-2" href="#">
      <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', width: '36px', height: '36px' }}>
        <FaUsers size={18} color="white" />
      </div>
      <span className="fw-bold">CampusBoard Admin</span>
    </a>
    
    <div className="d-flex align-items-center gap-3 ms-auto">
      {/* Date and Time Display */}
      <div className="d-none d-md-block text-end">
  <div className="small fw-semibold" style={{ fontSize: '13px', color: darkMode ? '#e2e8f0' : '#1e293b' }}>
    {currentTime.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Africa/Kampala' })}
  </div>
  <div className="small text-muted" style={{ fontSize: '11px' }}>
    {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Kampala' })}
  </div>
</div>
      
      <button onClick={openShareModal} className="btn btn-outline-success rounded-pill px-2" style={{ fontSize: '12px' }}>
        <FaShareAlt className="me-1" size={12} /> <span className="d-none d-sm-inline">Share</span>
      </button>
      
      <div onClick={toggleDarkMode} style={{ cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(90deg, #1e293b 50%, #f1f5f9 50%)' }} />
      
      <button className="btn btn-link p-0" onClick={() => setShowProfileModal(true)}>
        {profileImageUrl ? (
          <img src={profileImageUrl} alt="Profile" className="rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
        ) : (
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
            <span className="text-white fw-bold">{admin?.full_name?.charAt(0) || 'A'}</span>
          </div>
        )}
      </button>
    </div>
  </div>
</nav>

      {/* ========== ADMIN PROFILE MODAL ========== */}
      {showProfileModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }} onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '30px', textAlign: 'center' }}>
                <div className="position-relative d-inline-block">
                  <div className="rounded-circle bg-white p-1 d-inline-block" style={{ width: '100px', height: '100px' }}>
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center w-100 h-100" style={{ background: '#10B981' }}>
                        <span className="text-white display-4 fw-bold">{admin?.full_name?.charAt(0) || 'A'}</span>
                      </div>
                    )}
                  </div>
                  {isEditingProfile && (
                    <>
                      <button className="btn btn-light rounded-circle position-absolute bottom-0 end-0 p-1 shadow-sm" style={{ width: '30px', height: '30px' }} onClick={() => fileInputRef.current?.click()}>
                        <FaCamera size={12} />
                      </button>
                      {profileImageUrl && (
                        <button className="btn btn-danger rounded-circle position-absolute bottom-0 start-0 p-1 shadow-sm" style={{ width: '30px', height: '30px' }} onClick={handleDeleteAdminImage}>
                          <FaTrash size={12} />
                        </button>
                      )}
                    </>
                  )}
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleProfileImageUpload} />
                </div>
                {!isEditingProfile ? (
                  <h4 className="text-white mt-2 mb-0">{admin?.full_name || 'Admin'}</h4>
                ) : (
                  <input type="text" className="form-control text-center mt-2" style={{ maxWidth: '200px', margin: '0 auto', borderRadius: '50px' }} value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} />
                )}
                <p className="text-white-50 small mb-0 mt-1"><FaShieldAlt className="me-1" size={12} /> System Administrator</p>
              </div>
              <div className={`modal-body p-3 ${darkMode ? 'bg-dark' : ''}`}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className={`p-2 rounded-3 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-2"><FaUserCircle className="me-2" /> Personal</h6>
                      <div className="mb-2"><label className="small text-muted">Full Name</label>
                        {!isEditingProfile ? <p className="mb-0">{admin?.full_name || 'Not set'}</p> : <input type="text" className="form-control form-control-sm" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} />}
                      </div>
                      <div className="mb-2"><label className="small text-muted">Email</label><p className="mb-0"><FaEnvelope className="me-1" size={12} /> {admin?.email}</p></div>
                      <div><label className="small text-muted">Phone</label>
                        {!isEditingProfile ? <p className="mb-0"><FaPhone className="me-1" size={12} /> {admin?.phone || 'Not provided'}</p> : <input type="tel" className="form-control form-control-sm" value={editProfileData.phone} onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} />}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className={`p-2 rounded-3 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-2"><FaIdCard className="me-2" /> Account</h6>
                      <p className="mb-1"><strong>Role:</strong> <span className="badge bg-primary">Super Admin</span></p>
                      <p className="mb-0"><strong>Joined:</strong> {admin?.created_at ? new Date(admin.created_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' }) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer p-3">
                {!isEditingProfile ? (
                  <><button className="btn btn-primary rounded-pill px-3 py-1" onClick={() => setIsEditingProfile(true)}><FaEdit className="me-1" size={12} /> Edit</button>
                  <button className="btn btn-secondary rounded-pill px-3 py-1" onClick={() => setShowProfileModal(false)}>Close</button></>
                ) : (
                  <><button className="btn btn-success rounded-pill px-3 py-1" onClick={handleSaveProfile} disabled={loading}><FaSave className="me-1" size={12} /> Save</button>
                  <button className="btn btn-outline-danger rounded-pill px-3 py-1" onClick={() => { setIsEditingProfile(false); }}><FaTimes className="me-1" size={12} /> Cancel</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== LECTURER PROFILE MODAL ========== */}
      {showLecturerProfileModal && selectedLecturer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={() => { setShowLecturerProfileModal(false); setIsEditingLecturerProfile(false); }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '25px', textAlign: 'center' }}>
                <div className="position-relative d-inline-block">
                  <div className="rounded-circle bg-white p-1 d-inline-block" style={{ width: '90px', height: '90px' }}>
                    {lecturerProfilePreview ? (
                      <img src={lecturerProfilePreview} alt="Profile" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center w-100 h-100" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        <span className="text-white display-5 fw-bold">{selectedLecturer.full_name?.charAt(0)?.toUpperCase() || 'L'}</span>
                      </div>
                    )}
                  </div>
                  {isEditingLecturerProfile && (
                    <button className="btn btn-light rounded-circle position-absolute bottom-0 end-0 p-1 shadow-sm" style={{ width: '28px', height: '28px' }} onClick={() => lecturerFileInputRef.current?.click()}>
                      <FaCamera size={11} />
                    </button>
                  )}
                  <input type="file" ref={lecturerFileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleLecturerProfileImageSelect} />
                  {isEditingLecturerProfile && lecturerProfilePreview && (
                    <button className="btn btn-danger rounded-circle position-absolute p-1 shadow-sm" style={{ width: '28px', height: '28px', left: '5px', bottom: '5px' }} onClick={handleDeleteLecturerImage} title="Remove image">
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
                {!isEditingLecturerProfile ? (
                  <><h5 className="text-white mt-2 mb-0">{selectedLecturer.full_name}</h5><p className="text-white-50 small mb-0">{selectedLecturer.title} • {selectedLecturer.specialization}</p><p className="text-white-50 small mt-1">ID: {selectedLecturer.lecturer_id}</p></>
                ) : (
                  <><input type="text" className="form-control text-center mt-2" style={{ maxWidth: '220px', margin: '0 auto', borderRadius: '50px', fontSize: '13px' }} value={lecturerProfileData.full_name} onChange={e => setLecturerProfileData({...lecturerProfileData, full_name: e.target.value})} />
                  <div className="d-flex gap-2 justify-content-center mt-2"><select className="form-select" style={{ width: '100px', fontSize: '12px' }} value={lecturerProfileData.title} onChange={e => setLecturerProfileData({...lecturerProfileData, title: e.target.value})}><option>Dr.</option><option>Prof.</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option></select><input type="text" className="form-control" style={{ width: '150px', fontSize: '12px' }} placeholder="Specialization" value={lecturerProfileData.specialization} onChange={e => setLecturerProfileData({...lecturerProfileData, specialization: e.target.value})} /></div></>
                )}
              </div>
              <div className={`modal-body p-3 ${darkMode ? 'bg-dark' : ''}`}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className={`p-2 rounded-3 ${darkMode ? 'bg-secondary' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-2"><FaEnvelope className="me-2" /> Contact</h6>
                      {!isEditingLecturerProfile ? (
                        <><p className="mb-1"><strong>Email:</strong> {selectedLecturer.email}</p><p className="mb-0"><strong>Phone:</strong> {selectedLecturer.phone || 'Not provided'}</p></>
                      ) : (
                        <><div className="mb-2"><label className="small text-muted">Email</label><input type="email" className="form-control form-control-sm" value={lecturerProfileData.email} disabled /></div>
                        <div><label className="small text-muted">Phone</label><input type="tel" className="form-control form-control-sm" value={lecturerProfileData.phone} onChange={e => setLecturerProfileData({...lecturerProfileData, phone: e.target.value})} placeholder="Phone" /></div></>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className={`p-2 rounded-3 ${darkMode ? 'bg-secondary' : 'bg-light'}`}>
                      <h6 className="fw-bold mb-2"><FaIdCard className="me-2" /> Academic</h6>
                      <p className="mb-1"><strong>ID:</strong> {selectedLecturer.lecturer_id}</p>
                      <p className="mb-1"><strong>Status:</strong> <span className={`badge ${selectedLecturer.is_active ? 'bg-success' : 'bg-secondary'}`}>{selectedLecturer.is_active ? 'Active' : 'Inactive'}</span></p>
                      <p className="mb-0"><strong>Joined:</strong> {new Date(selectedLecturer.created_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' })}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer p-3">
                {!isEditingLecturerProfile ? (
                  <><button className="btn btn-primary rounded-pill px-3 py-1" onClick={() => setIsEditingLecturerProfile(true)}><FaEdit className="me-1" size={10} /> Edit</button>
                  <button className="btn btn-warning rounded-pill px-3 py-1" onClick={() => { setShowLecturerProfileModal(false); openPasswordModal(selectedLecturer); }}><FaKey className="me-1" size={10} /> Reset</button>
                  <button className="btn btn-secondary rounded-pill px-3 py-1" onClick={() => setShowLecturerProfileModal(false)}>Close</button></>
                ) : (
                  <><button className="btn btn-success rounded-pill px-3 py-1" onClick={handleSaveLecturerProfile} disabled={loading}><FaSave className="me-1" size={10} /> Save</button>
                  <button className="btn btn-outline-danger rounded-pill px-3 py-1" onClick={() => { setIsEditingLecturerProfile(false); }}><FaTimes className="me-1" size={10} /> Cancel</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== COURSE ASSIGNMENT MODAL WITH ROLE SELECTION ========== */}
      {showAssignmentModal && selectedLecturerForAssignment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} onClick={() => setShowAssignmentModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3">
                <h5 className="modal-title"><FaLink className="me-2" /> Assign Courses to {selectedLecturerForAssignment.full_name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignmentModal(false)}></button>
              </div>
              <div className="modal-body p-3">
                <p className="small text-muted mb-3">
                  Select courses and choose role:
                  <span className="badge bg-primary ms-2 me-1">⭐ Main Lecturer</span>
                  <span className="badge bg-secondary">👥 Assistant</span>
                </p>
                
                {/* Warning for multiple main courses */}
                {Object.values(selectedCourseRoles).filter(r => r === 'main').length > 3 && (
                  <div className="alert alert-warning py-2 mb-3 small">
                    ⚠️ This lecturer is MAIN for {Object.values(selectedCourseRoles).filter(r => r === 'main').length} courses. Consider reducing workload.
                  </div>
                )}
                
                <div className="row g-2">
                  {availableCourses.map(course => {
                    const isSelected = selectedCourseIds.includes(course.id)
                    const role = selectedCourseRoles[course.id] || 'assistant'
                    
                    return (
                      <div key={course.id} className="col-12 col-md-6">
                        <div 
                          className={`p-2 rounded-3 border ${isSelected ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                              <input 
                                type="checkbox" 
                                className="form-check-input m-0"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedCourseIds(prev => prev.filter(id => id !== course.id))
                                    const newRoles = { ...selectedCourseRoles }
                                    delete newRoles[course.id]
                                    setSelectedCourseRoles(newRoles)
                                  } else {
                                    setSelectedCourseIds(prev => [...prev, course.id])
                                    setSelectedCourseRoles(prev => ({ ...prev, [course.id]: 'assistant' }))
                                  }
                                }}
                              />
                              <div>
                                <strong>{course.code}</strong>
                                <div className="small text-muted">{course.name}</div>
                              </div>
                            </div>
                            {isSelected && (
                              <select 
                                className="form-select form-select-sm w-auto"
                                style={{ width: '120px' }}
                                value={role}
                                onChange={(e) => {
                                  setSelectedCourseRoles(prev => ({ ...prev, [course.id]: e.target.value }))
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="assistant">👥 Assistant</option>
                                <option value="main">⭐ Main Lecturer</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {availableCourses.length === 0 && (
                  <div className="text-center py-3 text-muted">No courses available. Please add courses first.</div>
                )}
              </div>
              <div className="modal-footer p-3">
                <button className="btn btn-secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAssignCourses} disabled={loading}>
                  {loading ? 'Saving...' : `Save (${selectedCourseIds.length} courses)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== STUDENT ENROLLMENT MODAL ========== */}
      {showEnrollmentModal && selectedStudentForEnrollment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} onClick={() => setShowEnrollmentModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3">
                <h5 className="modal-title"><FaUserPlus className="me-2" /> Enroll {selectedStudentForEnrollment.full_name} in Courses</h5>
                <button type="button" className="btn-close" onClick={() => setShowEnrollmentModal(false)}></button>
              </div>
              <div className="modal-body p-3">
                <p className="small text-muted mb-3">Select all courses this student is enrolled in:</p>
                <div className="row g-2">
                  {availableCoursesForStudent.map(course => (
                    <div key={course.id} className="col-12 col-md-6">
                      <div 
                        className={`p-2 rounded-3 border cursor-pointer ${selectedEnrollmentCourseIds.includes(course.id) ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (selectedEnrollmentCourseIds.includes(course.id)) {
                            setSelectedEnrollmentCourseIds(prev => prev.filter(id => id !== course.id))
                          } else {
                            setSelectedEnrollmentCourseIds(prev => [...prev, course.id])
                          }
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="form-check-input m-0"
                            checked={selectedEnrollmentCourseIds.includes(course.id)}
                            onChange={() => {}}
                          />
                          <div>
                            <strong>{course.code}</strong>
                            <div className="small text-muted">{course.name}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {availableCoursesForStudent.length === 0 && (
                  <div className="text-center py-3 text-muted">No courses available. Please add courses first.</div>
                )}
              </div>
              <div className="modal-footer p-3">
                <button className="btn btn-secondary" onClick={() => setShowEnrollmentModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleEnrollCourses} disabled={loading}>
                  {loading ? 'Saving...' : `Save (${selectedEnrollmentCourseIds.length} courses)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT NOTICE MODAL ========== */}
      {showEditNoticeModal && editingNotice && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={() => setShowEditNoticeModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3"><h5 className="modal-title"><FaEdit className="me-2" /> Edit Notice</h5><button type="button" className="btn-close" onClick={() => setShowEditNoticeModal(false)}></button></div>
              <div className="modal-body p-3"><div className="mb-2"><label className="form-label">Title</label><input type="text" className="form-control" value={editNoticeData.title} onChange={e => setEditNoticeData({...editNoticeData, title: e.target.value})} /></div><div className="mb-2"><label className="form-label">Message</label><textarea className="form-control" rows="4" value={editNoticeData.message} onChange={e => setEditNoticeData({...editNoticeData, message: e.target.value})} /></div><small className="text-muted">Course: {editingNotice.courses?.code} - {editingNotice.courses?.name}</small></div>
              <div className="modal-footer p-3"><button className="btn btn-secondary" onClick={() => setShowEditNoticeModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleUpdateNotice} disabled={editNoticeLoading}>{editNoticeLoading ? 'Saving...' : 'Save'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ========== PASSWORD RESET MODAL ========== */}
      {showPasswordModal && selectedLecturerForPassword && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3"><h5 className="modal-title"><FaKey className="me-2" /> Reset Password</h5><button type="button" className="btn-close" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}></button></div>
              <div className="modal-body p-3">{passwordError && <div className="alert alert-danger py-1">{passwordError}</div>}{passwordSuccess && <div className="alert alert-success py-1">{passwordSuccess}</div>}<div className="mb-2"><label className="form-label">New Password</label><input type="password" className="form-control" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} /></div><div className="mb-2"><label className="form-label">Confirm Password</label><input type="password" className="form-control" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} /></div><small className="text-muted">Password must be at least 6 characters</small></div>
              <div className="modal-footer p-3"><button className="btn btn-secondary" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}>Cancel</button><button className="btn btn-primary" onClick={handleResetPassword} disabled={loading}>{loading ? 'Resetting...' : 'Reset'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ========== SIDEBAR ========== */}
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
              <button onClick={() => { setActiveTab('lecturers'); setSidebarOpen(false); }} 
                className="nav-link-lecturers w-100 text-start rounded-3 border-0 py-2 px-3"
                style={{ fontWeight: '500' }}>
                <FaChalkboardTeacher className="me-2" size={16} /> Lecturers
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => { setActiveTab('students'); setSidebarOpen(false); }} 
                className="nav-link-students w-100 text-start rounded-3 border-0 py-2 px-3"
                style={{ fontWeight: '500' }}>
                <FaUserGraduate className="me-2" size={16} /> Students
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => { setActiveTab('courses'); setSidebarOpen(false); }} 
                className="nav-link-courses w-100 text-start rounded-3 border-0 py-2 px-3"
                style={{ fontWeight: '500', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white' }}>
                <FaBook className="me-2" size={16} /> Courses
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => { setActiveTab('notices'); setSidebarOpen(false); }} 
                className="nav-link-notices w-100 text-start rounded-3 border-0 py-2 px-3"
                style={{ fontWeight: '500' }}>
                <FaBell className="me-2" size={16} /> Notices
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => { setActiveTab('month'); setSidebarOpen(false); }} 
                className="nav-link-month w-100 text-start rounded-3 border-0 py-2 px-3"
                style={{ fontWeight: '500' }}>
                <FaCalendarAlt className="me-2" size={16} /> Month View
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => { setActiveTab('audit'); setSidebarOpen(false); }} 
                className="nav-link-audit w-100 text-start rounded-3 border-0 py-2 px-3"
                style={{ fontWeight: '500' }}>
                <FaHistory className="me-2" size={16} /> Audit Log
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

      {/* ========== MAIN CONTENT ========== */}
      <div className="main-content" style={{ width: '100%', minHeight: 'calc(100vh - 56px)', transition: 'margin-left 0.3s ease' }}>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4">Dashboard</h1>
              <div className="d-flex gap-2">
                <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Export</button>
              </div>
            </div>
            <div className="row g-3 mb-4">
              {/* Card 1: Lecturers */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('lecturers')}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="bg-white bg-opacity-25 rounded-circle p-2"><FaChalkboardTeacher size={16} /></div>
                      <span className="badge bg-light text-dark small">+{stats.growth}%</span>
                    </div>
                    <h3 className="fw-bold mt-2 mb-0 fs-2">{stats.totalLecturers}</h3>
                    <p className="mb-0 small">Lecturers</p>
                    <small className="opacity-75">{stats.activeLecturers} Active</small>
                  </div>
                </div>
              </div>

              {/* Card 2: Students */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('students')}>
                  <div className="card-body p-3">
                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaUserGraduate size={16} /></div>
                    <h3 className="fw-bold mb-0 fs-2">{stats.totalStudents}</h3>
                    <p className="mb-0 small">Students</p>
                    <small className="opacity-75">Enrolled</small>
                  </div>
                </div>
              </div>

              {/* Card 3: Courses */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('courses')}>
                  <div className="card-body p-3">
                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaBook size={16} /></div>
                    <h3 className="fw-bold mb-0 fs-2">{stats.totalCourses || 0}</h3>
                    <p className="mb-0 small">Courses</p>
                    <small className="opacity-75">Active</small>
                  </div>
                </div>
              </div>

              {/* Card 4: Notices */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('notices')}>
                  <div className="card-body p-3">
                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaBell size={16} /></div>
                    <h3 className="fw-bold mb-0 fs-2">{stats.totalNotices}</h3>
                    <p className="mb-0 small">Notices</p>
                    <small className="opacity-75">Total posted</small>
                  </div>
                </div>
              </div>

              {/* Card 5: Month View */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('month')}>
                  <div className="card-body p-3">
                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaCalendarAlt size={16} /></div>
                    <h3 className="fw-bold mb-0 fs-2">{stats.noticesThisMonth}</h3>
                    <p className="mb-0 small">This Month</p>
                    <small className="opacity-75">Notices</small>
                  </div>
                </div>
              </div>

              {/* Card 6: Audit Log */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card text-white border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('audit')}>
                  <div className="card-body p-3">
                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-inline-block mb-2"><FaHistory size={16} /></div>
                    <h3 className="fw-bold mb-0 fs-2">{auditLogs.length}</h3>
                    <p className="mb-0 small">Audit Logs</p>
                    <small className="opacity-75">Activities</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="card border-0 shadow-sm"><div className="card-body p-3"><h6 className="fw-bold mb-2">Quick Actions</h6><div className="d-flex flex-wrap gap-2"><button onClick={() => { setActiveTab('lecturers'); setShowLecturerModal(true); }} className="btn btn-primary btn-sm rounded-pill"><FaPlus size={10} className="me-1" /> Add Lecturer</button><button onClick={() => { setActiveTab('students'); setShowStudentModal(true); }} className="btn btn-success btn-sm rounded-pill"><FaPlus size={10} className="me-1" /> Add Student</button><button onClick={() => { setActiveTab('courses'); setShowCourseModal(true); }} className="btn btn-warning btn-sm rounded-pill"><FaPlus size={10} className="me-1" /> Add Course</button><button onClick={() => setActiveTab('notices')} className="btn btn-outline-secondary btn-sm rounded-pill"><FaEye size={10} className="me-1" /> View Notices</button></div></div></div>
          </div>
        )}

        {/* Lecturers Tab */}
        {activeTab === 'lecturers' && (
          <div className="p-3">
            <div className="d-flex justify-content-between flex-wrap align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4">Manage Lecturers</h1>
              <div className="d-flex gap-2">
                <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Excel</button>
                <button onClick={exportToPDF} className="btn btn-sm btn-outline-danger"><FaFilePdf size={12} className="me-1" /> PDF</button>
                <button onClick={() => { setEditingLecturer(null); setLecturerForm({ full_name: '', email: '', password: '', phone: '', title: 'Mr.', specialization: '' }); setShowLecturerModal(true); }} className="btn btn-primary btn-sm"><FaPlus size={12} className="me-1" /> Add</button>
              </div>
            </div>
            <div className="row g-3">
              {lecturers.map((lec, idx) => {
                const colors = ['linear-gradient(135deg, #667eea, #764ba2)', 'linear-gradient(135deg, #11998e, #38ef7d)', 'linear-gradient(135deg, #f093fb, #f5576c)', 'linear-gradient(135deg, #4facfe, #00f2fe)', 'linear-gradient(135deg, #fa709a, #fee140)']
                return (
                  <div key={lec.id} className="col-12 col-sm-6 col-lg-4">
                    <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ background: colors[idx % colors.length], padding: '15px', color: 'white' }}>
                        <div className="d-flex justify-content-between">
                          <div className="d-flex gap-2">
                            <button onClick={() => openLecturerProfileModal(lec)} className="rounded-circle border-0 bg-white bg-opacity-25" style={{ width: '50px', height: '50px' }}><span className="fw-bold fs-4">{lec.full_name?.charAt(0)?.toUpperCase() || 'L'}</span></button>
                            <div><h6 className="fw-bold mb-0">{lec.full_name?.split(' ')[0]}</h6><small className="opacity-75">{lec.title}</small></div>
                          </div>
                          <span className={`badge ${lec.is_active ? 'bg-success' : 'bg-secondary'}`}>{lec.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      <div className="card-body p-3">
                        <p className="mb-1 small"><FaEnvelope className="me-1" size={10} /> {lec.email?.split('@')[0]}...</p>
                        <p className="mb-2 small"><FaPhone className="me-1" size={10} /> {lec.phone || 'Not provided'}</p>
                        <div className="d-flex gap-1 flex-wrap">
                          <button onClick={() => { setEditingLecturer(lec); setLecturerForm({ full_name: lec.full_name, email: lec.email, password: '', phone: lec.phone || '', title: lec.title || 'Mr.', specialization: lec.specialization || '' }); setShowLecturerModal(true); }} className="btn btn-sm btn-outline-secondary rounded-pill" style={{ fontSize: '10px', padding: '4px 8px' }}><FaEdit size={9} className="me-1" /> Edit</button>
                          <button onClick={() => openAssignmentModal(lec)} className="btn btn-sm btn-outline-info rounded-pill" style={{ fontSize: '10px', padding: '4px 8px' }}><FaLink size={9} className="me-1" /> Courses</button>
                          <button onClick={() => handleToggleLecturerStatus(lec)} className={`btn btn-sm ${lec.is_active ? 'btn-outline-warning' : 'btn-outline-success'} rounded-pill`} style={{ fontSize: '10px', padding: '4px 8px' }}>{lec.is_active ? <><FaBan size={9} /> Deact</> : <><FaUndo size={9} /> Act</>}</button>
                          <button onClick={() => handleDeleteLecturer(lec)} className="btn btn-sm btn-outline-danger rounded-pill" style={{ fontSize: '10px', padding: '4px 8px' }}><FaTrashAlt size={9} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="p-3">
            <div className="d-flex justify-content-between flex-wrap align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4">Manage Students</h1>
              <div className="d-flex gap-2">
                <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Excel</button>
                <button onClick={exportToPDF} className="btn btn-sm btn-outline-danger"><FaFilePdf size={12} className="me-1" /> PDF</button>
                <button onClick={() => { setEditingStudent(null); setStudentForm({ full_name: '', email: '', password: '', student_id: '', year: '1', phone: '' }); setShowStudentModal(true); }} className="btn btn-primary btn-sm"><FaPlus size={12} className="me-1" /> Add</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead>
                  <tr><th>Name</th><th>Student ID</th><th>Email</th><th>Year</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {students.slice(0, 20).map(s => (
                    <tr key={s.id}>
                      <td className="fw-semibold">{s.full_name?.split(' ')[0]}</td>
                      <td>{s.student_id}</td>
                      <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</td>
                      <td>Year {s.year}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button onClick={() => { setEditingStudent(s); setStudentForm({ full_name: s.full_name, email: s.email, password: '', student_id: s.student_id || '', year: s.year?.toString() || '1', phone: s.phone || '' }); setShowStudentModal(true); }} className="btn btn-sm btn-outline-primary"><FaEdit size={10} /></button>
                          <button onClick={() => openEnrollmentModal(s)} className="btn btn-sm btn-outline-info"><FaBookOpen size={10} /></button>
                          <button onClick={() => handleResetStudentPassword(s)} className="btn btn-sm btn-outline-warning"><FaKey size={10} /></button>
                          <button onClick={() => handleDeleteStudent(s)} className="btn btn-sm btn-outline-danger"><FaTrashAlt size={10} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="p-3">
            <div className="d-flex justify-content-between flex-wrap align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4">Manage Courses</h1>
              <div className="d-flex gap-2">
                <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Excel</button>
                <button onClick={exportToPDF} className="btn btn-sm btn-outline-danger"><FaFilePdf size={12} className="me-1" /> PDF</button>
                <button onClick={() => { setEditingCourse(null); setCourseForm({ code: '', name: '', description: '', credits: 3, department: '' }); setShowCourseModal(true); }} className="btn btn-primary btn-sm"><FaPlus size={12} className="me-1" /> Add Course</button>
              </div>
            </div>
            <div className="row g-3">
              {courses && courses.length > 0 ? (
                courses.map(course => (
                  <div key={course.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="badge bg-warning text-dark fs-6 px-3 py-2">{course.code || 'N/A'}</span>
                            <h6 className="fw-bold mt-2 mb-1">{course.name || 'Unnamed Course'}</h6>
                          </div>
                          <div className="d-flex gap-1">
                            <button onClick={() => { setEditingCourse(course); setCourseForm({ code: course.code || '', name: course.name || '', description: course.description || '', credits: course.credits || 3, department: course.department || '' }); setShowCourseModal(true); }} className="btn btn-sm btn-outline-primary"><FaEdit size={12} /></button>
                            <button onClick={() => handleDeleteCourse(course)} className="btn btn-sm btn-outline-danger"><FaTrashAlt size={12} /></button>
                          </div>
                        </div>
                        <p className="small text-muted mb-2">{course.description || 'No description'}</p>
                        <div className="d-flex gap-2 mt-2">
                          <span className="badge bg-info">Credits: {course.credits || 3}</span>
                          <span className="badge bg-secondary">{course.department || 'General'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">No courses yet. Click "Add Course" to create your first course.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === 'notices' && (
          <div className="p-3">
            <div className="d-flex justify-content-between flex-wrap align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4">All Notices</h1>
              <div className="d-flex gap-2">
                <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                <button onClick={exportToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Excel</button>
                <button onClick={exportToPDF} className="btn btn-sm btn-outline-danger"><FaFilePdf size={12} className="me-1" /> PDF</button>
                <div className="position-relative"><FaSearch className="position-absolute top-50 start-0 translate-middle-y text-muted ms-2" size={12} /><input type="text" className="form-control ps-5 rounded-pill" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '140px', fontSize: '12px' }} /></div>
              </div>
            </div>
            <div className="row g-2">
              {filteredNotices.slice(0, 15).map(n => (
                <div key={n.id} className="col-12">
                  <div className="card border-0 shadow-sm"><div className="card-body p-3"><div className="d-flex justify-content-between"><div><span className="badge bg-primary me-2">{n.courses?.code}</span><span className="text-muted small">{new Date(n.created_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' })}</span><h6 className="fw-bold mt-1 mb-1">{n.title}</h6><p className="small mb-0">{n.message.length > 80 ? n.message.substring(0, 80) + '...' : n.message}</p></div><div><button onClick={() => openEditNoticeModal(n)} className="btn btn-sm btn-outline-primary rounded-pill me-1"><FaEdit size={10} /></button><button onClick={() => handleDeleteNotice(n)} className="btn btn-sm btn-outline-danger rounded-pill"><FaTrashAlt size={10} /></button></div></div></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Month Tab */}
        {activeTab === 'month' && (
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4"><FaCalendarAlt className="me-2" /> {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h1>
              <button onClick={() => loadMonthlyNotices()} className="btn btn-primary btn-sm">Refresh</button>
            </div>
            <div className="card border-0 shadow-sm" style={{ overflow: 'auto' }}>
              <div className="card-body p-2" style={{ minWidth: '550px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e5e7eb' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center p-1 fw-bold bg-light" style={{ fontSize: '11px' }}>{d}</div>)}
                  {getCalendarDays().slice(0, 35).map((item, idx) => (
                    <div key={idx} className="p-1 bg-white" style={{ minHeight: '70px', border: item.isToday ? '1px solid #8B5CF6' : 'none' }}>
                      {item.day && <span className="fw-semibold" style={{ fontSize: '11px' }}>{item.day}</span>}
                      {item.notices?.slice(0, 1).map((n, i) => <div key={i} className="mt-1 p-1 rounded bg-light" style={{ fontSize: '8px', cursor: 'pointer' }} onClick={() => alert(n.title)}>{n.title.length > 12 ? n.title.substring(0, 12) + '...' : n.title}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h1 className="h4">Audit Log</h1>
              <div className="d-flex gap-2">
                <button onClick={openShareModal} className="btn btn-sm btn-outline-success"><FaShareAlt size={12} className="me-1" /> Share</button>
                <button onClick={exportAuditToExcel} className="btn btn-sm btn-outline-primary"><FaFileExcel size={12} className="me-1" /> Excel</button>
              </div>
            </div>

              <div className="mb-2">
                <select 
                  className={`form-select form-select-sm rounded-pill ${darkMode ? 'bg-dark text-white' : ''}`} 
                  onChange={(e) => setActionFilter(e.target.value)}
                  value={actionFilter}
                >
                  <option value="all">All Actions</option>
                   <option value="LOGIN">🔐 Login</option>
                   <option value="LOGOUT">🚪 Logout</option>
                   <option value="CREATE_LECTURER">➕ Create Lecturer</option>
                   <option value="EDIT_LECTURER">✏️ Edit Lecturer</option>
                   <option value="DELETE_LECTURER">❌ Delete Lecturer</option>
                   <option value="ACTIVATE_LECTURER">🔒 Activate Lecturer</option>
                   <option value="DEACTIVATE_LECTURER">🔓 Deactivate Lecturer</option>
                   <option value="RESET_LECTURER_PASSWORD">🔑 Reset Lecturer Pass</option>
                   <option value="CREATE_STUDENT">➕ Create Student</option>
                   <option value="EDIT_STUDENT">✏️ Edit Student</option>
                   <option value="DELETE_STUDENT">❌ Delete Student</option>
                   <option value="RESET_STUDENT_PASSWORD">🔑 Reset Student Pass</option>
                   <option value="CREATE_COURSE">➕ Create Course</option>
                   <option value="EDIT_COURSE">✏️ Edit Course</option>
                   <option value="DELETE_COURSE">❌ Delete Course</option>
                   <option value="ASSIGN_COURSES">🔗 Assign Courses</option>
                   <option value="ENROLL_COURSES">📚 Enroll Courses</option>
                   <option value="POST_NOTICE">📢 Post Notice</option>
                   <option value="EDIT_NOTICE">✏️ Edit Notice</option>
                   <option value="DELETE_NOTICE">🗑️ Delete Notice</option>
                   <option value="VIEW_NOTICE">👁️ View Notice</option>
                   <option value="UPDATE_STUDENT_PROFILE">✏️ Update Student Profile</option>
                   <option value="UPDATE_STUDENT_IMAGE">🖼️ Update Student Image</option>
                   <option value="UPDATE_LECTURER_PROFILE">✏️ Update Lecturer Profile</option>
                   <option value="UPDATE_LECTURER_IMAGE">🖼️ Update Lecturer Image</option>
                   <option value="UPDATE_ADMIN_PROFILE">✏️ Update Admin Profile</option>
                   <option value="UPDATE_ADMIN_IMAGE">🖼️ Update Admin Image</option>
                   <option value="EXPORT_EXCEL">📊 Export Excel</option>
                   <option value="EXPORT_PDF">📊 Export PDF</option>
                   <option value="PRINT">🖨️ Print</option>
                   <option value="SHARE_WHATSAPP">📱 Share WhatsApp</option>
                   <option value="SHARE_TELEGRAM">📱 Share Telegram</option>
                   <option value="SHARE_EMAIL">📧 Share Email</option>
                 </select>
              </div>

            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Details</th>
                    <th>Date & Time (Kampala)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs && filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.slice(0, 100).map((log) => (
                      <tr key={log.id || Math.random()}>
                        <td>
                          <span className={`badge ${
                            log.action === 'LOGIN' ? 'bg-success' : 
                            log.action === 'LOGOUT' ? 'bg-warning text-dark' : 
                            log.action === 'DELETE_LECTURER' || log.action === 'DELETE_STUDENT' || log.action === 'DELETE_NOTICE' ? 'bg-danger' : 
                            log.action === 'VIEW_NOTICE' ? 'bg-info' :
                            'bg-secondary'
                          }`}>
                            {log.action === 'LOGIN' ? '🔐 LOGIN' : 
                             log.action === 'LOGOUT' ? '🚪 LOGOUT' : 
                             log.action === 'VIEW_NOTICE' ? '👁️ VIEW' :
                             log.action}
                          </span>
                        </td>
                        <td>{log.admin_email ? log.admin_email.split('@')[0] : 'System'}</td>
                        <td>{log.details || 'No details'}</td>
                        <td style={{ fontSize: '12px' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Kampala' }) : 'Unknown date'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No audit logs found. Actions will appear here as you use the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ========== ADD LECTURER MODAL ========== */}
      {showLecturerModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} onClick={() => { setShowLecturerModal(false); setEditingLecturer(null); }}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3"><h5 className="modal-title">{editingLecturer ? 'Edit Lecturer' : 'Add Lecturer'}</h5><button type="button" className="btn-close" onClick={() => { setShowLecturerModal(false); setEditingLecturer(null); }}></button></div>
              <div className="modal-body p-3">
                <div className="mb-2"><label className="form-label">Full Name *</label><input type="text" className="form-control" value={lecturerForm.full_name} onChange={e => setLecturerForm({...lecturerForm, full_name: e.target.value})} /></div>
                <div className="mb-2"><label className="form-label">Email *</label><input type="email" className="form-control" value={lecturerForm.email} onChange={e => setLecturerForm({...lecturerForm, email: e.target.value})} disabled={!!editingLecturer} /></div>
                {!editingLecturer && <div className="mb-2"><label className="form-label">Password *</label><input type="password" className="form-control" value={lecturerForm.password} onChange={e => setLecturerForm({...lecturerForm, password: e.target.value})} /></div>}
                <div className="row"><div className="col-6 mb-2"><label className="form-label">Title</label><input type="text" className="form-control" value={lecturerForm.title} onChange={e => setLecturerForm({...lecturerForm, title: e.target.value})} /></div><div className="col-6 mb-2"><label className="form-label">Specialization</label><input type="text" className="form-control" value={lecturerForm.specialization} onChange={e => setLecturerForm({...lecturerForm, specialization: e.target.value})} /></div></div>
                <div><label className="form-label">Phone</label><input type="tel" className="form-control" value={lecturerForm.phone} onChange={e => setLecturerForm({...lecturerForm, phone: e.target.value})} /></div>
              </div>
              <div className="modal-footer p-3"><button className="btn btn-secondary" onClick={() => { setShowLecturerModal(false); setEditingLecturer(null); }}>Cancel</button><button className="btn btn-primary" onClick={editingLecturer ? handleUpdateLecturer : handleAddLecturer} disabled={loading}>{loading ? 'Saving...' : (editingLecturer ? 'Update' : 'Add')}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ========== ADD/EDIT COURSE MODAL ========== */}
      {showCourseModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} onClick={() => { setShowCourseModal(false); setEditingCourse(null); }}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3"><h5 className="modal-title">{editingCourse ? 'Edit Course' : 'Add Course'}</h5><button type="button" className="btn-close" onClick={() => { setShowCourseModal(false); setEditingCourse(null); }}></button></div>
              <div className="modal-body p-3">
                <div className="mb-2"><label className="form-label">Course Code *</label><input type="text" className="form-control" placeholder="e.g., CSC101" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} /></div>
                <div className="mb-2"><label className="form-label">Course Name *</label><input type="text" className="form-control" placeholder="e.g., Introduction to Programming" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} /></div>
                <div className="mb-2"><label className="form-label">Description</label><textarea className="form-control" rows="2" placeholder="Course description..." value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} /></div>
                <div className="row"><div className="col-6 mb-2"><label className="form-label">Credits</label><input type="number" className="form-control" value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: e.target.value})} /></div><div className="col-6 mb-2"><label className="form-label">Department</label><input type="text" className="form-control" placeholder="Department" value={courseForm.department} onChange={e => setCourseForm({...courseForm, department: e.target.value})} /></div></div>
              </div>
              <div className="modal-footer p-3"><button className="btn btn-secondary" onClick={() => { setShowCourseModal(false); setEditingCourse(null); }}>Cancel</button><button className="btn btn-primary" onClick={editingCourse ? handleUpdateCourse : handleAddCourse} disabled={loading}>{loading ? 'Saving...' : (editingCourse ? 'Update' : 'Add')}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ========== ADD STUDENT MODAL ========== */}
      {showStudentModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} onClick={() => { setShowStudentModal(false); setEditingStudent(null); }}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white' : ''}`} style={{ borderRadius: '20px' }}>
              <div className="modal-header p-3"><h5 className="modal-title">{editingStudent ? 'Edit Student' : 'Add Student'}</h5><button type="button" className="btn-close" onClick={() => { setShowStudentModal(false); setEditingStudent(null); }}></button></div>
              <div className="modal-body p-3">
                <div className="mb-2"><label className="form-label">Full Name *</label><input type="text" className="form-control" value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} /></div>
                <div className="mb-2"><label className="form-label">Email *</label><input type="email" className="form-control" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} disabled={!!editingStudent} /></div>
                {!editingStudent && <div className="mb-2"><label className="form-label">Password *</label><input type="password" className="form-control" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} /></div>}
                <div className="row"><div className="col-6 mb-2"><label className="form-label">Student ID</label><input type="text" className="form-control" value={studentForm.student_id} onChange={e => setStudentForm({...studentForm, student_id: e.target.value})} /></div><div className="col-6 mb-2"><label className="form-label">Year</label><select className="form-select" value={studentForm.year} onChange={e => setStudentForm({...studentForm, year: e.target.value})}><option>1</option><option>2</option><option>3</option><option>4</option></select></div></div>
                <div><label className="form-label">Phone</label><input type="tel" className="form-control" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} /></div>
              </div>
              <div className="modal-footer p-3"><button className="btn btn-secondary" onClick={() => { setShowStudentModal(false); setEditingStudent(null); }}>Cancel</button><button className="btn btn-primary" onClick={editingStudent ? handleUpdateStudent : handleAddStudent} disabled={loading}>{loading ? 'Saving...' : (editingStudent ? 'Update' : 'Add')}</button></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fa-spin { animation: fa-spin 2s infinite linear; }
        @keyframes fa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        body.dark-mode { background-color: #111827; }
        body.dark-mode .card, body.dark-mode .bg-white { background-color: #1f2937 !important; color: #f9fafb; }
        body.dark-mode .text-muted { color: #9ca3af !important; }
        body.dark-mode .bg-light { background-color: #374151 !important; }
        body.dark-mode .table-light { background-color: #374151 !important; color: #f9fafb; }
        
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #e0e0e0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #10B981; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #059669; }
        
        body.dark-mode ::-webkit-scrollbar-track { background: #2d3748; }
        body.dark-mode ::-webkit-scrollbar-thumb { background: #10B981; }
        
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
        
        .nav-link-dashboard { background: linear-gradient(135deg, #667eea, #764ba2); color: white !important; }
        .nav-link-lecturers { background: linear-gradient(135deg, #11998e, #38ef7d); color: white !important; }
        .nav-link-students { background: linear-gradient(135deg, #f093fb, #f5576c); color: white !important; }
        .nav-link-courses { background: linear-gradient(135deg, #F59E0B, #D97706); color: white !important; }
        .nav-link-notices { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white !important; }
        .nav-link-month { background: linear-gradient(135deg, #fa709a, #fee140); color: white !important; }
        .nav-link-audit { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #333 !important; }
        
        body.dark-mode .nav-link-audit { color: white !important; }
        
        .nav-link-dashboard:hover, .nav-link-lecturers:hover, .nav-link-students:hover,
        .nav-link-courses:hover, .nav-link-notices:hover, .nav-link-month:hover, .nav-link-audit:hover {
          transform: translateX(5px);
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
        @media (min-width: 768px) {
          .sidebar { transform: translateX(0) !important; position: fixed; }
          .main-content { margin-left: 260px !important; width: calc(100% - 260px) !important; }
        }
        
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