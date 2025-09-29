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

  // Determine current presensi type based on time
  const getPresensiType = () => {
    const now = new Date()
    const hour = now.getHours()
    
    // Presensi Masuk: 6 AM - 9 AM
    // Presensi Pulang: 1 PM - 6 PM
    if (hour >= 6 && hour < 9) {
      return { type: 'masuk', label: 'Presensi Masuk', available: true }
    }
    else if (hour >= 13 && hour < 18) {
      return { type: 'pulang', label: 'Presensi Pulang', available: true }
    }
    // Outside allowed hours
    else {
      return { type: 'none', label: 'Presensi Tidak Tersedia', available: false }
    }
  }

  const presensiInfo = getPresensiType()

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
          {presensiInfo.label}
        </p>
        <p className="mt-1 text-center text-lg font-semibold">{time ? time : "— — : — —"}</p>
        {!presensiInfo.available && (
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Masuk: 06:00-09:00 | Pulang: 13:00-18:00
          </p>
        )}
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
          disabled={!file || !presensiInfo.available}
          onClick={async () => {
            if (!presensiInfo.available) {
              toast({
                title: "Error",
                description: "Presensi hanya tersedia pada jam 06:00-09:00 (masuk) dan 13:00-18:00 (pulang)",
              })
              return
            }
            
            if (!file) {
              toast({
                title: "Error",
                description: "Silakan ambil foto selfie terlebih dahulu",
              })
              return
            }
            console.log('🔄 Starting presensi save...', presensiInfo.type)
            
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
                  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false })
                  const currentDate = now.toISOString().split('T')[0]
                  
                  // Build record data based on presensi type
                  const recordData: any = {
                    name: 'Nama Pengguna', // TODO: Replace with actual user name
                    university: 'Universitas Contoh', // TODO: Replace with actual university
                    presensi_date: currentDate,
                  }
                  
                  if (presensiInfo.type === 'masuk') {
                    // For masuk: use existing structure
                    recordData.presensi_time = currentTime  // This is check-in time
                    recordData.image_url = publicUrl
                    recordData.image_filename = file.name
                  } else if (presensiInfo.type === 'pulang') {
                    // For pulang: only add the presensi_out time
                    recordData.presensi_out = currentTime
                  }
                  
                  console.log('💾 Processing record:', recordData)
                  
                  let insertData, insertError
                  
                  if (presensiInfo.type === 'pulang') {
                    // For pulang, update existing record with presensi_out time
                    console.log('🔍 Looking for existing record with:', { currentDate, name: recordData.name })
                    
                    // First try today's record
                    let { data: existingRecord, error: findError } = await supabase
                      .from('presensi_records')
                      .select('id, presensi_date, name, presensi_time')
                      .eq('presensi_date', currentDate)
                      .eq('name', recordData.name)
                      .single()
                      
                    console.log('🎯 Today\'s record search:', { existingRecord, findError })
                    
                    // If no record for today, get the latest record that doesn't have presensi_out yet
                    if (!existingRecord) {
                      console.log('📅 No record for today, looking for latest record without presensi_out...')
                      const { data: latestRecord } = await supabase
                        .from('presensi_records')
                        .select('id, presensi_date, name, presensi_time, presensi_out')
                        .eq('name', recordData.name)
                        .is('presensi_out', null)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single()
                      
                      existingRecord = latestRecord
                      console.log('🎯 Found latest record without presensi_out:', existingRecord)
                    }
                    
                    if (existingRecord) {
                      // Update existing record with check-out time
                      const updateResult = await supabase
                        .from('presensi_records')
                        .update({
                          presensi_out: recordData.presensi_out
                        })
                        .eq('id', existingRecord.id)
                      
                      insertData = updateResult.data
                      insertError = updateResult.error
                      console.log('📝 Updated existing record with presensi_out time')
                    } else {
                      // No existing record, show error (user should check-in first)
                      toast({
                        title: "Error",
                        description: "Anda harus presensi masuk terlebih dahulu sebelum presensi pulang",
                      })
                      return
                    }
                  } else {
                    // For masuk, always insert new record
                    const insertResult = await supabase
                      .from('presensi_records')
                      .insert(recordData)
                    
                    insertData = insertResult.data
                    insertError = insertResult.error
                    console.log('📝 Created new record for masuk')
                  }
                  
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
              title: "Terima Kasih",
              description: `${presensiInfo.label} Telah Disimpan`,
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
