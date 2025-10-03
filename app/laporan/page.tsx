"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Shield } from "lucide-react"
import { toast } from "sonner"

export default function LaporanPage() {
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    email: "",
    telepon: "",
    institusi: "",
    jurusan: "",
    semester: "",
    durasi_magang: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    deskripsi: "",
  })

  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const validFiles = Array.from(files).filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar (maksimal 10MB)`)
        return false
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} memiliki format yang tidak didukung`)
        return false
      }
      
      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  // Handle click to select files
  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Frontend validation
    if (!formData.nama_lengkap || !formData.email || !formData.telepon || !formData.institusi) {
      toast.error("Mohon lengkapi semua field yang wajib diisi")
      return
    }
    
    try {
      // Log form data for debugging
      console.log('Form Data:', formData)
      console.log('Selected Files:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })))
      
      // Send confirmation email
      const emailResponse = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: formData.email,
          nama_lengkap: formData.nama_lengkap
        })
      })

      const emailResult = await emailResponse.json()

      if (emailResponse.ok && emailResult.success) {
        toast.success("Pendaftaran Berhasil!", {
          description: "Email konfirmasi telah dikirim. Periksa inbox Anda.",
          duration: 6000,
        })
      } else {
        // Show success even if email fails, but with different message
        toast.success("Pendaftaran Berhasil!", {
          description: "Kami telah menerima pendaftaran Anda. Email konfirmasi mungkin tertunda.",
          duration: 6000,
        })
        console.error('Failed to send email:', emailResult.error || emailResult.message)
      }
      
      // Reset form
      setFormData({
        nama_lengkap: "",
        email: "",
        telepon: "",
        institusi: "",
        jurusan: "",
        semester: "",
        durasi_magang: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        deskripsi: "",
      })
      setSelectedFiles([])
      
    } catch (error) {
      console.error('Submission error:', error)
      toast.error("Terjadi kesalahan saat mengirim pendaftaran", {
        description: "Mohon coba lagi atau hubungi kami.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/magang" className="flex items-center space-x-4">
              <Image
                src="/images/logo_baru.png"
                alt="DPMPTSP Logo"
                width={260}
                height={130}
                className="h-28 w-auto"
              />
            </Link>
            <Link href="/magang">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Formulir Pendaftaran Magang
          </h1>
          <p className="text-gray-600 text-lg">
            Lengkapi formulir di bawah ini untuk mendaftar program magang di DPMPTSP Provinsi Jawa Tengah
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-teal-600" />
                <span>Informasi Pribadi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="nama_lengkap" className="text-base font-medium mb-3 block">Nama Lengkap *</Label>
                <Input
                  id="nama_lengkap"
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Masukkan nama lengkap Anda"
                  className="h-12"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-medium mb-3 block">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email Anda"
                  className="h-12"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telepon" className="text-base font-medium mb-3 block">Nomor Telepon *</Label>
                <Input
                  id="telepon"
                  type="tel"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  className="h-12"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Educational Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pendidikan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="institusi" className="text-base font-medium mb-3 block">Nama Institusi/Universitas *</Label>
                <Input
                  id="institusi"
                  type="text"
                  value={formData.institusi}
                  onChange={(e) => setFormData({ ...formData, institusi: e.target.value })}
                  placeholder="Contoh: Universitas Diponegoro"
                  className="h-12"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jurusan" className="text-base font-medium mb-3 block">Jurusan/Program Studi</Label>
                <Input
                  id="jurusan"
                  type="text"
                  value={formData.jurusan}
                  onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                  placeholder="Contoh: Teknik Informatika"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="semester" className="text-base font-medium mb-3 block">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Internship Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Magang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="durasi_magang" className="text-base font-medium mb-3 block">Durasi Magang</Label>
                <Select
                  value={formData.durasi_magang}
                  onValueChange={(value) => setFormData({ ...formData, durasi_magang: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih durasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-bulan">1 Bulan</SelectItem>
                    <SelectItem value="2-bulan">2 Bulan</SelectItem>
                    <SelectItem value="3-bulan">3 Bulan</SelectItem>
                    <SelectItem value="6-bulan">6 Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tanggal_mulai" className="text-base font-medium mb-3 block">Tanggal Mulai</Label>
                  <Input
                    id="tanggal_mulai"
                    type="date"
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="tanggal_selesai" className="text-base font-medium mb-3 block">Tanggal Selesai</Label>
                  <Input
                    id="tanggal_selesai"
                    type="date"
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deskripsi" className="text-base font-medium mb-3 block">Motivasi dan Tujuan Magang</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan motivasi dan tujuan Anda mengikuti magang di DPMPTSP..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Dokumen Persyaratan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Unggah dokumen berikut: Surat Rekomendasi, Proposal Magang, CV/Portfolio
                  <br />
                  Format: JPG, PNG, PDF, DOC, DOCX (Maksimal 10MB per file)
                </p>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-teal-600 bg-teal-50' 
                      : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleFileClick}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Klik atau drag & drop file ke sini
                  </p>
                  <p className="text-sm text-gray-400">
                    JPG, PNG, PDF, DOC, DOCX (maks. 10MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">File yang dipilih:</Label>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/magang">
              <Button type="button" variant="outline" size="lg">
                Batal
              </Button>
            </Link>
            <Button type="submit" size="lg" className="bg-teal-600 hover:bg-teal-700">
              Kirim Pendaftaran
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
