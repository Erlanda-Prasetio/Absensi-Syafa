import Link from "next/link"
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
     <main className="min-h-[100svh] bg-background text-foreground px-4 pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
       <header className="flex items-center justify-between gap-x-4 md:gap-x-6 lg:gap-x-8">
        <ProfileSummary />
         <Link href="/main" className="ml-auto">
          <img src="/images/logo_baru.png" alt="DPMPTSP Jateng Logo" className="h-27 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
      </header>

      <section className="max-w-5xl mx-auto">
        <div style={brand}>
          <PresensiPanel time={time} />
        </div>
      </section>
    </main>
  )
}
