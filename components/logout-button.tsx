'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'
import { LogOut } from 'lucide-react'

// export function LogoutButton() {
//   const { toast } = useToast()
//
//   const handleLogout = async () => {
//     try {
//       // Sign out from Supabase
//       await signOut()
//       
//       // Clear all cookies manually as a backup
//       if (typeof document !== 'undefined') {
//         document.cookie.split(";").forEach((c) => {
//           const eqPos = c.indexOf("=")
//           const name = eqPos > -1 ? c.substr(0, eqPos) : c
//           const cookieName = name.trim()
//           document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
//           document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
//         })
//       }
//       
//       toast({
//         title: 'Logout Berhasil',
//         description: 'Anda telah keluar dari sistem'
//       })
//       
//       // Force redirect to login
//       window.location.href = '/login'
//     } catch (error) {
//       console.error('Logout error:', error)
//       toast({
//         title: 'Error',
//         description: 'Gagal logout',
//         variant: 'destructive'
//       })
//     }
//   }
//
//   return (
//     <Button
//       variant="destructive"
//       size="sm"
//       onClick={handleLogout}
//       className="flex items-center gap-2"
//     >
//       <LogOut className="h-4 w-4" />
//       Logout
//     </Button>
//   )
// }