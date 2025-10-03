"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Report {
  id: number
  kategori_id: string
  deskripsi: string
  tanggal: string
  nama_terduga: string
  nip_terduga: string | null
  jabatan_terduga: string
  jenis_kelamin: string
  reporter_name: string
  reporter_email: string
  anonim: number
  validasi_pengaduan: number
  recaptcha_verified: number
  status_pengaduan_id?: number
  kode_aduan?: string
  created_at: string
}

interface ApiResponse {
  success: boolean
  data: {
    reports: Report[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  message?: string
}

export default function TestReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalReports, setTotalReports] = useState(0)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/reports?limit=20&offset=0')
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setReports(data.data.reports)
        setTotalReports(data.data.pagination.total)
      } else {
        setError(data.message || 'Failed to fetch reports')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID')
  }

  const getCategoryLabel = (categoryId: string) => {
    const categories: { [key: string]: string } = {
      'korupsi': 'Korupsi',
      'gratifikasi': 'Gratifikasi',
      'benturan-kepentingan': 'Benturan Kepentingan'
    }
    return categories[categoryId] || categoryId
  }

  const getGenderLabel = (gender: string) => {
    return gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan'
  }

  const generateTicketNumber = (reportId: number, createdAt: string) => {
    const timestamp = new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    return `${timestamp}${String(reportId).padStart(5, '0')}`;
  }

  const getStatusLabel = (statusId?: number) => {
    const statuses: { [key: number]: { label: string; color: string } } = {
      1: { label: 'Sedang Diproses', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
      3: { label: 'Ditunda', color: 'bg-yellow-100 text-yellow-800' }
    }
    return statuses[statusId || 1] || statuses[1]
  }

  const updateReportStatus = async (reportId: number, statusId: number, statusLabel: string) => {
    setUpdatingStatus(reportId)
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_pengaduan_id: statusId,
          notes: `Status diubah menjadi ${statusLabel} oleh admin`
        }),
      })

      if (response.ok) {
        // Refresh the reports list
        await fetchReports()
        toast.success("Status laporan berhasil diubah", {
          description: `Status berhasil diubah menjadi "${statusLabel}"`,
          action: {
            label: "OK",
            onClick: () => console.log("Status updated"),
          },
        })
      } else {
        const errorData = await response.json()
        toast.error("Gagal mengubah status", {
          description: errorData.message,
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error("Terjadi kesalahan saat mengubah status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const deleteReport = async (reportId: number) => {
    setUpdatingStatus(reportId)
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the reports list
        await fetchReports()
        toast.success("Laporan berhasil dihapus")
      } else {
        const errorData = await response.json()
        toast.error("Gagal menghapus laporan", {
          description: errorData.message,
        })
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error("Terjadi kesalahan saat menghapus laporan")
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Test Reports Database</h1>
            <p className="text-gray-600 mt-2">
              Total Reports: {totalReports} | API Status: {error ? 'Error' : 'Connected'}
            </p>
          </div>
          <Button onClick={fetchReports} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {reports.length === 0 && !loading && !error && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No reports found. Submit a report to test the database!</p>
              </CardContent>
            </Card>
          )}

          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-lg">Report #{report.id}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {getCategoryLabel(report.kategori_id)}
                      </span>
                    </div>
                    <div className="text-sm font-mono bg-green-100 text-green-800 px-3 py-1 rounded-md inline-block">
                      <span className="font-medium">Kode Aduan:</span> {report.kode_aduan || generateTicketNumber(report.id, report.created_at)}
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusLabel(report.status_pengaduan_id).color}`}>
                        {getStatusLabel(report.status_pengaduan_id).label}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(report.created_at)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Admin Action Buttons */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={updatingStatus === report.id}
                    onClick={() => updateReportStatus(report.id, 1, 'Sedang Diproses')}
                  >
                    {updatingStatus === report.id ? 'Loading...' : 'Proses'}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={updatingStatus === report.id}
                    onClick={() => updateReportStatus(report.id, 2, 'Selesai')}
                  >
                    {updatingStatus === report.id ? 'Loading...' : 'Selesai'}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={updatingStatus === report.id}
                    onClick={() => updateReportStatus(report.id, 3, 'Ditunda')}
                  >
                    {updatingStatus === report.id ? 'Loading...' : 'Ditunda'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingStatus === report.id}
                      >
                        {updatingStatus === report.id ? 'Loading...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Laporan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReport(report.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Report Details */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Report Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Tanggal Kejadian:</span> {report.tanggal}
                      </div>
                      <div>
                        <span className="font-medium">Nama Terduga:</span> {report.nama_terduga}
                      </div>
                      {report.nip_terduga && (
                        <div>
                          <span className="font-medium">NIP Terduga:</span> {report.nip_terduga}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Jabatan Terduga:</span> {report.jabatan_terduga}
                      </div>
                      <div>
                        <span className="font-medium">Jenis Kelamin:</span> {getGenderLabel(report.jenis_kelamin)}
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Reporter Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>{' '}
                        <span className={`px-2 py-1 rounded text-xs ${
                          report.anonim ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {report.anonim ? 'Anonymous' : 'Named'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Name:</span> {report.reporter_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {report.reporter_email}
                      </div>
                      <div>
                        <span className="font-medium">Validated:</span>{' '}
                        <span className={`px-2 py-1 rounded text-xs ${
                          report.validasi_pengaduan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {report.validasi_pengaduan ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">reCAPTCHA Verified:</span>{' '}
                        <span className={`px-2 py-1 rounded text-xs ${
                          report.recaptcha_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {report.recaptcha_verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.deskripsi}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading reports...</p>
          </div>
        )}
      </div>
    </div>
  )
}
