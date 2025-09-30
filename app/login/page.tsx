import { LoginForm } from '@/components/auth/login-form'
import type { CSSProperties } from "react"

export default function LoginPage() {
  const brandOverride = { ["--primary" as any]: "#00786F" } as CSSProperties

  return (
    <main 
      style={brandOverride}
      className="min-h-[100svh] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-6xl flex items-center justify-between gap-8">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          <div className="text-center">
            <img 
              src="/images/logo_baru.png" 
              alt="DPMPTSP Jateng Logo" 
              className="h-32 w-auto mx-auto mb-8"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sistem Presensi Digital
            </h1>
            <h2 className="text-xl font-semibold text-[#00786F] mb-4 uppercase tracking-wider">
              PROVINSI JAWA TENGAH
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Platform presensi digital yang aman dengan kontrol akses administrator
            </p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <img 
                src="/images/logo_baru.png" 
                alt="DPMPTSP Jateng Logo" 
                className="h-20 w-auto mx-auto mb-4"
              />
              <h2 className="text-lg font-semibold text-[#00786F] uppercase tracking-wider">
                PROVINSI JAWA TENGAH
              </h2>
            </div>
            
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}
