import type { CSSProperties } from "react"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  const brandOverride = { ["--primary" as any]: "#00786F" } as CSSProperties

  return (
    <main
      style={brandOverride}
      className="min-h-[100svh] bg-background text-foreground flex items-center justify-center px-6 py-8"
    >
      <div className="w-full max-w-lg flex flex-col items-center gap-6">
  {/* Logo */}
  <img src="/images/logo_baru.png" alt="DPMPTSP Jateng logo" className="h-20 w-auto md:h-70" />

        {/* Subtitle */}
        <h1 className="text-center font-semibold uppercase tracking-wider text-lg md:text-xl">PROVINSI JAWA TENGAH</h1>

        <LoginForm />
      </div>
    </main>
  )
}
