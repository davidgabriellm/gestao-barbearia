package br.com.barbeirofinanceiro.application.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardVisaoGeralResponse(
        BigDecimal faturamentoHoje,
        long vendasHoje,
        BigDecimal faturamentoMes,
        CaixaDashboardResponse caixaAtual,
        long totalClientes,
        List<FaturamentoDiarioResponse> vendasUltimosSeteDias,
        List<ProdutoEstoqueBaixoDashboardResponse> estoqueBaixo,
        List<VendaRecenteDashboardResponse> vendasRecentes
) {
}
