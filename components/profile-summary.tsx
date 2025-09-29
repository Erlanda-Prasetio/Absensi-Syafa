"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ProfileSummary() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-12">
        <AvatarFallback className="bg-muted text-foreground/70">US</AvatarFallback>
      </Avatar>
      <div className="leading-tight">
        <p className="font-semibold">Nama Pengguna</p>
        <p className="text-sm text-muted-foreground">Universitas Contoh</p>
        <p className="text-xs text-muted-foreground">Tanggal Lahir: 01 Januari 2000</p>
      </div>
    </div>
  )
}
