import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, nama_lengkap } = req.body;
  if (!email || !nama_lengkap) {
    return res.status(400).json({ message: 'Missing email or name' });
  }

  // SMTP config from .env.local
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `DPMPTSP Magang <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Konfirmasi Pendaftaran Magang DPMPTSP',
    html: `<p>Halo ${nama_lengkap},</p>
      <p>Terima kasih telah mendaftar program magang di DPMPTSP Provinsi Jawa Tengah.</p>
      <p>Kami akan segera memproses pendaftaran Anda. Silakan tunggu informasi selanjutnya melalui email ini.</p>
      <br />
      <p>Salam,<br />Tim DPMPTSP Provinsi Jawa Tengah</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ message: 'Failed to send email' });
  }
}
