"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function TugasPanel() {
  const [isDragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const selectedFile = e.dataTransfer.files?.[0]
    if (selectedFile) {
      setFileName(selectedFile.name)
      setFile(selectedFile)
    }
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFileName(selectedFile.name)
      setFile(selectedFile)
    }
  }

  return (
    <div className="rounded-xl bg-card border px-4 py-5 md:px-6 md:py-6">
      <h2 className="font-semibold mb-4">Tugas</h2>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "block w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border bg-secondary/20",
        )}
      >
        <input type="file" className="sr-only" onChange={onChange} aria-label="Unggah berkas tugas" />
        <p className="text-sm">Seret & lepaskan berkas ke sini, atau klik untuk memilih.</p>
        {fileName && <p className="mt-2 text-sm font-medium">Dipilih: {fileName}</p>}
      </label>

      <div className="mt-4">
        <Button 
          type="button" 
          className="w-full uppercase tracking-wide"
          disabled={!file}
          onClick={async () => {
            if (!file) {
              toast({
                title: "Error",
                description: "Silakan pilih file terlebih dahulu",
              })
              return
            }

            console.log('🔄 Starting tugas submission...')
            
            try {
              const mod = await import('@/lib/supabase')
              const getBrowserSupabase = mod.getBrowserSupabase
              const supabase = getBrowserSupabase()
              
              console.log('📡 Supabase client:', supabase ? 'Connected' : 'Not available')
              console.log('📁 File selected:', file.name)
              
              if (supabase && file) {
                console.log('⬆️ Starting upload...')
                
                // Upload file to tugas-files storage
                const fileName = `submissions/tugas_${Date.now()}_${file.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('tugas-files')
                  .upload(fileName, file)

                console.log('📦 Upload result:', { uploadData, uploadError })

                if (!uploadError) {
                  const publicUrl = supabase.storage.from('tugas-files').getPublicUrl(fileName).data.publicUrl
                  console.log('🔗 Public URL:', publicUrl)
                  
                  const now = new Date()
                  const recordData = {
                    name: 'Nama Pengguna', // TODO: Replace with actual user name
                    university: 'Universitas Contoh', // TODO: Replace with actual university
                    submission_time: now.toLocaleTimeString('en-GB', { hour12: false }),
                    submission_date: now.toISOString().split('T')[0],
                    file_url: publicUrl,
                    file_name: file.name,
                    file_type: file.type,
                  }
                  
                  console.log('💾 Inserting record:', recordData)
                  
                  const { data: insertData, error: insertError } = await supabase
                    .from('tugas_submissions')
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
                    title: "Error upload file",
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
              title: "Terima Kasih...Tugas Anda Telah Dikirim",
            })
            setTimeout(() => router.push("/main"), 100)
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}
