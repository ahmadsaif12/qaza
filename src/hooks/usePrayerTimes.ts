import { useQuery } from '@tanstack/react-query';
import { fetchPrayerTimes, PrayerTimes } from '@/lib/aladhan';
import { useAppStore } from '@/store';

export function usePrayerTimes(dateStr: string) {
  const userLocation = useAppStore(state => state.userLocation);

  return useQuery({
    queryKey: ['prayerTimes', userLocation?.lat, userLocation?.lng, dateStr],
    queryFn: async () => {
      // Default to Mecca if not provided yet, or just return mock data? Let's use a default if null
      const lat = userLocation?.lat ?? 21.4225;
      const lng = userLocation?.lng ?? 39.8262;
      return await fetchPrayerTimes(lat, lng, new Date(dateStr));
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
