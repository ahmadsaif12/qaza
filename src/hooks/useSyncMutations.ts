import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { syncPrayerMutations } from '@/actions/prayers';
import { useQueryClient } from '@tanstack/react-query';

export function useSyncMutations() {
  const offlineMutations = useAppStore(state => state.offlineMutations);
  const clearMutations = useAppStore(state => state.clearMutations);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = async () => {
      if (offlineMutations.length > 0) {
        console.log("Syncing offline mutations to server...", offlineMutations);
        const res = await syncPrayerMutations(offlineMutations);
        if (res.success) {
          clearMutations();
          queryClient.invalidateQueries({ queryKey: ['prayers'] });
          queryClient.invalidateQueries({ queryKey: ['weeklyConsistency'] });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Attempt sync immediately if we have network and pending mutations
    if (typeof window !== 'undefined' && navigator.onLine && offlineMutations.length > 0) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [offlineMutations, clearMutations]);
}
