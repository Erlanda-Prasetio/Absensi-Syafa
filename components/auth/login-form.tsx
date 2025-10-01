'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Input validation
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Email dan password harus diisi',
        variant: 'destructive'
      })
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: 'Error', 
        description: 'Format email tidak valid',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        let errorMessage = 'Login gagal'
        
        // Handle specific error types
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email atau password salah'
            break
          case 'Email not confirmed':
            errorMessage = 'Silakan konfirmasi email Anda terlebih dahulu'
            break
          case 'Too many requests':
            errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti'
            break
          case 'User not found':
            errorMessage = 'Akun tidak ditemukan'
            break
          default:
            errorMessage = error.message
        }

        toast({
          title: 'Login Gagal',
          description: errorMessage,
          variant: 'destructive'
        })
        return
      }

      if (data.user) {
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang!'
        })
        
        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirect') || '/main'
        
        router.push(redirectTo)
        router.refresh()
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-[#00786F] mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Login</h1>
        </div>
        {/* <p className="text-gray-600 text-sm">
          Masuk ke sistem presensi DPMPTSP Jawa Tengah
        </p> */}
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@example.com"
              className="pl-10 h-11"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="pl-10 pr-10 h-11"
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-[#00786F] hover:bg-[#005B54] h-11 font-medium" 
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memproses...
            </div>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      {/* <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            Sistem keamanan dilindungi dengan enkripsi end-to-end
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="h-3 w-3" />
            <span>Akses terkontrol | Admin dikelola</span>
          </div>
        </div>
      </div> */}

      {/* Admin info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700 text-center">
          <strong>Info:</strong> Akun dibuat oleh administrator. Hubungi IT jika mengalami kendala login.
        </p>
      </div>
    </div>
  )
}