'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatActivityTime, getActivityColor } from '@/lib/activity-logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UserProfile {
  id: string
  name: string
  university: string
  division: string
  role: 'user' | 'admin'
  is_active: boolean
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

interface CreateUserData {
  email: string
  password: string
  name: string
  university: string
  division: string
  role: 'user' | 'admin'
  start_date?: string
  end_date?: string
}

interface Division {
  id: number
  nama_divisi: string
  total_slots: number
  available_slots: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DivisionFormData {
  nama_divisi: string
  total_slots: number
  description?: string
}

interface PendingRegistration {
  id: number
  nama_lengkap: string
  email: string
  telepon: string
  institusi: string
  jurusan?: string
  semester?: string
  durasi_magang?: string
  division_id?: number
  tanggal_mulai?: string
  tanggal_selesai?: string
  deskripsi?: string
  status: string
  kode_pendaftaran: string
  created_at: string
  documents: Array<{
    id: number
    document_type: string
    file_name: string
    file_path: string
    file_size: number
  }>
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateDivisionDialogOpen, setIsCreateDivisionDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all-status')
  const [divisionFilter, setDivisionFilter] = useState('all-division')
  
  const { toast } = useToast()
  const supabase = createClient()

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter - check if name or university contains search query
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchLower) ||
        user.university.toLowerCase().includes(searchLower)
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      // Status filter
      const matchesStatus = statusFilter === 'all-status' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)
      
      // Division filter
      const matchesDivision = divisionFilter === 'all-division' || user.division === divisionFilter
      
      return matchesSearch && matchesRole && matchesStatus && matchesDivision
    })
  }, [users, searchQuery, roleFilter, statusFilter, divisionFilter])

  const [createForm, setCreateForm] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    university: '',
    division: '',
    role: 'user',
    start_date: '',
    end_date: ''
  })

  const [divisionForm, setDivisionForm] = useState<DivisionFormData>({
    nama_divisi: '',
    total_slots: 0,
    description: ''
  })

  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengguna',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all divisions
  const fetchDivisions = async () => {
    try {
      const response = await fetch('/api/admin/divisions')
      const result = await response.json()
      
      if (result.success) {
        setDivisions(result.data || [])
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data divisi',
        variant: 'destructive'
      })
    }
  }

  // Fetch pending registrations
  const fetchPendingRegistrations = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/registrations?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const result = await response.json()
      
      console.log('Fetched pending registrations:', result.data?.length || 0)
      
      if (result.success) {
        // Filter out any non-pending items (in case of database lag)
        const actuallyPending = (result.data || []).filter((reg: any) => reg.status === 'pending')
        console.log('After filtering:', actuallyPending.length)
        setPendingRegistrations(actuallyPending)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data pendaftar',
        variant: 'destructive'
      })
    }
  }

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const response = await fetch('/api/admin/activity-logs?limit=10')
      const result = await response.json()
      
      if (result.success) {
        setActivityLogs(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDivisions()
    fetchPendingRegistrations()
    fetchActivityLogs()

    // Set up polling for real-time updates (every 10 seconds)
    const interval = setInterval(() => {
      fetchActivityLogs()
      fetchPendingRegistrations()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Generate secure password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCreateForm(prev => ({ ...prev, password }))
  }

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createForm.email || !createForm.password || !createForm.name || 
        !createForm.university || !createForm.division) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('Sesi tidak valid. Silakan login ulang.')
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        const errorMessage = errorBody?.error || 'Gagal membuat pengguna'
        throw new Error(errorMessage)
      }

      toast({
        title: 'Berhasil',
        description: `Pengguna ${createForm.name} berhasil dibuat`
      })

      // If this was triggered by an approval, finalize the approval
      if (selectedRegistration) {
        await finalizeApproval(selectedRegistration, createForm.password)
        setSelectedRegistration(null)
      }

      // Reset form and close dialog
      setCreateForm({
        email: '',
        password: '',
        name: '',
        university: '',
        division: '',
        role: 'user',
        start_date: '',
        end_date: ''
      })
      setIsCreateDialogOpen(false)
      
      // Refresh user list and activity logs
      await fetchUsers()
      await fetchActivityLogs()

    } catch (error: any) {
      let errorMessage = error?.message || 'Gagal membuat pengguna'
      if (errorMessage.includes('already registered')) {
        errorMessage = 'Email sudah terdaftar'
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Update user profile
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      // Update profile data
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (error) throw error

      // If password change requested, call admin API
      if (newPassword) {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) {
          throw new Error('Sesi tidak valid')
        }

        const response = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            user_id: editingUser.id,
            new_password: newPassword
          })
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(errorBody?.error || 'Gagal mengubah password')
        }
      }

      toast({
        title: 'Berhasil',
        description: newPassword ? 'Data pengguna dan password berhasil diperbarui' : 'Data pengguna berhasil diperbarui'
      })

      setEditingUser(null)
      setEditForm({})
      setNewPassword('')
      await fetchUsers()

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Gagal memperbarui data pengguna',
        variant: 'destructive'
      })
    }
  }

  // Toggle user active status
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'Berhasil',
        description: `Pengguna ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`
      })

      await fetchUsers()

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengubah status pengguna',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const startEdit = (user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      university: user.university,
      division: user.division,
      role: user.role,
      start_date: user.start_date || '',
      end_date: user.end_date || ''
    })
  }

  // Division CRUD handlers
  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(divisionForm)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Divisi berhasil ditambahkan'
        })
        setIsCreateDivisionDialogOpen(false)
        setDivisionForm({ nama_divisi: '', total_slots: 0, description: '' })
        await fetchDivisions()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan divisi',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateDivision = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingDivision) return

    try {
      const response = await fetch('/api/admin/divisions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDivision.id,
          ...divisionForm
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Divisi berhasil diperbarui'
        })
        setEditingDivision(null)
        setDivisionForm({ nama_divisi: '', total_slots: 0, description: '' })
        await fetchDivisions()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui divisi',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteDivision = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus divisi ini?')) return

    try {
      const response = await fetch(`/api/admin/divisions?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Divisi berhasil dihapus'
        })
        await fetchDivisions()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus divisi',
        variant: 'destructive'
      })
    }
  }

  const handleResetSlots = async (id: number, totalSlots: number) => {
    if (!confirm('Reset slot tersedia ke jumlah total? Ini akan mengatur ulang slot yang tersedia.')) return

    try {
      const response = await fetch(`/api/admin/divisions?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          available_slots: totalSlots
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `Slot tersedia berhasil direset ke ${totalSlots}`
        })
        await fetchDivisions()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mereset slot',
        variant: 'destructive'
      })
    }
  }

  const startEditDivision = (division: Division) => {
    setEditingDivision(division)
    setDivisionForm({
      nama_divisi: division.nama_divisi,
      total_slots: division.total_slots,
      description: division.description || ''
    })
  }

  // Handle approve registration - Open create user dialog with pre-filled data
  const handleApproveRegistration = async (registration: PendingRegistration) => {
    // Find the division name from the divisions list
    let divisionName = ''
    if (registration.division_id) {
      const division = divisions.find(d => d.id === registration.division_id)
      divisionName = division ? division.nama_divisi : ''
    }
    
    // Pre-fill the create form with registration data
    setCreateForm({
      email: registration.email,
      password: '', // Admin will generate this
      name: registration.nama_lengkap,
      university: registration.institusi,
      division: divisionName, // Auto-filled from registration
      role: 'user',
      start_date: registration.tanggal_mulai || '',
      end_date: registration.tanggal_selesai || '',
    })
    
    // Store the registration ID for later approval
    setSelectedRegistration(registration)
    
    // Open the create user dialog
    setIsCreateDialogOpen(true)
    
    toast({
      title: 'Info',
      description: 'Silakan lengkapi data user dan generate password untuk melanjutkan approval.',
    })
  }

  // Old approve function (keeping for reference - will be called after user creation)
  const finalizeApproval = async (registration: PendingRegistration, password: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registration.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          changed_by: 'Admin',
          password: password, // Pass password to email
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'User berhasil dibuat dan email konfirmasi telah dikirim dengan password.'
        })
        await fetchPendingRegistrations()
        await fetchActivityLogs()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyetujui pendaftaran',
        variant: 'destructive'
      })
    }
  }

  // Handle reject registration
  const handleRejectRegistration = async () => {
    if (!selectedRegistration) return

    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan penolakan harus diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      console.log('Rejecting registration:', selectedRegistration.id)
      console.log('Rejection reason:', rejectionReason)
      
      const response = await fetch(`/api/admin/registrations/${selectedRegistration.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason,
          changed_by: 'Admin'
        })
      })

      const result = await response.json()
      console.log('Rejection response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menolak pendaftaran')
      }

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Pendaftaran berhasil ditolak. Email pemberitahuan telah dikirim.'
        })
        setIsRejectDialogOpen(false)
        setRejectionReason('')
        setSelectedRegistration(null)
        
        // Wait a moment for database to fully commit
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchPendingRegistrations()
        await fetchActivityLogs()
      } else {
        throw new Error(result.error || 'Gagal menolak pendaftaran')
      }
    } catch (error: any) {
      console.error('Error rejecting registration:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal menolak pendaftaran',
        variant: 'destructive'
      })
    }
  }

  const openRejectDialog = (registration: PendingRegistration) => {
    setSelectedRegistration(registration)
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00786F]/30 border-t-[#00786F] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Button variant="ghost" size="sm" className="p-0 h-auto font-normal" asChild>
          <a href="/main">Dashboard Utama</a>
        </Button>
        <span>›</span>
        <span className="text-gray-900 font-medium">Admin Panel</span>
      </nav>

      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Kelola pengguna dan sistem presensi</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-sm">
              Laporan
            </Button>
            <Button variant="outline" className="text-sm">
              Export Data
            </Button>
          </div>
        </div>
        
        {/* Quick Navigation */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[#00786F]">
            Kelola User
          </Button>
          <Button variant="ghost" size="sm">
            Dashboard
          </Button>
          <Button variant="ghost" size="sm">
            Presensi
          </Button>
          <Button variant="ghost" size="sm">
            Pengaturan
          </Button>
        </div>
      </div>

      {/* Pending Registrations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Pendaftar Baru / Notifikasi</CardTitle>
              <CardDescription>Tinjau dan proses pendaftaran magang yang masuk</CardDescription>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {pendingRegistrations.length} Baru
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Tidak ada pendaftaran baru yang perlu ditinjau</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegistrations.map((registration) => (
                <Card key={registration.id} className="border-2 border-orange-200 bg-orange-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            {registration.kode_pendaftaran}
                          </Badge>
                          <Badge variant="secondary">
                            {new Date(registration.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {registration.nama_lengkap}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium">{registration.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Telepon</p>
                            <p className="font-medium">{registration.telepon}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Institusi</p>
                            <p className="font-medium">{registration.institusi}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Jurusan</p>
                            <p className="font-medium">{registration.jurusan || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Durasi Magang</p>
                            <p className="font-medium">{registration.durasi_magang || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Divisi</p>
                            <p className="font-medium">
                              {registration.division_id 
                                ? divisions.find(d => d.id === registration.division_id)?.nama_divisi || '-'
                                : <span className="text-gray-500 italic">Belum dipilih</span>
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Dokumen</p>
                            <p className="font-medium">{registration.documents.length} file</p>
                          </div>
                        </div>

                        {registration.deskripsi && (
                          <div className="mb-4">
                            <p className="text-gray-600 text-sm mb-1">Deskripsi:</p>
                            <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                              {registration.deskripsi}
                            </p>
                          </div>
                        )}

                        {registration.documents.length > 0 && (
                          <div className="mb-4">
                            <p className="text-gray-600 text-sm mb-2">Dokumen yang diunggah ({registration.documents.length}):</p>
                            <div className="space-y-2">
                              {registration.documents.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-[#00786F] hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <svg 
                                      className="w-5 h-5 text-gray-400 flex-shrink-0" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                      />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {doc.file_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(doc.file_size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <Badge variant="outline" className="text-xs">
                                      {doc.document_type.replace('_', ' ')}
                                    </Badge>
                                    <svg 
                                      className="w-4 h-4 text-gray-400 group-hover:text-[#00786F] flex-shrink-0" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                      />
                                    </svg>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleApproveRegistration(registration)}
                          className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                        >
                          Terima
                        </Button>
                        <Button
                          onClick={() => openRejectDialog(registration)}
                          variant="destructive"
                          className="whitespace-nowrap"
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Tolak Pendaftaran</DialogTitle>
            <DialogDescription className="text-sm">
              Berikan alasan penolakan untuk {selectedRegistration?.nama_lengkap}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm font-semibold">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Dokumen tidak lengkap, jurusan tidak sesuai, dll..."
                className="w-full min-h-[140px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00786F] focus:border-transparent resize-y"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Applicant dapat mendaftar ulang setelah 3 hari
              </p>
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false)
                  setRejectionReason('')
                  setSelectedRegistration(null)
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleRejectRegistration}
                variant="destructive"
                disabled={!rejectionReason.trim()}
              >
                Tolak & Kirim Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-gray-600 text-sm">Tambah, edit, dan kelola akun pengguna</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00786F] hover:bg-[#005B54]">
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Buat akun baru untuk sistem presensi
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nama Lengkap</Label>
                  <Input
                    id="create-name"
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nama lengkap"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="nama@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-university">Universitas</Label>
                  <Input
                    id="create-university"
                    type="text"
                    value={createForm.university}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="Nama universitas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-division">Divisi</Label>
                  <Input
                    id="create-division"
                    type="text"
                    value={createForm.division}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, division: e.target.value }))}
                    placeholder="Divisi/bagian"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="create-password"
                        type={showPassword ? 'text' : 'password'}
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Password"
                        className="pr-24"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-[#00786F] hover:text-[#005B54]"
                      >
                        {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                    </div>
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-role">Role</Label>
                  <Select value={createForm.role} onValueChange={(value: 'user' | 'admin') => setCreateForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-start-date">Tanggal Mulai Magang</Label>
                  <Input
                    id="create-start-date"
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-end-date">Tanggal Selesai Magang</Label>
                  <Input
                    id="create-end-date"
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                    min={createForm.start_date}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1 bg-[#00786F] hover:bg-[#005B54]">
                  Buat Akun
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Pengguna</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Admin</p>
            <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">User Aktif</p>
            <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada aktivitas</p>
              ) : (
                activityLogs.map((log) => {
                  const colors = getActivityColor(log.activity_type)
                  return (
                    <div key={log.id} className={`flex items-center gap-3 p-3 ${colors.bgColor} rounded-lg`}>
                      <div className={`w-2 h-2 ${colors.dotColor} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.description}</p>
                        <p className="text-xs text-gray-500">{formatActivityTime(log.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRegistrations.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-orange-900">Pendaftar Baru</p>
                    <p className="text-sm text-orange-700">{pendingRegistrations.length} perlu ditinjau</p>
                  </div>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {pendingRegistrations.length}
                  </Badge>
                </div>
              </div>
            )}
            <Button 
              variant="outline"
              className="w-full justify-start hover:bg-[#00786F] hover:text-white transition-colors"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Tambah User Baru
            </Button>
            <Button 
              variant="outline"
              className="w-full justify-start hover:bg-teal-600 hover:text-white transition-colors"
              onClick={() => setIsCreateDivisionDialogOpen(true)}
            >
              Tambah Divisi Magang
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-blue-600 hover:text-white transition-colors"
              onClick={() => window.open('/api/admin/export/users', '_blank')}
            >
              Export Data User
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-indigo-600 hover:text-white transition-colors"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                window.open(`/api/admin/export/attendance?start_date=${thirtyDaysAgo}&end_date=${today}`, '_blank')
              }}
            >
              Lihat Laporan Presensi
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-purple-600 hover:text-white transition-colors"
              onClick={() => {
                toast({
                  title: 'Backup Database',
                  description: 'Silakan ikuti panduan backup di dokumentasi. File BACKUP_GUIDE.md tersedia di folder database.',
                  duration: 8000,
                })
                window.open('https://supabase.com/dashboard/project/_/settings/database', '_blank')
              }}
            >
              Backup Database
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Presensi Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview Presensi Hari Ini</CardTitle>
          <CardDescription>
            Ringkasan aktivitas presensi {new Date().toLocaleDateString('id-ID')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600">Hadir Tepat Waktu</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">12%</div>
              <div className="text-sm text-gray-600">Terlambat</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">3%</div>
              <div className="text-sm text-gray-600">Tidak Hadir</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.is_active).length}</div>
              <div className="text-sm text-gray-600">Total Aktif</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-3 w-full flex-wrap">
              <Input
                placeholder="Cari nama atau universitas..."
                className="w-full sm:w-80 flex-shrink-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="w-[200px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-division">Semua Divisi</SelectItem>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={div.nama_divisi}>
                      {div.nama_divisi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetchUsers()
                  fetchPendingRegistrations()
                  fetchActivityLogs()
                  toast({
                    title: 'Data Diperbarui',
                    description: 'Semua data telah dimuat ulang',
                  })
                }}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/api/admin/export/users', '_blank')}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna ({filteredUsers.length} dari {users.length} total)</CardTitle>
          <CardDescription>
            Kelola akun pengguna sistem presensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Universitas</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.university}</TableCell>
                    <TableCell>{user.division}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={user.is_active ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {users.length === 0 ? 'Belum ada pengguna.' : 'Tidak ada pengguna yang sesuai dengan filter.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Division Management Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Divisi Magang</CardTitle>
              <CardDescription>
                Kelola divisi dan kuota slot magang yang tersedia
              </CardDescription>
            </div>
            <Button
              className="bg-[#00786F] hover:bg-[#005B54]"
              onClick={() => setIsCreateDivisionDialogOpen(true)}
            >
              Tambah Divisi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Divisi</TableHead>
                <TableHead>Total Slot</TableHead>
                <TableHead>Slot Tersedia</TableHead>
                <TableHead>Slot Terisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Belum ada divisi. Tambahkan divisi baru.
                  </TableCell>
                </TableRow>
              ) : (
                divisions.map((division) => (
                  <TableRow key={division.id}>
                    <TableCell className="font-medium">{division.nama_divisi}</TableCell>
                    <TableCell>{division.total_slots}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {division.available_slots}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {division.total_slots - division.available_slots}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={division.is_active ? 'default' : 'destructive'}>
                        {division.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetSlots(division.id, division.total_slots)}
                          title="Reset slot tersedia ke jumlah total"
                        >
                          Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditDivision(division)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDivision(division.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Division Dialog */}
      <Dialog open={isCreateDivisionDialogOpen} onOpenChange={setIsCreateDivisionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Divisi Baru</DialogTitle>
            <DialogDescription>
              Tambahkan divisi magang dan tentukan jumlah slot yang tersedia
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDivision} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama-divisi">Nama Divisi</Label>
              <Input
                id="nama-divisi"
                type="text"
                value={divisionForm.nama_divisi}
                onChange={(e) => setDivisionForm(prev => ({ ...prev, nama_divisi: e.target.value }))}
                placeholder="Contoh: Bidang Pelayanan Perizinan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-slots">Anggota yang Dibutuhkan</Label>
              <Input
                id="total-slots"
                type="number"
                min="0"
                value={divisionForm.total_slots}
                onChange={(e) => setDivisionForm(prev => ({ ...prev, total_slots: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                required
              />
              <p className="text-xs text-muted-foreground">Jumlah peserta magang yang dapat diterima</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Input
                id="description"
                type="text"
                value={divisionForm.description}
                onChange={(e) => setDivisionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi singkat divisi"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDivisionDialogOpen(false)} 
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-[#00786F] hover:bg-[#005B54]">
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Division Dialog */}
      <Dialog open={!!editingDivision} onOpenChange={() => setEditingDivision(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Divisi</DialogTitle>
            <DialogDescription>
              Perbarui informasi divisi magang
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDivision} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nama-divisi">Nama Divisi</Label>
              <Input
                id="edit-nama-divisi"
                type="text"
                value={divisionForm.nama_divisi}
                onChange={(e) => setDivisionForm(prev => ({ ...prev, nama_divisi: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-total-slots">Anggota yang Dibutuhkan</Label>
              <Input
                id="edit-total-slots"
                type="number"
                min="0"
                value={divisionForm.total_slots}
                onChange={(e) => setDivisionForm(prev => ({ ...prev, total_slots: parseInt(e.target.value) || 0 }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Slot terisi saat ini: {editingDivision ? editingDivision.total_slots - editingDivision.available_slots : 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                type="text"
                value={divisionForm.description}
                onChange={(e) => setDivisionForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingDivision(null)} 
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-[#00786F] hover:bg-[#005B54]">
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui informasi pengguna
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Lengkap</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-university">Universitas</Label>
                  <Input
                    id="edit-university"
                    type="text"
                    value={editForm.university || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, university: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-division">Divisi</Label>
                  <Input
                    id="edit-division"
                    type="text"
                    value={editForm.division || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, division: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={editForm.role} onValueChange={(value: 'user' | 'admin') => setEditForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Tanggal Mulai Magang</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editForm.start_date || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-end-date">Tanggal Selesai Magang</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editForm.end_date || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                    min={editForm.start_date}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-password">Ubah Password (opsional)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Kosongkan jika tidak ingin mengubah"
                      className="pr-24"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-[#00786F] hover:text-[#005B54]"
                    >
                      {showEditPassword ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1 bg-[#00786F] hover:bg-[#005B54]">
                  Simpan
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}