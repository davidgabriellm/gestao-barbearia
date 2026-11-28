import type { StatusCaixa } from '@/hooks/caixa/types'

export interface DashboardOverviewSaleItem {
  nome: string
  quantidade: number
}

export interface DashboardOverviewSale {
  id: string
  cliente: string
  itens: DashboardOverviewSaleItem[]
  valorTotal: number
  dataVenda: string
}

export interface DashboardOverviewStockItem {
  id: string
  nome: string
  estoque: number
}

export interface DashboardOverviewDay {
  data: string
  faturamento: number
}

export interface DashboardOverviewCaixa {
  status: StatusCaixa
}

export interface DashboardOverviewResponse {
  faturamentoHoje: number
  vendasHoje: number
  faturamentoMes: number
  caixaAtual: DashboardOverviewCaixa | null
  totalClientes: number
  vendasUltimosSeteDias: DashboardOverviewDay[]
  estoqueBaixo: DashboardOverviewStockItem[]
  vendasRecentes: DashboardOverviewSale[]
}
