import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Madhab } from 'adhan';

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

function getCalculationParams(methodId: number) {
  switch (methodId) {
    case 1: return CalculationMethod.Karachi();
    case 2: return CalculationMethod.NorthAmerica(); // ISNA
    case 3: return CalculationMethod.MuslimWorldLeague();
    case 4: return CalculationMethod.UmmAlQura();
    case 5: return CalculationMethod.Egyptian();
    case 7: return CalculationMethod.Tehran();
    case 8: return CalculationMethod.Dubai();
    case 9: return CalculationMethod.Kuwait();
    case 10: return CalculationMethod.Qatar();
    case 11: return CalculationMethod.Singapore();
    case 13: return CalculationMethod.Turkey();
    default: return CalculationMethod.MuslimWorldLeague(); // fallback
  }
}

// Formats a Date object to "HH:mm" in the local time zone
function formatTime(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return "--:--";
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// We keep the function name fetchPrayerTimes so that we don't have to refactor the entire app,
// but now it calculates everything instantly and locally!
export async function fetchPrayerTimes(
  lat: number, 
  lng: number, 
  date: Date = new Date(), 
  method: number = 2, 
  school: number = 0
): Promise<PrayerTimes> {
  const coordinates = new Coordinates(lat, lng);
  const params = getCalculationParams(method);
  
  // school 0 = Shafi/Hanbali/Maliki, 1 = Hanafi
  params.madhab = school === 1 ? Madhab.Hanafi : Madhab.Shafi;
  
  const pt = new AdhanPrayerTimes(coordinates, date, params);
  
  // Calculate standard Imsak (typically 10 minutes before Fajr)
  const imsakTime = pt.fajr ? new Date(pt.fajr.getTime() - 10 * 60000) : null;
  
  return {
    Fajr: formatTime(pt.fajr),
    Sunrise: formatTime(pt.sunrise),
    Dhuhr: formatTime(pt.dhuhr),
    Asr: formatTime(pt.asr),
    Sunset: formatTime(pt.maghrib), 
    Maghrib: formatTime(pt.maghrib),
    Isha: formatTime(pt.isha),
    Imsak: formatTime(imsakTime),
    Midnight: "--:--" // Unused by core UI
  };
}
