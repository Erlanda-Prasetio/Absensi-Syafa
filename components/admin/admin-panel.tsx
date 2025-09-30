'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
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
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const [createForm, setCreateForm] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    university: '',
    division: '',
    role: 'user'
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

  useEffect(() => {
    fetchUsers()
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

      // Reset form and close dialog
      setCreateForm({
        email: '',
        password: '',
        name: '',
        university: '',
        division: '',
        role: 'user'
      })
      setIsCreateDialogOpen(false)
      
      // Refresh user list
      await fetchUsers()

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
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (error) throw error

      toast({
        title: 'Berhasil',
        description: 'Data pengguna berhasil diperbarui'
      })

      setEditingUser(null)
      setEditForm({})
      await fetchUsers()

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data pengguna',
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
      role: user.role
    })
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
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Login baru dari Administrator</p>
                  <p className="text-xs text-gray-500">2 menit yang lalu</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">User baru dibuat</p>
                  <p className="text-xs text-gray-500">1 jam yang lalu</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Presensi massal hari ini</p>
                  <p className="text-xs text-gray-500">3 jam yang lalu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-[#00786F] hover:bg-[#005B54]"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Tambah User Baru
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Export Data User
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Lihat Laporan Presensi
            </Button>
            <Button variant="outline" className="w-full justify-start">
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
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full md:w-auto">
              <Input
                placeholder="Cari nama, email, atau universitas..."
                className="md:w-80"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-status">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna ({users.length} total)</CardTitle>
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
              {users.map((user) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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