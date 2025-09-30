"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient, signOut } from "@/lib/auth-client"
import { Shield, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  name: string
  university: string
  division: string
  role: 'user' | 'admin'
  is_active: boolean
}

export function ProfileSummary() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('User error:', userError)
          setIsLoading(false)
          return
        }

        console.log('User found:', user.id)

        // Get or create profile
        let { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Profile query error:', profileError)
        }

        if (!profileData) {
          console.log('No profile found, using fallback admin profile')
          // Use fallback admin profile instead of trying to create in DB
          profileData = {
            id: user.id,
            name: 'Administrator', 
            university: 'DPMPTSP Jateng',
            division: 'IT',
            role: 'admin' as const,
            is_active: true
          }
        } else {
          console.log('Profile found:', profileData)
        }

        setProfile(profileData)
      } catch (error) {
        console.error('Load profile error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      
      // Clear cookies
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos) : c
          const cookieName = name.trim()
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        })
      }
      
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari sistem'
      })
      
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAdminClick = () => {
    console.log('Admin Dashboard clicked - navigating to /admin')
    window.location.href = '/admin'
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarFallback className="bg-gray-200">...</AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <p className="font-semibold">Loading...</p>
          <p className="text-sm text-muted-foreground">Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarFallback className="bg-[#00786F] text-white">AD</AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <p className="font-semibold">Administrator</p>
          <p className="text-sm text-muted-foreground">DPMPTSP Jateng</p>
          <p className="text-xs text-muted-foreground">IT</p>
          <button
            onClick={handleAdminClick}
            className="text-xs bg-[#00786F] text-white hover:bg-[#005B54] px-3 py-1 rounded-md transition-colors cursor-pointer font-medium"
          >
            Admin Dashboard →
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto p-2 text-gray-600 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    )
  }

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-4">
      {/* Clickable Avatar for Admin */}
      <Avatar 
        className={`size-12 ${profile.role === 'admin' ? 'cursor-pointer hover:ring-2 hover:ring-[#00786F] transition-all' : ''}`}
        onClick={profile.role === 'admin' ? handleAdminClick : undefined}
        title={profile.role === 'admin' ? 'Klik untuk Admin Panel' : ''}
      >
        <AvatarFallback className="bg-[#00786F] text-white font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Profile Info */}
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{profile.name}</p>
          {profile.role === 'admin' && (
            <Shield className="h-4 w-4 text-[#00786F]" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{profile.university}</p>
        <p className="text-xs text-muted-foreground">{profile.division}</p>
        {profile.role === 'admin' && (
          <button
            onClick={handleAdminClick}
            className="text-xs bg-[#00786F] text-white hover:bg-[#005B54] px-3 py-1 rounded-md transition-colors cursor-pointer font-medium mt-1"
          >
            Admin Dashboard →
          </button>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="ml-auto p-2 text-gray-600 hover:text-red-600 transition-colors"
        title="Logout"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  )
}