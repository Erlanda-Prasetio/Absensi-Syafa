"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type Props = {
  time?: string
}

export function PresensiPanel({ time = "" }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const accept = useMemo(() => ["image/png", "image/jpeg"], [])

  const onFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const f = files[0]
      if (!accept.includes(f.type)) {
        alert("Format gambar harus PNG atau JPEG")
        return
      }
      setFile(f)
    },
    [accept],
  )

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  return (
    <div className="rounded-xl bg-card border px-4 py-5 md:px-6 md:py-6">
      <div className="rounded-lg border bg-secondary/40 px-4 py-3">
        <p className="text-center text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          Presensi Masuk
        </p>
        <p className="mt-1 text-center text-lg font-semibold">{time ? time : "— — : — —"}</p>
      </div>

      <div className="mt-5">
        <label className="text-sm font-semibold">Selfie (PNG/JPEG)</label>

        <div
          className={[
            "mt-2 rounded-lg border border-dashed p-4 transition-colors",
            dragActive ? "bg-secondary/50 border-primary" : "bg-secondary/30",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            onFiles(e.dataTransfer.files)
          }}
          role="button"
          aria-label="Unggah foto selfie"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => onFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex h-6 items-center rounded-md border px-3 text-xs font-medium">Pilih File</span>
            <span className="truncate">{file ? file.name : "Tidak ada yang dipilih"}</span>
          </div>

          {preview && (
            <div className="mt-4">
              <img
                src={preview || "/placeholder.svg?height=200&width=300&query=selfie%20preview"}
                alt="Preview selfie"
                className="mx-auto max-h-80 w-auto rounded-md object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <Button
          className="w-full uppercase tracking-wide"
          disabled={!file}
          onClick={async () => {
            if (!file) {
              toast({
                title: "Error",
                description: "Silakan ambil foto selfie terlebih dahulu",
              })
              return
            }
            console.log('🔄 Starting presensi save...')
            
            // Try to save a record to Supabase if available
            try {
              const mod = await import('@/lib/supabase')
              const getBrowserSupabase = mod.getBrowserSupabase
              const supabase = getBrowserSupabase()
              
              console.log('📡 Supabase client:', supabase ? 'Connected' : 'Not available')
              console.log('📁 File selected:', file ? file.name : 'None')
              
              if (supabase && file) {
                console.log('⬆️ Starting upload...')
                
                // Upload image to storage and insert a presensi record
                const fileName = `uploads/presensi_${Date.now()}_${file.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('presensi-images')
                  .upload(fileName, file)

                console.log('📦 Upload result:', { uploadData, uploadError })

                if (!uploadError) {
                  const publicUrl = supabase.storage.from('presensi-images').getPublicUrl(fileName).data.publicUrl
                  console.log('🔗 Public URL:', publicUrl)
                  
                  const now = new Date()
                  const recordData = {
                    name: 'Nama Pengguna', // TODO: Replace with actual user name
                    university: 'Universitas Contoh', // TODO: Replace with actual university
                    presensi_time: now.toLocaleTimeString('en-GB', { hour12: false }),
                    presensi_date: now.toISOString().split('T')[0],
                    image_url: publicUrl,
                    image_filename: file.name,
                  }
                  
                  console.log('💾 Inserting record:', recordData)
                  
                  const { data: insertData, error: insertError } = await supabase
                    .from('presensi_records')
                    .insert(recordData)
                  
                  console.log('📊 Insert result:', { insertData, insertError })
                  
                  if (insertError) {
                    console.error('❌ Insert failed:', insertError)
                    toast({
                      title: "Error menyimpan ke database",
                      description: insertError.message,
                    })
                    return
                  } else {
                    console.log('✅ Successfully saved to database!')
                  }
                } else {
                  console.error('❌ Upload failed:', uploadError)
                  toast({
                    title: "Error upload gambar",
                    description: uploadError.message,
                  })
                  return
                }
              } else {
                console.warn('⚠️ Supabase not configured or no file selected')
              }
            } catch (err) {
              console.error('💥 Supabase save failed:', err)
              toast({
                title: "Error koneksi database",
                description: String(err),
              })
              return
            }

            toast({
              title: "Terima Kasih...Presensi Anda Telah Disimpan",
            })
            setTimeout(() => router.push("/main"), 100)
          }}
        >
          Simpan
        </Button>
      </div>
    </div>
  )
}
