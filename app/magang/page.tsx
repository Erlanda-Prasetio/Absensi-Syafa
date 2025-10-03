"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, AlertTriangle, Shield, Search,  ArrowRight } from "lucide-react"
import { toast } from "sonner";


export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [stats, setStats] = useState({
    korupsi: 0,
    gratifikasi: 0,
    'benturan-kepentingan': 0,
  })

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        const response = await fetch('/api/stats')
        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          const updatedStats = {
            korupsi: 0,
            gratifikasi: 0,
            'benturan-kepentingan': 0,
          }

          // Process the API response data
          result.data.forEach((item: any) => {
            const count = parseInt(item.jumlah_pengaduan, 10) || 0
            const nama = item.nama.toLowerCase()
            
            if (nama === 'korupsi') {
              updatedStats.korupsi = count
            } else if (nama === 'gratifikasi') {
              updatedStats.gratifikasi = count
            } else if (nama.includes('benturan')) {
              updatedStats['benturan-kepentingan'] = count
            }
          })

          setStats(updatedStats)
        } else {
          console.error('Failed to fetch stats: Invalid response format')
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
        // Keep default zero values
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  const handleTrackComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      toast.error("Masukkan nomor tiket pengaduan")
      return
    }

    try {
      // Call the real search API
      const response = await fetch(`/api/search?kode_aduan=${encodeURIComponent(trackingNumber.trim())}`)
      const data = await response.json()

      if (response.ok && data.length > 0) {
        const report = data[0]

        // Prefer upstream status.name and status.description
        const statusName = report?.status?.name || 'Sedang Di Proses'
        const statusDesc = report?.status?.description || 'Menunggu Respon Kepala Dinas'

        toast.success(`${statusName}`, {
          description: statusDesc,
          action: {
            label: "OK",
            onClick: () => console.log("Status checked"),
          },
          duration: 8000,
        })
      } else if (response.status === 404) {
        toast.error(`Tiket ${trackingNumber} tidak ditemukan`, {
          description: "Nomor tiket aduan tidak ditemukan.",
        })
      } else if (response.status === 422) {
        toast.error("Format nomor tiket tidak valid", {
          description: "Pastikan format nomor tiket sudah benar.",
        })
      } else {
        toast.error("Terjadi kesalahan saat mencari tiket", {
          description: "Silakan coba lagi.",
        })
      }

      // Reset form
      setTrackingNumber("")
    } catch (error) {
      console.error("Error tracking complaint:", error)
      toast.error("Terjadi kesalahan saat melacak pengaduan", {
        description: "Silakan coba lagi.",
      })
    }
  }

  const reportCategories = [
    {
      title: "Korupsi",
      description:
        "Laporkan tindakan korupsi yang merugikan negara dan masyarakat. Termasuk penyalahgunaan wewenang, suap, dan penggelapan dana publik.",
      icon: AlertTriangle,
      color: "bg-red-500",
      count: stats.korupsi,
      image: "/images/korupsi.jpg",
    },
    {
      title: "Gratifikasi",
      description:
        "Laporkan pemberian atau penerimaan hadiah, fasilitas, atau keuntungan lain yang dapat mempengaruhi keputusan pejabat.",
      icon: FileText,
      color: "bg-orange-500",
      count: stats.gratifikasi,
      image: "/images/gratifikasi.jpg",
    },
    {
      title: "Benturan Kepentingan",
      description:
        "Laporkan situasi dimana kepentingan pribadi bertentangan dengan kepentingan publik dalam pengambilan keputusan.",
      icon: Shield,
      color: "bg-yellow-500",
      count: stats['benturan-kepentingan'],
      image: "/images/benturan-kepentingan.jpg",
    },
  ]

  useEffect(() => {
    const parseKodeFromUrl = (): string | null => {
      try {
        // First try the normal search params
        const url = new URL(window.location.href);
        let kode = url.searchParams.get("kode_aduan");
        if (kode) return kode;

        // If not found, the email uses a hash with query after it: "#tracking?kode_aduan=..."
        const { hash } = window.location; // includes leading '#'
        if (hash) {
          const qIdx = hash.indexOf("?");
          if (qIdx !== -1) {
            const hashQuery = hash.slice(qIdx + 1);
            const params = new URLSearchParams(hashQuery);
            kode = params.get("kode_aduan");
            if (kode) return kode;
          }

          // Also support cases like "#tracking/kode_aduan=..."
          const slashIdx = hash.indexOf("/");
          if (slashIdx !== -1) {
            const afterSlash = hash.slice(slashIdx + 1);
            const params = new URLSearchParams(afterSlash);
            kode = params.get("kode_aduan");
            if (kode) return kode;
          }
        }

        return null;
      } catch (err) {
        console.error("Failed to parse kode_aduan from URL", err);
        return null;
      }
    };

    const kode = parseKodeFromUrl();
    if (kode) {
      setTrackingNumber(kode);

      // scroll to section
      const trackingSection = document.getElementById("tracking");
      if (trackingSection) {
        // delay slightly to ensure layout is ready
        setTimeout(() => trackingSection.scrollIntoView({ behavior: "smooth" }), 50);
      }

      // focus and select the input inside the tracking section
      setTimeout(() => {
        const input = document.querySelector("#tracking input") as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }, 300);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 md:h-20">
            <Link href="/magang" className="flex items-center space-x-4 cursor-pointer">
              <Image
                src="/images/logo_baru.png"
                alt="PTSP Jateng Logo"
                width={260}
                height={130}
                className="h-28 w-auto"
              />
            </Link>

            <nav className="flex items-center gap-4">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                onClick={() => (window.location.href = "/laporan")}
              >
               Daftar Magang
              </Button>
              <Link href="/login">
                <Button variant="outline" className="px-6 py-3 text-lg">
                  Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Full viewport height */}
      <section className="min-h-[calc(100vh-7rem)] bg-white flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto">
            <div className="lg:w-1/2 mb-8 lg:mb-0 lg:-ml-10 xl:-ml-18">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black md:font-black tracking-tight text-teal-700 mb-6 text-left leading-tight">
                <span className="whitespace-nowrap">Magang Management</span> System
              </h1>
              <p className="text-2xl md:text-3xl lg:text-4xl text-black mb-6 text-left">
                DPMPTSP Provinsi Jawa Tengah
              </p>
              <p className="text-lg md:text-xl text-gray-600 mb-12 text-left leading-relaxed">
                Siap terjun ke dunia investasi dan perizinan? Magang di DPMPTSP tempatnya! Dapatkan pengalaman profesional, kembangkan skill-mu, dan lihat langsung bagaimana proses bisnis berjalan. Mulai langkah karirmu di sini, daftar sekarang!
              </p>
             
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-xl inline-flex items-center gap-3 group"
                onClick={() => (window.location.href = "/laporan")}
              >
                Daftar
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-15 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </div>
            <div className="lg:w-1/2 flex justify-center lg:justify-end lg:ml-6 xl:ml-12">
              <Image
                src="/images/landing.png"
                alt="No Corruption - Anti Corruption Illustration"
                width={475}
                height={475}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Report Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Kategori Pelaporan</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pilih kategori pelanggaran yang ingin Anda laporkan. Setiap laporan akan ditangani dengan serius dan
              profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reportCategories.map((category, index) => {
              const IconComponent = category.icon
              return (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full p-0"
                >
                  <div 
                    className="relative aspect-[4/3] bg-cover bg-center bg-no-repeat w-full"
                    style={{ 
                      backgroundImage: `url(${category.image || "/placeholder.svg"})`,
                      margin: 0,
                      padding: 0,
                      border: 'none'
                    }}
                  >
                    <div
                      className={`absolute top-4 right-4 ${category.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}
                    >
                      {category.count.toLocaleString()} Laporan
                    </div>
                  </div>
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className={`${category.color} p-2 rounded-lg mr-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">{category.title}</h4>
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed flex-grow">{category.description}</p>
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700 mt-auto"
                      onClick={() => (window.location.href = "/laporan")}
                    >
                      Laporkan {category.title}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Berkas Yang Dipersiapkan Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Berkas Yang Dipersiapkan</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pastikan dokumen-dokumen berikut telah disiapkan sebelum mendaftar magang
            </p>
          </div>

          {/* Documents Required */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-teal-600" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 text-center mb-3">Surat Rekomendasi Magang</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                Surat pengantar resmi dari institusi pendidikan yang menyatakan bahwa peserta adalah mahasiswa aktif dan direkomendasikan untuk mengikuti program magang.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-teal-600" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 text-center mb-3">Proposal Magang</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                Dokumen yang berisi latar belakang, tujuan, rencana kegiatan, dan target yang ingin dicapai selama periode magang di DPMPTSP Provinsi Jawa Tengah.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-teal-600" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 text-center mb-3">Portfolio/CV</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                Curriculum Vitae atau portfolio yang menampilkan data diri, riwayat pendidikan, pengalaman organisasi, keterampilan, dan prestasi yang relevan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Hubungi kami */}
      <section id="hubungi" className="py-8 bg-teal-600">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-4xl font-bold text-white mb-4">Hubungi Kami</h3>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Google Maps */}
              <div className="lg:col-span-2 w-full h-[375px] rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1400.1482373025797!2d110.40712987533011!3d-6.983668710982642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e708b4927db6189%3A0x439c487706e546a4!2sDPMPTSP%20Provinsi%20Jawa%20Tengah!5e0!3m2!1sen!2sid!4v1759303729749!5m2!1sen!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              {/* Contact Information */}
              <div className="flex flex-col justify-center">
                <h4 className="text-2xl font-bold text-white mb-6">Kontak</h4>
                <p className="text-teal-100 mb-6 leading-relaxed">
                  Informasi magang lebih lanjut dapat ditanyakan melalui nara hubung DPMPTSP Prov. Jateng
                </p>

                <div className="space-y-4 mb-8">
                  <div>
                    <p className="font-semibold text-white mb-2">DPMPTSP Provinsi Jawa Tengah</p>
                    <p className="text-teal-100">Jl. Mgr Sugiyopranoto No.1, Pendrikan Kidul, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50131</p>
                    <p className="text-teal-100 mt-1">Telepon : (024) 3520369</p>
                    <p className="text-teal-100">email : ptsp@jatengprov.go.id</p>
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="flex items-center gap-4">
                  <a
                    href="https://wa.me/6282436858025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-500 rounded-lg transition-all"
                    title="WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp text-2xl"></i>
                  </a>

                  <a
                    href="mailto:ptsp@jatengprov.go.id"
                    className="w-12 h-12 flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-500 rounded-lg transition-all"
                    title="Email"
                  >
                    <i className="fa-regular fa-envelope text-2xl"></i>
                  </a>

                  <Link href="/laporan">
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg">
                      Daftar Sekarang
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center mb-8">
            <div className="mb-6 md:mb-0">
              <Image
                src="/images/logo_baru.png"
                alt="PTSP Jateng Logo"
                width={360}
                height={180}
                className="h-28 w-auto"
              />
            </div>

            {/* <nav className="flex flex-wrap items-center gap-8">
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Licensing
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </nav> */}
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">© 2025 Internship™. DPMPTSP Provinsi Jawa Tengah.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
