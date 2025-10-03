import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to_email, nama_lengkap } = await request.json()

    // Validate required fields
    if (!to_email || !nama_lengkap) {
      return NextResponse.json(
        { success: false, message: 'Email dan nama lengkap harus diisi' },
        { status: 400 }
      )
    }

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER, // Your Gmail address
        pass: process.env.SMTP_PASS, // Your Gmail App Password
      },
    })

    // Email content
    const mailOptions = {
      from: `"DPMPTSP Jawa Tengah" <${process.env.SMTP_USER}>`,
      to: to_email,
      subject: 'Konfirmasi Pendaftaran Magang - DPMPTSP Jawa Tengah',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #0d9488;
              font-weight: bold;
            }
            .message {
              margin-bottom: 20px;
              line-height: 1.8;
            }
            .info-box {
              background: #f0fdfa;
              border-left: 4px solid #0d9488;
              padding: 15px;
              margin: 20px 0;
            }
            .info-box h3 {
              margin-top: 0;
              color: #0d9488;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
              color: #6b7280;
            }
            .footer a {
              color: #0d9488;
              text-decoration: none;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #0d9488;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Pendaftaran Magang Berhasil!</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Halo ${nama_lengkap},</p>
            
            <p class="message">
              Terima kasih telah mendaftar program magang di <strong>DPMPTSP Provinsi Jawa Tengah</strong>!
            </p>
            
            <p class="message">
              Kami telah menerima formulir pendaftaran Anda dan sedang dalam proses review. 
              Tim kami akan menghubungi Anda melalui email ini dalam <strong>3-5 hari kerja</strong> 
              untuk informasi lebih lanjut mengenai status pendaftaran Anda.
            </p>
            
            <div class="info-box">
              <h3>📋 Langkah Selanjutnya:</h3>
              <ul>
                <li>Pastikan dokumen persyaratan sudah lengkap dan sesuai</li>
                <li>Periksa email Anda secara berkala untuk update dari kami</li>
                <li>Jika ada pertanyaan, hubungi kami melalui kontak yang tersedia</li>
              </ul>
            </div>
            
            <p class="message">
              Jika Anda memiliki pertanyaan atau memerlukan informasi lebih lanjut, 
              jangan ragu untuk menghubungi kami melalui:
            </p>
            
            <p style="margin-left: 20px;">
              📧 Email: <a href="mailto:ptsp@jatengprov.go.id" style="color: #0d9488;">ptsp@jatengprov.go.id</a><br>
              📱 Telepon: (024) 3520369<br>
              📍 Alamat: Jl. Mgr Sugiyopranoto No.1, Semarang 50131
            </p>
            
            <p class="message">
              Kami sangat menghargai minat Anda untuk bergabung dengan program magang kami.
            </p>
            
            <p style="margin-top: 30px;">
              Salam Hormat,<br>
              <strong>Tim DPMPTSP Provinsi Jawa Tengah</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>
              Email ini dikirim secara otomatis. Mohon tidak membalas email ini.<br>
              © 2025 DPMPTSP Provinsi Jawa Tengah. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { success: true, message: 'Email konfirmasi berhasil dikirim' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim email konfirmasi', error: String(error) },
      { status: 500 }
    )
  }
}
