"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function TimePanel() {
  const router = useRouter()

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
        <TimeBox label="Mulai" value="06:00" />
        <span className="text-muted-foreground">—</span>
        <TimeBox label="Selesai" value="08:00" />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Rentang waktu presensi antara 06:00 dan 08:00. Ketentuan ini tidak dapat dinegosiasikan.
      </p>

      <div className="mt-4">
        <Button
          className="w-full uppercase tracking-wide"
          onClick={() => {
            const t = nowHHMM()
            router.push(`/presensi?t=${encodeURIComponent(t)}`)
          }}
        >
          Presensi Masuk
        </Button>
      </div>
    </div>
  )
}

function TimeBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-lg bg-secondary px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
