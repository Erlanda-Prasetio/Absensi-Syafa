"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TugasPanel() {
  const [isDragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setFileName(file.name)
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
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
        <Button type="button" className="w-full uppercase tracking-wide">
          Submit
        </Button>
      </div>
    </div>
  )
}
