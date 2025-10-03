"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload, Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function LaporanPage() {
  const [formData, setFormData] = useState({
    kategori_id: "",
    deskripsi: "",
    tanggal: "",
    nama_terduga: "",
    nip_terduga: "",
    jabatan_terduga: "",
    jenis_kelamin: "",
    nama: "",
    email: "",
    telepon: "",
    anonim: false,
    validasi_pengaduan: false,
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hasFocusedNama, setHasFocusedNama] = useState(false)
  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    underline: false,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [recaptchaToken, setRecaptchaToken] = useState<string>("")
  const [recaptchaVerified, setRecaptchaVerified] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle reCAPTCHA success
  const handleRecaptchaChange = (token: string | null) => {
    if (token) {
      setRecaptchaToken(token)
      setRecaptchaVerified(true)
      console.log('reCAPTCHA verified:', token)
    } else {
      setRecaptchaToken("")
      setRecaptchaVerified(false)
      console.log('reCAPTCHA expired or failed')
    }
  }

  // Handle reCAPTCHA error
  const handleRecaptchaError = () => {
    setRecaptchaToken("")
    setRecaptchaVerified(false)
    console.log('reCAPTCHA error')
  }

  // Reset reCAPTCHA
  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset()
    }
    setRecaptchaToken("")
    setRecaptchaVerified(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        
        // setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const [employees, setEmployees] = useState<Array<{ name: string; jabatan: string | null; nip: string | null }>>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  
  // Fetch employee data when component mounts
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        console.log('Fetching employees...');
        const response = await fetch('/api/pegawai');

        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        const data = JSON.parse(responseText);
        console.log('Parsed data:', data);

        if (Array.isArray(data)) {
          const validEmployees = data
            .filter((emp: any) => emp && typeof emp === 'object' && emp.name)
            .map((emp: any) => ({
              name: emp.name,
              jabatan: emp.jabatan || null,
              nip: emp.nip || null
            }));
          console.log('Processed employees:', validEmployees);
          setEmployees(validEmployees);
        } else {
          console.error('Invalid data format received:', data);
          toast.error('Format data pegawai tidak valid');
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Gagal memuat daftar pegawai');
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [])

  // No initialization needed for reCAPTCHA - it handles itself

  // List of names for dropdown
  // const namesList = [
  //   "Aldriyan Satria Pradiksa, S.Kom",
  //   "Arinta Sistyanika, S.IP",
  //   "Ariyanto, SH",
  //   "Arya Parama Widya, S.IP",
  //   "Christina Harianti Nugraheni, S.STP, MAP",
  //   "Danang Pambudi, SH",
  //   "Dra. Ratna Dewajati, MT",
  //   "Dra. ST Khasanaturodhiyah, M.Si",
  //   "Drs. Johan Hadiyanto, M.Si",
  //   "Dwi Yuli Wibowo, A.Md",
  //   "Erlin Nur Marfuah .S.IP, M.Sos.",
  //   "Erna Sulandari, SE",
  //   "Fajar Efendi, S.STP. MM",
  //   "Hoerun Nisa, S.STP",
  //   "Isnin Ulfana.. S.STP",
  //   "Joko Supomo, S.Sos",
  //   "Linda Widiastuti Ariningrum, S.Sos, M.Si",
  //   "Meira Kartika Putri, S.STP",
  //   "Mochammad Rizal Sidik, SE, MAP.",
  //   "Mohamad Arifin Katili, S.Sos, MM",
  //   "Munawir, SH.MH",
  //   "Natalia, SE.",
  //   "Nency Widya Rahayu, SE. Akt, M.Ak.",
  //   "Novan Dwi Anggarda, S.Kom",
  //   "Novan Dwi Anggarda, S.Kom a",
  //   "Noviana Handajani, S.IP, MM",
  //   "PRADITYA YUDHA ARKA PRATAMA S. Ak",
  //   "Primasto Ardi Martono, SE.MT",
  //   "Purwadi Teguh Al Rosyid, SH, MPA",
  //   "Purwadi Teguh Al Rosyid, SH. MPA.",
  //   "Ratna Kawuri, SH",
  //   "Rifgi Majid, S.Kom",
  //   "Rutty Yosika, S.Sos, MM",
  //   "SONY HARSANTO, SE, MM",
  //   "Sekar Cahyo Laksanti, SE",
  //   "Setya Budi Prayitno, SE. MM",
  //   "Sri Wahyuningsih, SH.",
  //   "Sulistiyana, SE, MM.",
  //   "Supriharjiyanto, ST, MT",
  //   "TAVIANA DEWI HANDAYANI, ST",
  //   "ZAKIA KAHFIDYA RATNASARI, ST, MM",
  // ]

  // Debug employees state
  useEffect(() => {
    console.log('Current employees state:', employees);
  }, [employees]);

  // Build list once; filter by searchTerm if provided
  const allEmployeeItems = (employees || []).filter(e => e && typeof e.name === 'string' && e.name.trim().length > 0)
  const shownEmployees = searchTerm
    ? allEmployeeItems.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : allEmployeeItems

  // Show all names initially, filter only when searching
  const filteredNames = employees
    .filter(e => e?.name)
    .map(e => e.name)

  // Only apply search filter if there's a search term
  const searchFilteredNames = searchTerm
    ? filteredNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredNames

  // Check formatting states
  const checkFormatStates = () => {
    try {
      setFormatStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      })
    } catch (error) {
      // Fallback if queryCommandState is not supported
      console.log('queryCommandState not supported')
    }
  }

  // Handle formatting commands
  const handleFormat = (command: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
    document.execCommand(command)
    setTimeout(() => {
      checkFormatStates()
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }, 10) 
  }

  // Handle list commands specially
  const handleListFormat = (command: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      
      // For lists, we need to ensure there's a selection or cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount === 0) {
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        selection.addRange(range)
      }
    }
    
    document.execCommand(command)
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }, 50) // Longer delay for lists to properly render
  }

  // Handle file selection
  const handleFileSelect = (files: FileList) => {
    const maxFileCount = 10; // Maximum number of files allowed
    const currentFileCount = selectedFiles.length;
    const newFilesArray = Array.from(files);
    
    // Check if adding new files would exceed the limit
    if (currentFileCount + newFilesArray.length > maxFileCount) {
      toast.error(`Maksimal ${maxFileCount} file yang dapat diunggah`, {
        description: `Anda sudah memiliki ${currentFileCount} file. Hanya dapat menambah ${maxFileCount - currentFileCount} file lagi.`
      })
      return;
    }
    
    const validFiles = newFilesArray.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ]
      const maxSize = 2 * 1024 * 1024 // 2MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`File ${file.name} memiliki format yang tidak didukung`, {
          description: "Gunakan PDF, DOC, DOCX, JPG, JPEG, atau PNG."
        })
        return false
      }
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar`, {
          description: "Maksimal ukuran file adalah 2MB."
        })
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
    
    // Validate reCAPTCHA
    if (!recaptchaVerified) {
      toast.error("Mohon selesaikan verifikasi reCAPTCHA terlebih dahulu.")
      return
    }

    // Validate required checkbox
    if (!formData.validasi_pengaduan) {
      toast.error("Mohon centang pernyataan validasi data terlebih dahulu.")
      return
    }
    
    try {
      // Verify reCAPTCHA token with server
      const verifyResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaToken }),
      })
      
      const verifyResult = await verifyResponse.json()
      
      if (!verifyResult.success) {
        toast.error("Verifikasi reCAPTCHA gagal. Mohon coba lagi.")
        resetRecaptcha()
        return
      }
      
      // Prepare data for database (convert boolean to 0/1)
      const dbFormData = {
        ...formData,
        anonim: formData.anonim ? 1 : 0,
        validasi_pengaduan: formData.validasi_pengaduan ? 1 : 0,
        // placeholder for kode_aduan; backend may overwrite/generate
        kode_aduan: undefined as unknown as string,
        captchaVerified: true
      }
      
      // Log what we're sending to the API
      const dbFormDataWithCode = {
        ...dbFormData,
        kode_aduan: `${new Date().toISOString().slice(0,10).replace(/-/g,'')}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
      };
      
      console.log('formData:', JSON.stringify(dbFormDataWithCode, null, 2));
      console.log('Selected Files:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
      console.log('=====================================');
      
      // Create FormData for multipart/form-data submission (to support file uploads)
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(dbFormDataWithCode).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, String(value));
        }
      });
      
      // Append files with bukti[] field name (as expected by the API)
      selectedFiles.forEach((file, index) => {
        formDataToSend.append('bukti[]', file, file.name);
      });
      
      // Submit form data to the reports API using FormData
      const submitResponse = await fetch('/api/reports', {
        method: 'POST',
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        body: formDataToSend,
      })
      
      const submitResult = await submitResponse.json()
      
      console.log('API Response:', {
        status: submitResponse.status,
        data: submitResult
      });
      
      if (submitResponse.status === 200 && submitResult.message) {
        // Fill the generated kode_aduan back into our local form data object
        dbFormData.kode_aduan = submitResult?.data?.kode_aduan;
        
        // Log success including generated kode_aduan
        console.log('Submit success:', {
          formData: dbFormData,
          generated_kode_aduan: submitResult?.data?.kode_aduan || '(no code returned)'
        });

        // Send confirmation email
        try {
          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to_email: formData.email,
              kode_aduan: submitResult.data.kode_aduan
            })
          });

          if (!emailResponse.ok) {
            console.error('Failed to send email notification');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }

        toast.success("Laporan Anda Berhasil Di Kirim!", {
          description: `Silahkan Catat Kode Aduan Anda: ${submitResult.data.kode_aduan}`,
          action: {
            label: "OK",
            onClick: () => console.log("OK clicked"),
          },
          duration: 10000, // Show for 10 seconds
        })
        
        // Reset form on successful submission
        setFormData({
          kategori_id: "",
          deskripsi: "",
          tanggal: "",
          nama_terduga: "",
          nip_terduga: "",
          jabatan_terduga: "",
          jenis_kelamin: "",
          nama: "",
          email: "",
          telepon: "",
          anonim: false,
          validasi_pengaduan: false,
        })
        setSelectedFiles([])
        resetRecaptcha() // Reset reCAPTCHA
        
        // Clear rich text editor
        if (editorRef.current) {
          editorRef.current.innerHTML = ""
        }
        
      } else if (submitResponse.status === 422) {
        // Validation errors - new format
        const errorMessages = Object.entries(submitResult)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        toast.error("Validasi gagal", {
          description: errorMessages,
          duration: 8000,
        })
      } else {
        // Other errors
        toast.error(`Terjadi kesalahan: ${submitResult.message || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Submission error:', error)
      toast.error("Terjadi kesalahan saat mengirim laporan. Mohon coba lagi.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 md:h-20">
            <Link href="/" className="flex items-center space-x-4 cursor-pointer">
              <Image
                src="/images/logo_baru.png"
                alt="PTSP Jateng Logo"
                width={220}
                height={110}
                className="h-28 w-auto"
              />
            </Link>

            <nav className="hidden lg:flex items-center">
              <Button
                className="bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 px-8 py-3 text-lg flex items-center space-x-2"
                onClick={() => (window.location.href = "/")}
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Kembali</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Formulir Pelaporan</h2>
            <p className="text-lg text-gray-600">Isi formulir di bawah ini dengan lengkap dan jelas</p>
          </div>

          {/* Security Notice */}
          <Card className="mb-8 border-teal-200 bg-teal-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-teal-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-teal-800 mb-2">Jaminan Keamanan</h3>
                  <p className="text-teal-700 text-sm">
                    Identitas Anda akan dilindungi secara rahasia sesuai dengan ketentuan hukum yang berlaku. Setiap data yang Anda berikan akan dienkripsi dan hanya dapat diakses oleh tim investigasi yang berwenang.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-8">

             {/* Reporter Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelapor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="anonim"
                    checked={formData.anonim}
                    onCheckedChange={(checked) => setFormData({ ...formData, anonim: checked as boolean })}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="anonim" className="text-base font-medium">
                    Saya ingin melaporkan secara anonim
                  </Label>
                </div>

                {!formData.anonim && (
                  <div className="space-y-8">
                    <div>
                      <Label htmlFor="nama" className="text-base font-medium mb-3 block">Nama Lengkap *</Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        placeholder="Masukkan nama lengkap Anda"
                        className="h-12"
                        required={!formData.anonim}
                      />
                    </div>
                   
                    <div className="space-y-8">
                      <div>
                        <Label htmlFor="telepon" className="text-base font-medium mb-3 block">Nomor Telepon</Label>
                        <Input
                          id="telepon"
                          value={formData.telepon}
                          onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                          className="h-12"
                        />
                      </div>
                    </div>
                     
                  </div>
                )}
             
                  <div className="mb-6">
                    <Label htmlFor="email" className="text-base font-medium mb-3 mt-3 block">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Masukan Email Anda"
                      className="h-12"
                      required
                    />
                  </div>
          
              </CardContent>
            </Card>

            {/* Report Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Detail Pelanggaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <Label htmlFor="kategori" className="text-base font-medium mb-3 block">Kategori Pelanggaran *</Label>
                  <Select
                    value={formData.kategori_id}
                    onValueChange={(value) => setFormData({ ...formData, kategori_id: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Pilih kategori pelanggaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="korupsi">Korupsi</SelectItem>
                      <SelectItem value="gratifikasi">Gratifikasi</SelectItem>
                      <SelectItem value="benturan-kepentingan">Benturan Kepentingan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deskripsi" className="text-base font-medium mb-3 block">Deskripsi Pelanggaran *</Label>
                  <div className="border border-gray-300 rounded-md">
                    <div className="border-b border-gray-200 p-3 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            formatStates.bold 
                              ? 'bg-blue-100 border-blue-300 text-blue-700' 
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleFormat('bold')
                          }}
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            formatStates.italic 
                              ? 'bg-blue-100 border-blue-300 text-blue-700' 
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleFormat('italic')
                          }}
                        >
                          <em>I</em>
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            formatStates.underline 
                              ? 'bg-blue-100 border-blue-300 text-blue-700' 
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleFormat('underline')
                          }}
                        >
                          <u>U</u>
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleListFormat('insertUnorderedList')
                          }}
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleListFormat('insertOrderedList')
                          }}
                        >
                          1. List
                        </button>
                      </div>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[150px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                      style={{ wordWrap: 'break-word', direction: 'ltr', unicodeBidi: 'normal' }}
                      onInput={(e) => {
                        const content = e.currentTarget.textContent || '';
                        setFormData({ ...formData, deskripsi: content });
                      }}
                      onKeyUp={checkFormatStates}
                      onMouseUp={checkFormatStates}
                      onFocus={checkFormatStates}
                      suppressContentEditableWarning={true}
                      data-placeholder="Jelaskan secara detail pelanggaran yang terjadi, termasuk siapa yang terlibat, kapan terjadi, dan bagaimana kronologinya..."
                    />
                  </div>
                  <style jsx>{`
                    [contenteditable]:empty:before {
                      content: attr(data-placeholder);
                      color: #9ca3af;
                      font-style: italic;
                    }
                  `}</style>
                </div>

                <div>
                  <Label htmlFor="tanggal" className="text-base font-medium mb-3 block">Tanggal Kejadian *</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="namaTerduga" className="text-base font-medium mb-3 block">Nama Terduga *</Label>
                    <div className="relative" ref={dropdownRef}>
                      <Input
                        id="namaTerduga"
                        value={searchTerm || formData.nama_terduga}
                        onChange={(e) => {
                          const val = e.target.value
                          setSearchTerm(val)
                          setIsDropdownOpen(true)
                          if (!val) {
                            setFormData({ ...formData, nama_terduga: "" })
                          }
                        }}
                        onFocus={() => { setHasFocusedNama(true); setIsDropdownOpen(true) }}
                        placeholder="Ketik untuk mencari nama terduga..."
                        className="h-12"
                        required
                        autoComplete="off"
                      />
                      {isDropdownOpen && hasFocusedNama && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                          {isLoadingEmployees ? (
                              <div className="px-4 py-2 text-gray-500 text-sm">
                                Memuat daftar pegawai...
                              </div>
                            ) : shownEmployees.length > 0 ? (
                              shownEmployees.map((emp: { name: string; jabatan: string | null; nip: string | null }, index) => (
                                <div
                                  key={index}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFormData({ 
                                      ...formData, 
                                      nama_terduga: emp.name, 
                                      jabatan_terduga: emp.jabatan || "", 
                                      nip_terduga: emp.nip || "" 
                                    });
                                    setSearchTerm("");
                                    setIsDropdownOpen(false);
                                  }}
                                >
                                  <div className="font-medium">{emp.name}</div>
                                  {/* {emp.jabatan && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {emp.jabatan}
                                    </div>
                                  )}
                                  {emp.nip && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {emp.nip}
                                    </div>
                                  )} */}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">
                                Tidak ada nama yang ditemukan
                              </div>
                          )}
                        </div>
                      )}
                      {formData.nama_terduga && !searchTerm && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, nama_terduga: "" })
                              setSearchTerm("")
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {formData.nama_terduga && !searchTerm && (
                      <div className="mt-2 text-sm text-gray-600">
                        Dipilih: <span className="font-medium">{formData.nama_terduga}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nipTerduga" className="text-base font-medium mb-3 block">NIP Terduga</Label>
                    <Input
                      id="nipTerduga"
                      value={formData.nip_terduga}
                      onChange={(e) => setFormData({ ...formData, nip_terduga: e.target.value })}
                      placeholder="Isikan NIP terduga jika tidak ada (-)"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="jabatanTerduga" className="text-base font-medium mb-3 block">Jabatan Terduga *</Label>
                    <Input
                      id="jabatanTerduga"
                      value={formData.jabatan_terduga}
                      onChange={(e) => setFormData({ ...formData, jabatan_terduga: e.target.value })}
                      placeholder="Isikan Jabatan Terduga"
                      className="h-12"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jenisKelamin" className="text-base font-medium mb-3 block">Jenis Kelamin *</Label>
                    <Select
                      value={formData.jenis_kelamin}
                      onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bukti[]">Lampiran Bukti (Wajib)</Label>
                  <p className="text-sm text-gray-500 mb-3">Satu atau lebih file bukti</p>
                  <div 
                    className={`relative mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      isDragging 
                        ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={handleFileClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors duration-200 ${
                      isDragging ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm mb-2 transition-colors duration-200 ${
                      isDragging ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {isDragging ? 'Lepaskan file di sini' : 'Klik untuk upload atau drag & drop file'}
                    </p>
                    <p className="text-xs text-gray-500">Format: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 2MB per file)</p>
                    <input 
                      ref={fileInputRef}
                      name="bukti[]"
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileSelect(e.target.files)
                        }
                      }}
                    />
                  </div>
                  
                  {/* Selected files display */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">File yang dipilih:</p>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {file.type.startsWith('image/') ? (
                                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Validation Checkbox */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="validasi_pengaduan"
                        checked={formData.validasi_pengaduan}
                        onCheckedChange={(checked) => setFormData({ ...formData, validasi_pengaduan: checked as boolean })}
                        className="h-5 w-5 mt-1"
                      />
                      <Label htmlFor="validasi_pengaduan" className="text-base leading-relaxed">
                        Dengan ini saya menyatakan bahwa seluruh data yang telah diisi adalah benar, akurat, dan sesuai dengan kondisi yang sebenarnya.
                      </Label>
                    </div>
                  </div>
                </div>
                
              </CardContent>
            </Card>

            

            {/* Submit Button */}
            <div className="flex justify-start">
              <div>
                {/* Google reCAPTCHA v2 */}
                <div className="mb-6">
                  <Label className="text-base font-medium mb-3 block">Verifikasi Keamanan *</Label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                      onChange={handleRecaptchaChange}
                      onError={handleRecaptchaError}
                      onExpired={() => handleRecaptchaChange(null)}
                      theme="light"
                      size="normal"
                    />
                    {recaptchaVerified && (
                      <div className="flex items-center text-green-600 text-sm mt-2">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verifikasi berhasil
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Centang kotak di atas untuk memverifikasi bahwa Anda bukan robot
                  </p>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!recaptchaVerified || !formData.validasi_pengaduan}
                  className={`px-8 transition-all duration-200 ${
                    (recaptchaVerified && formData.validasi_pengaduan)
                      ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
                      : 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                  }`}
                >
                  Kirim Laporan
                </Button>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Dengan mengirim laporan ini, Anda menyatakan bahwa informasi yang diberikan adalah benar dan dapat
                  dipertanggungjawabkan.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
