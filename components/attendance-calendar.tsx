"use client"

import { useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { Calendar } from "@/components/ui/calendar"

export function AttendanceCalendar() {
  const today = new Date()

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

  const [selected, setSelected] = useState<Date[]>([])

  const blueAccent: CSSProperties = { ["--primary" as any]: "#1E40AF" } // Tailwind blue-800

  return (
    <div className="rounded-xl bg-card border px-4 py-5 md:px-6 md:py-6">
      <h2 className="font-semibold mb-4">Calendar Absensi</h2>

      <div style={blueAccent}>
        <Calendar
          mode="multiple"
          selected={selected}
          onSelect={(days) => setSelected(days ?? [])}
          fromMonth={fromMonth}
          toMonth={toMonth}
          captionLayout="dropdown-buttons"
          showOutsideDays
          className="rounded-md"
        />
      </div>

      <p className="mt-3 text-sm">
        Total hari magang dipilih: <span className="font-semibold">{selected.length}</span>
      </p>
    </div>
  )
}
