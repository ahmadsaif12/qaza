import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { syncPrayerMutations } from '@/actions/prayers';
import { useQueryClient } from '@tanstack/react-query';

export function useSyncMutations() {
  const offlineMutations = useAppStore(state => state.offlineMutations);
  const removeMutations = useAppStore(state => state.removeMutations);
  const queryClient = useQueryClient();
  const isSyncing = useRef(false);

  useEffect(() => {
    const handleOnline = async () => {
      if (offlineMutations.length > 0 && !isSyncing.current && navigator.onLine) {
        isSyncing.current = true;
        
        // Take a snapshot of the current mutations to avoid wiping out new ones that come in during sync
        const snapshot = [...offlineMutations];
        const ids = snapshot.map(m => m.id);

        try {
          const res = await syncPrayerMutations(snapshot);
          if (res.success) {
            // Optimistically update the query cache so that the UI doesn't flicker when we remove the offline mutations
            snapshot.forEach(mut => {
              if (mut.type === "LOG_PRAYER") {
                const dateStr = mut.payload.date.split('T')[0];
                queryClient.setQueryData(['prayers', dateStr], (old: any) => {
                  if (!old || !old.data) return old;
                  const newData = [...old.data];
                  const existingIdx = newData.findIndex(p => p.prayerName === mut.payload.prayerName);
                  if (existingIdx >= 0) {
                    newData[existingIdx] = { ...newData[existingIdx], status: mut.payload.status };
                  } else {
                    newData.push({ 
                      prayerName: mut.payload.prayerName, 
                      status: mut.payload.status, 
                      date: dateStr 
                    });
                  }
                  return { ...old, data: newData };
                });
              }
            });

            removeMutations(ids);
            queryClient.invalidateQueries({ queryKey: ['prayers'] });
            queryClient.invalidateQueries({ queryKey: ['weeklyConsistency'] });
          }
        } finally {
          isSyncing.current = false;
          
          // If new mutations came in while syncing, trigger again
          const currentMutations = useAppStore.getState().offlineMutations;
          if (currentMutations.length > snapshot.length) {
            handleOnline();
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Attempt sync immediately if we have network and pending mutations
    if (typeof window !== 'undefined') {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [offlineMutations, removeMutations, queryClient]);
}
