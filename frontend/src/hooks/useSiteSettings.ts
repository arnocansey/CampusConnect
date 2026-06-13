import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
}

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const { data } = await api.get('/settings/public');
      return data.data as SiteSettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  return data || { siteName: 'CampusConnect', logoUrl: '' };
}
