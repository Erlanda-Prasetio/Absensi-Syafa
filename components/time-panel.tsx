"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function TimePanel() {
  const router = useRouter()
  const [presensiTimes, setPresensiTimes] = useState<{
    masuk: string | null
    pulang: string | null
  }>({ masuk: null, pulang: null })

  // Get current presensi type and availability
  const getPresensiType = () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    // Presensi Masuk: 6 AM - 9 AM
    // Presensi Pulang: 1 PM - 6 PM  
    if (hour >= 6 && hour < 9) {
      return { type: 'masuk', label: 'Presensi Masuk', available: true }
    } else if (hour >= 13 && hour < 18) {
      return { type: 'pulang', label: 'Presensi Pulang', available: true }
    } else {
      return { type: 'none', label: 'Presensi Tidak Tersedia', available: false }
    }
  }

  const presensiInfo = getPresensiType()

  // Fetch today's presensi times
  useEffect(() => {
    const fetchPresensiTimes = async () => {
      try {
        const mod = await import('@/lib/supabase')
        const getBrowserSupabase = mod.getBrowserSupabase
        const supabase = getBrowserSupabase()
        
        if (supabase) {
          const today = new Date().toISOString().split('T')[0]
          console.log('🔍 Looking for presensi records on:', today)
          
          // First, let's see all records to debug
          const { data: allData } = await supabase
            .from('presensi_records')
            .select('*')
            .limit(5)
          
          console.log('📊 All recent records:', allData)
          
          // Then try to get today's record
          const { data, error } = await supabase
            .from('presensi_records')
            .select('presensi_time, presensi_out, presensi_date, name')
            .eq('presensi_date', today)
            .eq('name', 'Nama Pengguna') // TODO: Use actual user name
            .single()
          
          console.log('🎯 Today\'s record:', { data, error })
          
          if (data) {
            console.log('✅ Found record with times:', data.presensi_time, data.presensi_out)
            setPresensiTimes({
              masuk: data.presensi_time || null,      // Check-in time
              pulang: data.presensi_out || null       // Check-out time
            })
          } else {
            console.log('❌ No record found for today, trying latest record...')
            // If no record for today, get the most recent one for testing
            const { data: latestData } = await supabase
              .from('presensi_records')
              .select('presensi_time, presensi_out')
              .eq('name', 'Nama Pengguna')
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            
            if (latestData) {
              console.log('📅 Using latest record:', latestData)
              setPresensiTimes({
                masuk: latestData.presensi_time || null,
                pulang: latestData.presensi_out || null
              })
            }
          }
        }
      } catch (err) {
        console.log('💥 Error fetching presensi:', err)
      }
    }
    
    fetchPresensiTimes()
  }, [])

  function nowHHMM() {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  }

  return (
    <div className="rounded-xl bg-card border px-4 py-5 md:px-6 md:py-6">
      <h2 className="font-semibold mb-4">Waktu Presensi</h2>

      <div className="flex items-center gap-4">
        <TimeBox 
          label="Presensi Masuk" 
          value={presensiTimes.masuk || "— — : — —"} 
          status={presensiTimes.masuk ? "recorded" : "pending"}
        />
        <span className="text-muted-foreground">|</span>
        <TimeBox 
          label="Presensi Pulang" 
          value={presensiTimes.pulang || "— — : — —"} 
          status={presensiTimes.pulang ? "recorded" : "pending"}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Masuk: 06:00-09:00 | Pulang: 13:00-18:00
      </p>

      <div className="mt-4">
        <Button
          className="w-full uppercase tracking-wide"
          disabled={!presensiInfo.available}
          onClick={() => {
            const t = nowHHMM()
            router.push(`/presensi?t=${encodeURIComponent(t)}`)
          }}
        >
          {presensiInfo.label}
        </Button>
        {!presensiInfo.available && (
          <p className="mt-2 text-xs text-center text-muted-foreground">
            Presensi hanya tersedia pada jam yang ditentukan
          </p>
        )}
      </div>
    </div>
  )
}

function TimeBox({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className={`flex-1 rounded-lg px-4 py-3 ${status === 'recorded' ? 'bg-green-100 border border-green-200' : 'bg-secondary'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${status === 'recorded' ? 'text-green-700' : ''}`}>{value}</p>
      {status === 'recorded' && (
        <p className="text-xs text-green-600 mt-1">✓ Tercatat</p>
      )}
    </div>
  )
}
