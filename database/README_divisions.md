# Division Management System - Setup Guide

## Overview
This guide explains how to set up and use the Division Management System for internship slot tracking in the DPMPTSP admin panel.

## Database Setup

### 1. Run the SQL Schema
Execute the SQL file in your Supabase SQL Editor:
```bash
database/divisions_schema.sql
```

This will create:
- `magang_divisions` table
- Indexes for performance
- Triggers for auto-updating timestamps
- View for active divisions
- 3 default divisions with 0 slots each

### 2. Verify Tables
Check that the following was created:
```sql
SELECT * FROM magang_divisions;
```

You should see 3 default divisions:
1. Bidang Pelayanan Perizinan
2. Bidang Penanaman Modal
3. Bidang Pengendalian & Pengawasan

## Features

### Admin Panel - Division Management

#### Location
Admin Dashboard → **"Manajemen Divisi Magang"** section (below User Management)

#### Quick Access
"Aksi Cepat" sidebar → **"Tambah Divisi Magang"** button

#### CRUD Operations

**1. Create Division (Tambah Divisi)**
- Button: "Tambah Divisi" (top right of section)
- Fields:
  - **Nama Divisi**: Division name (required, must be unique)
  - **Anggota yang Dibutuhkan**: Total slots available (required, >= 0)
  - **Deskripsi**: Optional description

**2. View Divisions**
- Table shows:
  - Nama Divisi
  - Total Slot (total capacity)
  - Slot Tersedia (available slots - green badge)
  - Slot Terisi (filled slots - blue badge)
  - Status (Aktif/Nonaktif)
  - Actions (Edit/Hapus)

**3. Update Division (Edit)**
- Click "Edit" button on any division
- Modify:
  - Division name
  - Total slots (note: shows currently filled slots)
  - Description
- **Important**: When updating total_slots, the system maintains the relationship with available_slots

**4. Delete Division (Hapus)**
- Click "Hapus" button
- Confirmation dialog appears
- Division is permanently deleted

## API Endpoints

### Base URL: `/api/admin/divisions`

#### GET - Fetch all divisions
```http
GET /api/admin/divisions
```
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_divisi": "Bidang Pelayanan Perizinan",
      "total_slots": 10,
      "available_slots": 7,
      "description": "...",
      "is_active": true,
      "created_at": "2025-10-06T...",
      "updated_at": "2025-10-06T..."
    }
  ]
}
```

#### POST - Create new division
```http
POST /api/admin/divisions
Content-Type: application/json

{
  "nama_divisi": "Bidang IT",
  "total_slots": 5,
  "description": "Division for IT interns"
}
```

#### PUT - Update division
```http
PUT /api/admin/divisions
Content-Type: application/json

{
  "id": 1,
  "nama_divisi": "Updated Name",
  "total_slots": 15,
  "available_slots": 12,
  "description": "Updated description"
}
```

#### DELETE - Delete division
```http
DELETE /api/admin/divisions?id=1
```

## Integration with Frontend

### Homepage Division Display

The divisions are displayed on the homepage (`/magang`) in the "Divisi Magang Tersedia" section.

To connect it with the database, update `/app/magang/page.tsx`:

```typescript
// Add state for divisions
const [divisions, setDivisions] = useState([])

// Fetch divisions on component mount
useEffect(() => {
  const fetchDivisions = async () => {
    const response = await fetch('/api/admin/divisions')
    const result = await response.json()
    if (result.success) {
      setDivisions(result.data)
    }
  }
  fetchDivisions()
}, [])

// Map divisions to reportCategories format
const reportCategories = divisions.map(div => ({
  title: div.nama_divisi,
  description: div.description || "...",
  icon: FileText,
  color: "bg-blue-500",
  availableSlots: div.available_slots,
  totalSlots: div.total_slots,
  image: "/images/korupsi.jpg"
}))
```

## Slot Management Logic

### When User Registers
When a user successfully registers for an internship, you should:

1. Decrease `available_slots` by 1:
```sql
UPDATE magang_divisions 
SET available_slots = available_slots - 1 
WHERE id = ? AND available_slots > 0;
```

2. In the registration API (`/api/magang`), add after successful registration:
```typescript
// Decrease available slots
await supabase
  .from('magang_divisions')
  .update({ 
    available_slots: division.available_slots - 1 
  })
  .eq('nama_divisi', selectedDivision)
  .gt('available_slots', 0)
```

### When Registration is Rejected/Cancelled
Increase `available_slots` by 1:
```sql
UPDATE magang_divisions 
SET available_slots = available_slots + 1 
WHERE id = ?;
```

## Validation Rules

1. **Total Slots**
   - Must be >= 0
   - Should be >= filled slots (total_slots >= (total_slots - available_slots))

2. **Available Slots**
   - Must be >= 0
   - Must be <= total_slots

3. **Nama Divisi**
   - Required
   - Must be unique
   - Cannot be empty

## Security Considerations

1. **API Protection**: The `/api/admin/divisions` endpoints should be protected with admin authentication
2. **Validation**: All inputs are validated server-side
3. **Constraints**: Database constraints ensure data integrity

## Example Workflow

### Setting Up New Semester

1. **Admin logs in** → Goes to Admin Panel
2. **Opens Division Management** section
3. **Updates each division**:
   - Bidang Pelayanan Perizinan: 10 slots
   - Bidang Penanaman Modal: 8 slots
   - Bidang Pengendalian & Pengawasan: 5 slots
4. **Saves changes**
5. **Frontend automatically updates** with new slot availability
6. **Students can now register** for divisions with available slots

### Monitoring During Registration Period

- Check "Slot Tersedia" column to see real-time availability
- "Slot Terisi" shows how many students have registered
- Edit slots mid-period if needed (e.g., increase capacity)

## Troubleshooting

### Issue: Division not showing on homepage
**Solution**: Check that `is_active` is `true` in database

### Issue: Cannot decrease total_slots below filled slots
**Solution**: This is intentional. First remove some registrations, then decrease total_slots

### Issue: Duplicate division name error
**Solution**: Division names must be unique. Choose a different name or edit the existing division

## Next Steps

1. ✅ Run `divisions_schema.sql` in Supabase
2. ✅ Test division CRUD in admin panel
3. 🔄 Connect homepage to fetch live division data
4. 🔄 Add slot decrease logic to registration API
5. 🔄 Add admin authentication to division API endpoints

## Files Created/Modified

- `database/divisions_schema.sql` - Database schema
- `app/api/admin/divisions/route.ts` - API endpoints
- `components/admin/admin-panel.tsx` - Admin UI with CRUD interface
- `database/README_divisions.md` - This documentation
