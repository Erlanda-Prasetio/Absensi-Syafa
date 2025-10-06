import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, nama, kode_pendaftaran, password } = await request.json()

    if (!email || !nama || !kode_pendaftaran || !password) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap (termasuk password)' },
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

    // Email content
    const mailOptions = {
      from: `"DPMPTSP Jawa Tengah" <${smtpUser}>`,
      to: email,
      subject: '🎉 Pendaftaran Magang Anda Disetujui - DPMPTSP Jawa Tengah',
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
              background: linear-gradient(135deg, #00786F 0%, #005f57 100%);
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
            .success-icon {
              text-align: center;
              font-size: 64px;
              margin: 20px 0;
            }
            .info-box {
              background: #f0f9f8;
              border-left: 4px solid #00786F;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #00786F;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #00786F;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f8f8f8;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .next-steps {
              background: #fff9e6;
              border-left: 4px solid #ffa500;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .next-steps h3 {
              margin-top: 0;
              color: #ff8c00;
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
              <h1>🎉 Selamat! Pendaftaran Magang Disetujui</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">✅</div>
              
              <p>Yth. <strong>${nama}</strong>,</p>
              
              <p>Kami dengan senang hati mengumumkan bahwa pendaftaran magang Anda telah <strong>DISETUJUI</strong> oleh tim DPMPTSP Provinsi Jawa Tengah.</p>
              
              <div class="info-box">
                <strong>Kode Pendaftaran:</strong> ${kode_pendaftaran}<br>
                <strong>Status:</strong> <span style="color: #28a745;">Disetujui</span><br>
                <strong>Tanggal Persetujuan:</strong> ${new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>

              <div class="info-box" style="background: #e8f5e9; border-left-color: #4caf50;">
                <h3 style="margin-top: 0; color: #2e7d32;">🔐 Akun Anda Telah Dibuat</h3>
                <p>Gunakan kredensial berikut untuk login ke sistem:</p>
                <strong>Email:</strong> ${email}<br>
                <strong>Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 3px; font-family: monospace; font-size: 14px;">${password}</code><br>
                <br>
                <p style="color: #f57c00; margin: 10px 0;"><strong>⚠️ PENTING:</strong> Simpan password ini dengan aman. Anda dapat mengubah password setelah login pertama kali.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">Login Sekarang</a>
              </div>

              <div class="next-steps">
                <h3>📋 Langkah Selanjutnya:</h3>
                <ul>
                  <li><strong>Login ke sistem</strong> menggunakan email dan password di atas</li>
                  <li><strong>Lengkapi profil Anda</strong> di menu pengaturan</li>
                  <li><strong>Lakukan presensi</strong> setiap hari kerja</li>
                  <li><strong>Submit tugas</strong> yang diberikan oleh pembimbing</li>
                  <li>Cek email secara berkala untuk informasi lebih lanjut</li>
                </ul>
              </div>

              <p>Jika Anda mengalami kesulitan saat login atau memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>

              <p style="margin-top: 30px;">
                <strong>Terima kasih atas minat Anda untuk bergabung dengan DPMPTSP Jawa Tengah!</strong>
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
    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: 'Email persetujuan berhasil dikirim',
    })
  } catch (error) {
    console.error('Error sending approval email:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim email persetujuan' },
      { status: 500 }
    )
  }
}
