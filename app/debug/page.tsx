'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    const supabase = createClient()
    
    try {
      // Check user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Check if table exists by trying to query it
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Profile error:', error)
          if (error.code === 'PGRST116') {
            setTableExists(false) // Table doesn't exist
          } else {
            setTableExists(true) // Table exists but no profile
          }
        } else {
          setProfile(data)
          setTableExists(true)
        }
      }
    } catch (error) {
      console.error('Debug error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return
    
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: 'Administrator',
          university: 'DPMPTSP Jateng',
          division: 'IT',
          role: 'admin'
        })
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      alert('Profile created successfully!')
    } catch (error) {
      console.error('Create profile error:', error)
      alert('Error creating profile: ' + JSON.stringify(error))
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Check database and authentication status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">User Authentication:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {user ? JSON.stringify(user, null, 2) : 'No user found'}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Table Status:</h3>
            <p className={`p-2 rounded ${tableExists === null ? 'bg-gray-100' : tableExists ? 'bg-green-100' : 'bg-red-100'}`}>
              {tableExists === null ? 'Checking...' : tableExists ? '✅ user_profiles table exists' : '❌ user_profiles table missing'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Profile Data:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {profile ? JSON.stringify(profile, null, 2) : 'No profile found'}
            </pre>
          </div>

          {user && tableExists && !profile && (
            <Button onClick={createProfile} className="w-full">
              Create Admin Profile
            </Button>
          )}

          <div className="pt-4 border-t">
            <Button onClick={() => window.location.href = '/main'} variant="outline">
              Back to Main
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}