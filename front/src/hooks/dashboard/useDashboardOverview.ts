import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { DashboardOverviewResponse } from './overviewTypes'

const getDashboardOverview = async (): Promise<DashboardOverviewResponse> => {
  const { data } =
    await api.get<DashboardOverviewResponse>('/dashboard/visao-geral')
  return data
}

export const useDashboardOverview = () =>
  useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
    staleTime: 30_000,
  })
