import type { CSSProperties } from "react"
import { ProfileSummary } from "@/components/profile-summary"
import { TimePanel } from "@/components/time-panel"
import { TugasPanel } from "@/components/tugas-panel"
import { AttendanceCalendar } from "@/components/attendance-calendar"

export default function MainPage() {
  const brand: CSSProperties = { ["--primary" as any]: "#00786F" }

  return (
    <main className="min-h-[100svh] bg-background text-foreground px-4 pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
      {/* Header: profile at left, logo at right */}
      {/* Use items-center so the logo vertically aligns with the profile name/avatar.
          Reduce gap and logo height so it sits visually closer to the left content. */}
      <header className="flex items-center justify-start gap-x-4 pt-4 md:pt-0">
        <ProfileSummary />
        <img
          src="/images/logo_baru.png"
          alt="DPMPTSP Jateng logo"
          className="h-27 w-auto ml-auto"
        />
      </header>

      <div className="max-w-4xl mx-auto">
        <section className="mt-6 grid gap-6">
        {/* Time panel + Presensi button (brand teal) */}
        <div style={brand}>
          <TimePanel />
        </div>

        {/* Tugas panel with drag & drop and submit */}
        <div style={brand}>
          <TugasPanel />
        </div>

        {/* Calendar with blue selection highlighting and count */}
        <AttendanceCalendar />
        </section>
      </div>
    </main>
  )
}
