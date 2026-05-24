export function getUserLocalDate(timezoneStr: string | null | undefined): string {
  const tz = timezoneStr || 'Asia/Karachi';
  
  // Format as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(new Date());
}

export function getUserLocalHour(timezoneStr: string | null | undefined): number {
  const tz = timezoneStr || 'Asia/Karachi';
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false
  });
  
  return parseInt(formatter.format(new Date()), 10);
}
