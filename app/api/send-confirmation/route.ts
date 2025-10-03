import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to_email, nama_lengkap } = await request.json()

    console.log('=== Email API Called ===')
    console.log('To:', to_email)
    console.log('Name:', nama_lengkap)
    console.log('SMTP Email configured:', !!process.env.SMTP_EMAIL)
    console.log('SMTP Password configured:', !!process.env.SMTP_APP_PASSWORD)

    if (!to_email || !nama_lengkap) {
      return NextResponse.json(
        { error: 'Email dan nama lengkap harus diisi' },
        { status: 400 }
      )
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
      console.error('Missing SMTP credentials in environment variables')
      return NextResponse.json(
        { error: 'SMTP credentials not configured' },
        { status: 500 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD,
      },
    })

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #0d9488;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #0d9488;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pendaftaran Magang Berhasil</h1>
          </div>
          <div class="content">
            <p>Yth. <strong>${nama_lengkap}</strong>,</p>
            
            <p>Terima kasih telah mendaftar program magang di <strong>DPMPTSP Provinsi Jawa Tengah</strong>.</p>
            
            <p>Kami telah menerima formulir pendaftaran Anda. Tim kami akan meninjau aplikasi Anda dan menghubungi Anda melalui email atau telepon dalam waktu 3-5 hari kerja.</p>
            
            <p><strong>Langkah selanjutnya:</strong></p>
            <ul>
              <li>Pastikan dokumen yang Anda upload sudah lengkap dan sesuai</li>
              <li>Periksa email Anda secara berkala untuk informasi lebih lanjut</li>
              <li>Siapkan diri untuk kemungkinan proses interview</li>
            </ul>
            
            <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami:</p>
            <ul>
              <li><strong>Email:</strong> ptsp@jatengprov.go.id</li>
              <li><strong>Telepon:</strong> (024) 3520369</li>
            </ul>
            
            <p>Terima kasih atas minat Anda untuk bergabung dengan kami!</p>
            
            <p style="margin-top: 30px;">
              Salam,<br>
              <strong>Tim DPMPTSP Provinsi Jawa Tengah</strong>
            </p>
          </div>
          <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            <p>&copy; 2025 DPMPTSP Provinsi Jawa Tengah. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email
    const info = await transporter.sendMail({
      from: `"DPMPTSP Jawa Tengah" <${process.env.SMTP_EMAIL}>`,
      to: to_email,
      subject: 'Konfirmasi Pendaftaran Magang - DPMPTSP Jawa Tengah',
      html: htmlContent,
    })

    console.log('Email sent:', info.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email konfirmasi berhasil dikirim',
      messageId: info.messageId,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim email konfirmasi', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
