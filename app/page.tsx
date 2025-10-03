'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    console.log('[ROOT PAGE] Redirecting to /magang')
    router.replace('/magang')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-600">Redirecting to landing page...</p>
    </div>
  )
}
