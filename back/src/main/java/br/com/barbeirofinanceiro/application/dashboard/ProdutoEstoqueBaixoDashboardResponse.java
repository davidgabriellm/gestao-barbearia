package br.com.barbeirofinanceiro.application.dashboard;

import java.util.UUID;

public record ProdutoEstoqueBaixoDashboardResponse(
        UUID id,
        String nome,
        Integer estoque
) {
}
