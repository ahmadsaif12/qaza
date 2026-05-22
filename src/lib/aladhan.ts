export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export async function fetchPrayerTimes(lat: number, lng: number, date: Date = new Date(), method: number = 2) {
  const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${lat}&longitude=${lng}&method=${method}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch prayer times');
  }
  
  const data = await response.json();
  return data.data.timings as PrayerTimes;
}
