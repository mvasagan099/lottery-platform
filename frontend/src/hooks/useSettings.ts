import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';
import { SystemSettings } from '../types/settings';
import toast from 'react-hot-toast';

export function useSettings<K extends keyof SystemSettings>(category: K) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', category],
    queryFn: () => settingsService.getSettings(category),
  });

  const updateMutation = useMutation({
    mutationFn: (newData: SystemSettings[K]) => settingsService.updateSettings(category, newData),
    onSuccess: (res, variables) => {
      // Optimistic update of the cache
      queryClient.setQueryData(['settings', category], { success: true, data: variables });
      toast.success(res.message);
    },
    onError: () => {
      toast.error('Failed to update settings. Please try again.');
    },
  });

  return {
    settings: data?.data,
    isLoading,
    error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
