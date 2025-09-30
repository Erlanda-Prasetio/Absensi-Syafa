'use client'

import { useEffect, useState } from 'react'
import { createClient, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    // Clear all cookies manually
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Check current auth state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <strong>User Status:</strong> {user ? 'Authenticated' : 'Not authenticated'}
          </div>
          
          {user && (
            <div className="space-y-2">
              <div className="text-sm">
                <strong>User ID:</strong> {user.id}
              </div>
              <div className="text-sm">
                <strong>Email:</strong> {user.email}
              </div>
              <Button onClick={handleSignOut} variant="destructive" className="w-full">
                Force Sign Out & Clear All Data
              </Button>
            </div>
          )}

          {!user && (
            <div className="space-y-2">
              <div className="text-sm text-green-600">
                You should be able to access /login now
              </div>
              <Button onClick={() => window.location.href = '/login'} className="w-full">
                Go to Login
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline" 
              className="w-full"
            >
              Test Middleware (Go to Root)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}