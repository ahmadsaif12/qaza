import { useQuery } from '@tanstack/react-query';
import { fetchPrayerTimes } from '@/lib/aladhan';
import { useAppStore } from '@/store';

export function usePrayerTimes(dateStr: string) {
  const userLocation = useAppStore(state => state.userLocation);
  const calcMethod = useAppStore(state => state.calcMethod);
  const asrMethod = useAppStore(state => state.asrMethod);

  return useQuery({
    queryKey: ['prayerTimes', userLocation?.lat, userLocation?.lng, calcMethod, asrMethod, dateStr],
    queryFn: async () => {
      const lat = userLocation?.lat ?? 21.4225;
      const lng = userLocation?.lng ?? 39.8262;
      return await fetchPrayerTimes(lat, lng, new Date(dateStr), calcMethod, asrMethod);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
