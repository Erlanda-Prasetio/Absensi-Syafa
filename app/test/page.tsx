"use client"

import { useState } from "react"
import { createClient } from "@/lib/auth-client"

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testDB = async () => {
    setLoading(true)
    try {
      console.log('Testing database connection...')
      
      // Test 1: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('User:', user, 'Error:', userError)
      
      if (user) {
        // Test 2: Query user_profiles table
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
        
        console.log('Profiles:', profiles, 'Error:', profileError)
        
        // Test 3: Create profile if none exists
        if (!profiles || profiles.length === 0) {
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              name: 'Test Admin',
              university: 'DPMPTSP Jateng',
              division: 'IT',
              role: 'admin',
              is_active: true
            })
            .select()
            .single()
          
          console.log('New Profile:', newProfile, 'Error:', insertError)
          setResult({ user, profiles, newProfile, insertError })
        } else {
          setResult({ user, profiles })
        }
      } else {
        setResult({ error: 'No user found' })
      }
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      <button 
        onClick={testDB}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Database'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}