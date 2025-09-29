import { PresensiPanel } from "@/components/presensi-panel"
import type { CSSProperties } from "react"
import { ProfileSummary } from "@/components/profile-summary"

export default function PresensiPage({
  searchParams,
}: {
  searchParams: { t?: string }
}) {
  const time = searchParams?.t ?? ""

  const brand: CSSProperties = { ["--primary" as any]: "#00786F" }

  return (
    <main className="min-h-[100svh] bg-background text-foreground px-4 py-6 md:px-8 lg:px-12">
      <header className="flex items-start justify-between gap-6">
        <ProfileSummary />
        <img src="/images/logo_baru.png" alt="DPMPTSP Jateng Logo" className="h-14 w-auto md:h-16 lg:h-20" />
      </header>

      <section className="mt-6 grid gap-6">
        <div style={brand}>
          <PresensiPanel time={time} />
        </div>
      </section>
    </main>
  )
}
