# 📋 Internship Application Management System

## Overview
Complete workflow system for reviewing and processing internship applications with email notifications.

---

## 🎯 Features Implemented

### 1. **Pending Registrations API** (`/api/admin/registrations`)
- **Method**: GET
- **Purpose**: Fetch all pending internship applications
- **Returns**: List of applications with:
  - Personal information (name, email, phone)
  - Educational details (institution, major, semester)
  - Internship details (duration, dates, description)
  - Uploaded documents array
  - Application code (kode_pendaftaran)
  - Timestamps

### 2. **Status Update API** (`/api/admin/registrations/[id]/status`)
- **Method**: POST
- **Actions**:
  - ✅ **Approve (Terima)**: Change status to "approved"
  - ❌ **Reject (Tolak)**: Change status to "rejected" with reason
- **Features**:
  - Updates registration status in database
  - Creates status history record
  - Triggers email notification automatically
  - Validates rejection reason requirement

### 3. **Email Notifications**

#### Approval Email (`/api/send-approval`)
- **Subject**: 🎉 Pendaftaran Magang Anda Disetujui
- **Content**:
  - Success message with registration code
  - Approval date
  - Next steps checklist
  - Contact information
  - Professional HTML template

#### Rejection Email (`/api/send-rejection`)
- **Subject**: Informasi Pendaftaran Magang
- **Content**:
  - Polite rejection message
  - **Detailed rejection reason** from admin
  - **3-day retry period** (calculated automatically)
  - Retry date formatted in Indonesian
  - Tips for next application
  - "Daftar Ulang" button
  - Professional HTML template

---

## 🖥️ Admin Panel UI

### Pendaftar Baru Section
Located at the top of admin panel, showing:

#### Card Display for Each Application
- **Header**:
  - Registration code badge (orange)
  - Application date
  - "Baru" count badge

- **Applicant Details**:
  - Full name (bold heading)
  - Email, phone, institution, major
  - Internship duration
  - Number of uploaded documents

- **Description** (if provided):
  - Full text in bordered box

- **Documents List**:
  - Badge for each uploaded file
  - File names (truncated if long)

- **Action Buttons**:
  - **✓ Terima** (Green) - Approve instantly
  - **✕ Tolak** (Red) - Opens rejection dialog

### Rejection Dialog
- **Title**: "Tolak Pendaftaran"
- **Inputs**:
  - Applicant name (display only)
  - **Rejection reason textarea** (required)
  - Character counter
  - "3-day retry" notice
- **Actions**:
  - Cancel button
  - "Tolak & Kirim Email" button (disabled if empty)

### Quick Actions Notification
- **Orange alert box** in sidebar
- Shows count of pending applications
- Large badge with number
- Text: "{count} perlu ditinjau"

---

## 📊 Database Integration

### Tables Used
1. **magang_registrations**
   - Status field: 'pending' → 'approved' / 'rejected'
   - Kode_pendaftaran for tracking

2. **magang_documents**
   - Linked to registration_id
   - Shows uploaded files

3. **magang_status_history**
   - Tracks all status changes
   - Stores rejection reasons
   - Records changed_by (Admin)

### Views
- **v_pending_registrations**: Automatically filters pending applications

---

## 🔄 Complete Workflow

### 1. Application Submitted
```
User fills form → Files uploaded → Status = "pending" → Email confirmation sent
```

### 2. Admin Reviews
```
Admin opens panel → See "Pendaftar Baru" badge → Click to review applications
```

### 3. Approval Flow
```
Admin clicks "✓ Terima" → Confirm dialog → Status updated to "approved" 
→ Approval email sent → Application removed from pending list
```

### 4. Rejection Flow
```
Admin clicks "✕ Tolak" → Dialog opens → Type rejection reason 
→ Click "Tolak & Kirim Email" → Status = "rejected" 
→ Rejection email sent with reason + 3-day retry 
→ Application removed from pending list
```

---

## 📧 Email Templates Features

### Approval Email Highlights
- ✅ Success icon
- Green color scheme
- Detailed next steps
- Professional formatting
- Organization contact info

### Rejection Email Highlights
- ℹ️ Info icon (not negative)
- Empathetic tone
- **Highlighted rejection reason box**
- **Specific retry date** (3 days from now)
- **Formatted in Indonesian date format**
- Tips for improvement
- "Daftar Ulang" call-to-action button
- Link back to registration page

### Example Retry Date Format
```
Anda dapat mendaftar kembali mulai tanggal:
Senin, 9 Oktober 2025
```

---

## 🎨 UI Design Elements

### Color Coding
- **Orange**: Pending/New applications (#FFF3CD background, #FFA500 border)
- **Green**: Approval actions (#28A745)
- **Red**: Rejection actions (#DC3545)
- **Teal**: Primary brand color (#00786F)

### Visual Hierarchy
1. Badge count (large, prominent)
2. Applicant cards (orange highlight for attention)
3. Clear action buttons (green/red)
4. Organized information grid

### Responsive Layout
- Cards stack on mobile
- Action buttons remain accessible
- Dialog overlays centered
- Textarea resizable for long reasons

---

## 🔒 Security Features

- **Service role key** for database operations
- **Admin authentication** required (can be enhanced)
- **Changed_by tracking** in status history
- **Email validation** before sending
- **Error handling** throughout

---

## 🚀 Usage Instructions

### For Admins

1. **Check Notifications**:
   - Look for orange badge in "Aksi Cepat" section
   - Number shows pending applications

2. **Review Application**:
   - Read applicant details carefully
   - Check uploaded documents
   - Review internship duration and dates

3. **Approve Application**:
   - Click "✓ Terima" button
   - Confirm in dialog
   - Applicant receives approval email automatically

4. **Reject Application**:
   - Click "✕ Tolak" button
   - **Write clear, specific rejection reason**
   - Examples:
     - "Dokumen surat rekomendasi belum dilengkapi"
     - "Jurusan tidak sesuai dengan divisi yang tersedia"
     - "Periode magang bentrok dengan program internal"
   - Click "Tolak & Kirim Email"
   - Applicant receives rejection email with your reason

### For Applicants (Rejection Flow)

1. **Receive Rejection Email**:
   - Read rejection reason carefully
   - Note the retry date (3 days later)
   - Review improvement tips

2. **Wait 3 Days**:
   - Prepare better documents
   - Fix issues mentioned
   - Review requirements

3. **Reapply**:
   - Click "Daftar Ulang" button in email
   - OR visit website after retry date
   - Submit improved application

---

## 📝 Configuration Required

### Environment Variables
```env
# Email Service (Nodemailer)
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---

## 🧪 Testing Checklist

- [ ] Admin can see pending registrations
- [ ] Badge count matches number of pending applications
- [ ] Approve button sends success email
- [ ] Reject button opens dialog
- [ ] Rejection reason is required
- [ ] Rejection email includes reason text
- [ ] Rejection email shows correct 3-day retry date
- [ ] Applications disappear after approval/rejection
- [ ] Status history records are created
- [ ] Email templates display correctly

---

## 🔮 Future Enhancements

1. **Auto-assignment** to divisions based on availability
2. **Bulk approval** for multiple applications
3. **Document preview** in modal
4. **Email templates customization** in admin settings
5. **Rejection reason templates** (dropdown)
6. **Application search and filter**
7. **Export to Excel** functionality
8. **Push notifications** for new applications
9. **Interview scheduling** integration
10. **Application analytics dashboard**

---

## 📞 Support

For questions or issues with the internship management system, contact the development team or refer to the API documentation in each route file.

---

**Last Updated**: October 6, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
