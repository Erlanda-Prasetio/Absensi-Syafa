import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, nama, kode_pendaftaran, rejection_reason } = await request.json()

    console.log('Rejection email request:', { email, nama, kode_pendaftaran, has_reason: !!rejection_reason })

    if (!email || !nama || !kode_pendaftaran || !rejection_reason) {
      console.error('Missing required fields:', { email: !!email, nama: !!nama, kode_pendaftaran: !!kode_pendaftaran, rejection_reason: !!rejection_reason })
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check SMTP configuration
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_APP_PASSWORD
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = process.env.SMTP_PORT || '587'
    
    if (!smtpUser || !smtpPass) {
      console.error('SMTP configuration missing')
      return NextResponse.json(
        { success: false, error: 'SMTP tidak dikonfigurasi' },
        { status: 500 }
      )
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Calculate retry date (3 days from now)
    const retryDate = new Date()
    retryDate.setDate(retryDate.getDate() + 3)
    const formattedRetryDate = retryDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Email content
    const mailOptions = {
      from: `"DPMPTSP Jawa Tengah" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Informasi Pendaftaran Magang - DPMPTSP Jawa Tengah',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
            }
            .info-icon {
              text-align: center;
              font-size: 64px;
              margin: 20px 0;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #6c757d;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #495057;
            }
            .reason-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .reason-box h3 {
              margin-top: 0;
              color: #856404;
            }
            .retry-box {
              background: #d1ecf1;
              border-left: 4px solid #17a2b8;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .retry-box h3 {
              margin-top: 0;
              color: #0c5460;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #17a2b8;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .footer {
              background: #f8f8f8;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .tips {
              background: #e7f3ff;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .tips h3 {
              margin-top: 0;
              color: #1976D2;
            }
            ul {
              padding-left: 20px;
            }
            li {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Informasi Pendaftaran Magang</h1>
            </div>
            
            <div class="content">
              <div class="info-icon">ℹ️</div>
              
              <p>Yth. <strong>${nama}</strong>,</p>
              
              <p>Terima kasih telah mendaftar untuk program magang di DPMPTSP Provinsi Jawa Tengah.</p>
              
              <div class="info-box">
                <strong>Kode Pendaftaran:</strong> ${kode_pendaftaran}<br>
                <strong>Status:</strong> <span style="color: #dc3545;">Belum Dapat Diproses</span><br>
                <strong>Tanggal Review:</strong> ${new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>

              <p>Setelah meninjau pendaftaran Anda, saat ini kami <strong>belum dapat memproses</strong> pendaftaran Anda dengan alasan berikut:</p>

              <div class="reason-box">
                <h3>📝 Alasan:</h3>
                <p style="margin: 0; white-space: pre-line;">${rejection_reason}</p>
              </div>

              <div class="retry-box">
                <h3>🔄 Kesempatan Mendaftar Kembali</h3>
                <p>Anda dapat <strong>mendaftar kembali</strong> mulai tanggal:</p>
                <p style="font-size: 18px; font-weight: bold; color: #0c5460; margin: 10px 0;">
                  ${formattedRetryDate}
                </p>
                <p style="margin: 0;">Pastikan Anda telah melengkapi atau memperbaiki dokumen sesuai dengan catatan di atas.</p>
              </div>

              <div class="tips">
                <h3>💡 Tips untuk Pendaftaran Berikutnya:</h3>
                <ul>
                  <li>Pastikan semua dokumen lengkap dan sesuai persyaratan</li>
                  <li>Isi formulir dengan data yang akurat dan jelas</li>
                  <li>Periksa kembali sebelum mengirim pendaftaran</li>
                  <li>Gunakan dokumen dalam format PDF atau JPG yang jelas</li>
                  <li>Pastikan email dan nomor telepon aktif</li>
                </ul>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/laporan" class="button">
                  Daftar Ulang (mulai ${retryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                </a>
              </p>

              <p>Jika Anda memiliki pertanyaan atau memerlukan klarifikasi lebih lanjut, silakan hubungi kami.</p>

              <p style="margin-top: 30px;">
                <strong>Terima kasih atas pengertian Anda.</strong>
              </p>

              <p>Salam hormat,<br>
              <strong>Tim DPMPTSP Provinsi Jawa Tengah</strong></p>
            </div>
            
            <div class="footer">
              <p><strong>DPMPTSP Provinsi Jawa Tengah</strong></p>
              <p>Jl. Mgr. Soegiyapranata No.1, Semarang<br>
              Email: info@dpmptsp.jatengprov.go.id | Telp: (024) 123-4567</p>
              <p style="margin-top: 15px; color: #999;">
                Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    // Send email
    console.log('Sending rejection email to:', email)
    const emailResult = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', emailResult.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email penolakan berhasil dikirim',
    })
  } catch (error: any) {
    console.error('Error sending rejection email:', error)
    console.error('Error details:', error.message, error.code)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim email penolakan' },
      { status: 500 }
    )
  }
}
