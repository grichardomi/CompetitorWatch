/**
 * Calculate scheduledFor datetime respecting quiet hours
 * Handles timezone-aware scheduling with midnight-crossing ranges (e.g., 22:00-06:00)
 */
export function calculateScheduledTime(
  preferredTime: Date,
  quietHoursStart: Date | null,
  quietHoursEnd: Date | null,
  timezone: string
): Date {
  // If no quiet hours set, schedule immediately
  if (!quietHoursStart || !quietHoursEnd) {
    return preferredTime;
  }

  // Convert preferred time to user's timezone for checking
  const userTimeString = preferredTime.toLocaleString('en-US', {
    timeZone: timezone,
  });
  const userTime = new Date(userTimeString);

  // Get hour/minute components from quiet hours (stored as TIME in DB)
  const quietStart = new Date(quietHoursStart);
  const quietEnd = new Date(quietHoursEnd);

  const quietStartHour = quietStart.getUTCHours();
  const quietStartMinute = quietStart.getUTCMinutes();
  const quietEndHour = quietEnd.getUTCHours();
  const quietEndMinute = quietEnd.getUTCMinutes();

  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();

  // Check if current time is within quiet hours
  const isInQuietHours = isTimeInRange(
    currentHour,
    currentMinute,
    quietStartHour,
    quietStartMinute,
    quietEndHour,
    quietEndMinute
  );

  if (!isInQuietHours) {
    return preferredTime; // Not in quiet hours, schedule immediately
  }

  // In quiet hours - delay until quiet hours end
  // Create a date in the user's timezone set to the end time
  const scheduledDate = new Date(userTime);
  scheduledDate.setHours(quietEndHour, quietEndMinute, 0, 0);

  // If quiet hours end time is earlier in day than start time (crossing midnight)
  // and we haven't reached the end time yet, the end time is today
  // Otherwise if start > end (normal same-day range), check if we need tomorrow
  if (quietEndHour < quietStartHour && currentHour >= quietStartHour) {
    // We're past the start of quiet hours and end is earlier hour number
    // So the end is tomorrow
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  } else if (quietEndHour > quietStartHour && currentHour >= quietEndHour) {
    // End hasn't passed yet but current hour >= end hour, so end is tomorrow
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  // Convert back to UTC for storage
  const offset = userTime.getTime() - new Date(userTimeString).getTime();
  return new Date(scheduledDate.getTime() - offset);
}

/**
 * Check if time is within a range (handles ranges that cross midnight)
 * Example: 22:00-06:00 crosses midnight
 * Example: 09:00-17:00 is a normal same-day range
 */
function isTimeInRange(
  hour: number,
  minute: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): boolean {
  const currentMinutes = hour * 60 + minute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (endMinutes > startMinutes) {
    // Range doesn't cross midnight (e.g., 09:00-17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Range crosses midnight (e.g., 22:00-06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Format time for display
 */
export function formatQuietHours(start: Date | null, end: Date | null): string {
  if (!start || !end) return 'Not set';

  const startTime = new Date(start).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = new Date(end).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${startTime} - ${endTime}`;
}
