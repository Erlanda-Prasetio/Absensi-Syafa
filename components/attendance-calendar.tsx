"use client"

import { useMemo, useState, useEffect } from "react"
import type { CSSProperties } from "react"
import { Calendar } from "@/components/ui/calendar"
import { createClient } from "@/lib/auth-client"

export function AttendanceCalendar() {
  const today = new Date()
  const supabase = createClient()

  // Limit to ±6 months
  const fromMonth = useMemo(() => {
    const d = new Date(today)
    d.setMonth(d.getMonth() - 6)
    return d
  }, [today])

  const toMonth = useMemo(() => {
    const d = new Date(today)
    d.setMonth(d.getMonth() + 6)
    return d
  }, [today])

  const [highlightedDates, setHighlightedDates] = useState<Date[]>([])
  const [presensiDates, setPresensiDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserDates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch user profile with date range
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('start_date, end_date')
          .eq('id', user.id)
          .single()

        if (profile?.start_date && profile?.end_date) {
          const start = new Date(profile.start_date)
          const end = new Date(profile.end_date)
          const dates: Date[] = []

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d))
          }

          setHighlightedDates(dates)
        }

        // Fetch presensi records (masuk and keluar)
        const { data: presensiRecords } = await supabase
          .from('presensi_records')
          .select('waktu_masuk, waktu_keluar')
          .eq('user_id', user.id)

        if (presensiRecords) {
          const presensiDatesSet = new Set<string>()
          
          presensiRecords.forEach(record => {
            if (record.waktu_masuk) {
              const date = new Date(record.waktu_masuk)
              presensiDatesSet.add(date.toDateString())
            }
            if (record.waktu_keluar) {
              const date = new Date(record.waktu_keluar)
              presensiDatesSet.add(date.toDateString())
            }
          })

          const presensiDatesArray = Array.from(presensiDatesSet).map(dateStr => new Date(dateStr))
          setPresensiDates(presensiDatesArray)
        }
      } catch (error) {
        console.error('Error fetching user dates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDates()
  }, [])

  const blueAccent: CSSProperties = { ["--primary" as any]: "#0050ff" } // Custom vibrant blue

  if (loading) {
    return (
      <div className="rounded-xl bg-card border px-4 py-5 md:px-6 md:py-6">
        <h2 className="font-semibold mb-4">Calendar Absensi</h2>
        <p className="text-sm text-muted-foreground">Memuat kalender...</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card border px-4 py-5 md:px-6 md:py-6">
      <h2 className="font-semibold mb-4">Calendar Absensi</h2>

      <div style={blueAccent} className="calendar-with-spacing">
        <style jsx global>{`
          .calendar-with-spacing .rdp {
            --rdp-cell-size: 36px;
            --rdp-accent-color: #0050ff;
            --rdp-background-color: #0050ff;
            font-size: 0.875rem;
          }
          .calendar-with-spacing .rdp-day {
            margin: 1.5px;
            border-radius: 6px;
            font-size: 0.875rem;
          }
          .calendar-with-spacing .rdp-day_selected {
            background-color: rgba(0, 80, 255) !important;
            color: #0050ff !important;
            font-weight: 600;
            border: 1px solid rgba(0, 80, 255);
          }
          .calendar-with-spacing .rdp-day_selected:hover {
            background-color: rgba(0, 80, 255) !important;
          }
          .calendar-with-spacing .rdp-day_selected.presensi-date {
            background: linear-gradient(135deg, rgba(0, 80, 255, 0.3) 0%, rgba(22, 255, 0, 0.6) 100%) !important;
            border: 1px solid #16ff00;
            color: #16ff00 !important;
          }
          .calendar-with-spacing .rdp-day_today {
            font-weight: bold;
          }
          .calendar-with-spacing .rdp-caption {
            font-size: 0.9375rem;
          }
          .calendar-with-spacing .rdp-head_cell {
            font-size: 0.8125rem;
            font-weight: 600;
          }
        `}</style>
        <Calendar
          mode="multiple"
          selected={highlightedDates}
          disabled
          fromMonth={fromMonth}
          toMonth={toMonth}
          captionLayout="dropdown"
          showOutsideDays
          className="rounded-md"
          modifiers={{
            presensi: presensiDates
          }}
          modifiersClassNames={{
            presensi: 'presensi-date'
          }}
        />
      </div>

      <p className="mt-3 text-sm">
        Periode magang: <span className="font-semibold">{highlightedDates.length}</span> hari
      </p>
    </div>
  )
}
