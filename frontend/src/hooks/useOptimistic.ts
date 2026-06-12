import { useQueryClient } from '@tanstack/react-query';

interface UseOptimisticOptions<T> {
  queryKey: any[];
  mutateFn: (id: string) => Promise<any>;
  optimisticUpdate: (oldData: T, id: string) => T;
}

export function useOptimistic<T extends { [key: string]: any }>({
  queryKey,
  mutateFn,
  optimisticUpdate,
}: UseOptimisticOptions<T>) {
  const queryClient = useQueryClient();

  const mutate = async (id: string) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData<T>(queryKey);

    queryClient.setQueryData<T>(queryKey, (old) => {
      if (!old) return old;
      return optimisticUpdate(old, id);
    });

    try {
      return await mutateFn(id);
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  };

  return { mutate };
}
