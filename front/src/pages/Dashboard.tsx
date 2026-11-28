import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBox,
  FiCreditCard,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDashboardOverview } from '@/hooks/dashboard/useDashboardOverview'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

const formatWeekday = (value: string) =>
  toLocalDate(value)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')

const formatShortDate = (value: string) =>
  toLocalDate(value)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace('.', '')

export function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboardOverview()
  const today = new Date()
    .toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
    .replace(/(^\w)/, (char) => char.toUpperCase())

  const chartData =
    data?.vendasUltimosSeteDias.map((day) => ({
      dia: formatWeekday(day.data),
      faturamento: day.faturamento,
    })) ?? []
  const caixaAberto = data?.caixaAtual?.status === 'ABERTO'

  const faturamentoHoje = isLoading
    ? 'Carregando...'
    : error
      ? '—'
      : formatCurrency(data?.faturamentoHoje ?? 0)
  const faturamentoMes = isLoading
    ? 'Carregando...'
    : error
      ? '—'
      : formatCurrency(data?.faturamentoMes ?? 0)
  const caixaStatus = isLoading
    ? 'Carregando...'
    : error
      ? 'Indisponível'
      : caixaAberto
        ? 'Aberto'
        : 'Fechado'
  const totalClientes = isLoading
    ? 'Carregando...'
    : error
      ? '—'
      : String(data?.totalClientes ?? 0)

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Visão geral
          </h1>
          <p className="mt-2 text-sm capitalize text-muted-foreground">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-3 self-end">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate('/caixa')}
          >
            <FiCreditCard />
            Abrir caixa
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => navigate('/pedidos')}
          >
            <FiShoppingBag />
            Novo pedido
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          Não foi possível carregar os dados da visão geral. Tente novamente
          mais tarde.
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<FiDollarSign />}
          label="Faturamento hoje"
          value={faturamentoHoje}
          description={
            isLoading
              ? 'Carregando vendas...'
              : error
                ? 'Dados indisponíveis'
                : `${data?.vendasHoje ?? 0} vendas`
          }
          highlight
        />
        <MetricCard
          icon={<FiDollarSign />}
          label="Faturamento do mês"
          value={faturamentoMes}
          description="No mês atual"
        />
        <button
          type="button"
          onClick={() => navigate('/caixa')}
          className="text-left"
        >
          <MetricCard
            icon={<FiCreditCard />}
            label="Caixa"
            value={caixaStatus}
            description={
              error
                ? 'Dados indisponíveis'
                : caixaAberto
                  ? 'Pronto para vender'
                  : 'Abra para vender'
            }
          />
        </button>
        <MetricCard
          icon={<FiUsers />}
          label="Clientes"
          value={totalClientes}
          description="Clientes cadastrados"
        />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.8fr_1fr]">
        <Card className="min-w-0 rounded-2xl border-white/10 bg-[#181512]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Últimos 7 dias</CardTitle>
              <CardDescription>Faturamento diário</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-primary hover:text-primary"
              onClick={() => navigate('/relatorios')}
            >
              Ver relatórios <FiArrowRight />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-w-0">
              {isLoading ? (
                <DashboardMessage>Carregando vendas...</DashboardMessage>
              ) : error ? (
                <DashboardMessage>Não foi possível carregar o gráfico.</DashboardMessage>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <XAxis
                      dataKey="dia"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9a9187', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={58}
                      tick={{ fill: '#9a9187', fontSize: 11 }}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat('pt-BR', {
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        background: '#211d18',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 12,
                        color: '#f5f0e8',
                      }}
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        'Faturamento',
                      ]}
                    />
                    <Bar
                      dataKey="faturamento"
                      fill="#e9a844"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={56}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#181512]">
          <CardHeader>
            <CardTitle className="text-lg">Estoque baixo</CardTitle>
            <CardDescription>Produtos com até 5 unidades</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {isLoading ? (
              <DashboardMessage>Carregando estoque...</DashboardMessage>
            ) : error ? (
              <DashboardMessage>Não foi possível carregar o estoque.</DashboardMessage>
            ) : data?.estoqueBaixo.length ? (
              data.estoqueBaixo.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-red-500/10 px-3 py-3 text-sm"
                >
                  <FiAlertTriangle className="shrink-0 text-red-400" />
                  <span className="min-w-0 flex-1 truncate">{item.nome}</span>
                  <strong className="text-red-300">{item.estoque}</strong>
                </div>
              ))
            ) : (
              <DashboardMessage>
                <FiBox className="mr-2 inline" />
                Nenhum produto com estoque baixo.
              </DashboardMessage>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-white/10 bg-[#181512]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Vendas recentes</CardTitle>
            <CardDescription>Últimas vendas finalizadas</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-primary hover:text-primary"
            onClick={() => navigate('/pedidos')}
          >
            Ver todos <FiArrowRight />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DashboardMessage>Carregando vendas...</DashboardMessage>
          ) : error ? (
            <DashboardMessage>Não foi possível carregar as vendas.</DashboardMessage>
          ) : data?.vendasRecentes.length ? (
            <div className="divide-y divide-white/10">
              {data.vendasRecentes.map((venda) => (
                <div
                  key={venda.id}
                  className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <strong className="block truncate text-sm">
                      {venda.cliente}
                    </strong>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {venda.itens
                        .map((item) => `${item.quantidade}× ${item.nome}`)
                        .join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(venda.dataVenda)}
                    </span>
                    <strong className="whitespace-nowrap text-sm text-primary">
                      {formatCurrency(venda.valorTotal)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardMessage>Nenhuma venda finalizada ainda.</DashboardMessage>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function MetricCard({
  icon,
  label,
  value,
  description,
  highlight = false,
}: {
  icon: ReactNode
  label: string
  value: string
  description: string
  highlight?: boolean
}) {
  return (
    <Card
      className={`h-full rounded-2xl bg-[#181512] p-5 ${
        highlight
          ? 'border-primary/40 shadow-[0_0_24px_rgba(233,168,68,0.08)]'
          : 'border-white/10'
      }`}
    >
      <div className="mb-4 flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <strong
        className={`block truncate text-2xl font-bold ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </strong>
      <span className="mt-1 block text-xs text-muted-foreground">
        {description}
      </span>
    </Card>
  )
}

function DashboardMessage({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-h-14 items-center justify-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
