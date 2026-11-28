package br.com.barbeirofinanceiro.application.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record VendaRecenteDashboardResponse(
        UUID id,
        String cliente,
        List<ItemVendaRecenteDashboardResponse> itens,
        BigDecimal valorTotal,
        LocalDate dataVenda
) {
}
