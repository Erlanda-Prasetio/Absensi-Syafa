// Utility function to log activities
export async function logActivity({
  user_id,
  user_email,
  user_name,
  activity_type,
  description,
  metadata = {},
}: {
  user_id?: number | null
  user_email?: string | null
  user_name?: string | null
  activity_type: string
  description: string
  metadata?: Record<string, any>
}) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/activity-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        user_email,
        user_name,
        activity_type,
        description,
        metadata,
      }),
    })
  } catch (error) {
    // Silent fail - don't break the main flow if logging fails
    console.error('Failed to log activity:', error)
  }
}

// Activity type constants
export const ActivityType = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',
  REGISTRATION_SUBMITTED: 'registration_submitted',
  ATTENDANCE_MARKED: 'attendance_marked',
  DIVISION_CREATED: 'division_created',
  DIVISION_UPDATED: 'division_updated',
  DIVISION_DELETED: 'division_deleted',
  DIVISION_SLOTS_RESET: 'division_slots_reset',
} as const

// Helper to format activity description
export function formatActivityTime(date: Date | string): string {
  const now = new Date()
  const activityDate = new Date(date)
  const diffInMs = now.getTime() - activityDate.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Baru saja'
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`
  if (diffInDays === 1) return 'Kemarin'
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`
  
  return activityDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Get color for activity type
export function getActivityColor(activityType: string): {
  bgColor: string
  dotColor: string
} {
  const colorMap: Record<string, { bgColor: string; dotColor: string }> = {
    [ActivityType.LOGIN]: { bgColor: 'bg-green-50', dotColor: 'bg-green-500' },
    [ActivityType.LOGOUT]: { bgColor: 'bg-gray-50', dotColor: 'bg-gray-500' },
    [ActivityType.USER_CREATED]: { bgColor: 'bg-blue-50', dotColor: 'bg-blue-500' },
    [ActivityType.USER_UPDATED]: { bgColor: 'bg-indigo-50', dotColor: 'bg-indigo-500' },
    [ActivityType.USER_DELETED]: { bgColor: 'bg-red-50', dotColor: 'bg-red-500' },
    [ActivityType.REGISTRATION_APPROVED]: { bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-500' },
    [ActivityType.REGISTRATION_REJECTED]: { bgColor: 'bg-orange-50', dotColor: 'bg-orange-500' },
    [ActivityType.REGISTRATION_SUBMITTED]: { bgColor: 'bg-purple-50', dotColor: 'bg-purple-500' },
    [ActivityType.ATTENDANCE_MARKED]: { bgColor: 'bg-teal-50', dotColor: 'bg-teal-500' },
    [ActivityType.DIVISION_CREATED]: { bgColor: 'bg-cyan-50', dotColor: 'bg-cyan-500' },
    [ActivityType.DIVISION_UPDATED]: { bgColor: 'bg-sky-50', dotColor: 'bg-sky-500' },
    [ActivityType.DIVISION_DELETED]: { bgColor: 'bg-rose-50', dotColor: 'bg-rose-500' },
    [ActivityType.DIVISION_SLOTS_RESET]: { bgColor: 'bg-amber-50', dotColor: 'bg-amber-500' },
  }

  return colorMap[activityType] || { bgColor: 'bg-gray-50', dotColor: 'bg-gray-500' }
}
