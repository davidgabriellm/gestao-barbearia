package br.com.barbeirofinanceiro.application.dashboard;

import br.com.barbeirofinanceiro.application.caixa.CaixaService;
import br.com.barbeirofinanceiro.application.relatorio.RelatorioPagamentoResponse;
import br.com.barbeirofinanceiro.application.relatorio.RelatorioResumoResponse;
import br.com.barbeirofinanceiro.application.relatorio.RelatorioService;
import br.com.barbeirofinanceiro.domain.cliente.ClienteRepository;
import br.com.barbeirofinanceiro.domain.item.Item;
import br.com.barbeirofinanceiro.domain.item.ItemRepository;
import br.com.barbeirofinanceiro.domain.item.TipoItem;
import br.com.barbeirofinanceiro.domain.venda.ItemRelatorioProjection;
import br.com.barbeirofinanceiro.domain.venda.ItemVenda;
import br.com.barbeirofinanceiro.domain.venda.ItemVendaRepository;
import br.com.barbeirofinanceiro.domain.venda.StatusVenda;
import br.com.barbeirofinanceiro.domain.venda.Venda;
import br.com.barbeirofinanceiro.domain.venda.VendaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class DashboardService {

    private static final int LIMITE_ESTOQUE_BAIXO = 5;

    private final RelatorioService relatorioService;
    private final CaixaService caixaService;
    private final ItemVendaRepository itemVendaRepository;
    private final VendaRepository vendaRepository;
    private final ClienteRepository clienteRepository;
    private final ItemRepository itemRepository;

    public DashboardService(
            RelatorioService relatorioService,
            CaixaService caixaService,
            ItemVendaRepository itemVendaRepository,
            VendaRepository vendaRepository,
            ClienteRepository clienteRepository,
            ItemRepository itemRepository
    ) {
        this.relatorioService = relatorioService;
        this.caixaService = caixaService;
        this.itemVendaRepository = itemVendaRepository;
        this.vendaRepository = vendaRepository;
        this.clienteRepository = clienteRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse buscar(LocalDate dataInicial, LocalDate dataFinal) {
        Periodo periodo = resolverPeriodo(dataInicial, dataFinal);
        RelatorioResumoResponse resumo = relatorioService.buscarResumo(periodo.dataInicial(), periodo.dataFinal());
        RelatorioPagamentoResponse pagamentos = relatorioService.buscarPagamentos(periodo.dataInicial(), periodo.dataFinal());

        return new DashboardResponse(
                new PeriodoDashboardResponse(periodo.dataInicial(), periodo.dataFinal()),
                new ResumoDashboardResponse(
                        resumo.faturamento(), resumo.despesas(), resumo.resultado(), resumo.quantidadeVendas()
                ),
                new PagamentosDashboardResponse(
                        pagamentos.dinheiro(), pagamentos.pix(), pagamentos.cartaoCredito(), pagamentos.cartaoDebito()
                ),
                buscarCaixaAtual(),
                itemVendaRepository.buscarResumoItens(
                                periodo.dataInicial(), periodo.dataFinal(), PageRequest.of(0, 5)
                        ).stream()
                        .map(this::mapearItem)
                        .toList(),
                vendaRepository.buscarFaturamentoDiario(periodo.dataInicial(), periodo.dataFinal()).stream()
                        .map(item -> new FaturamentoDiarioResponse(item.data(), item.faturamento()))
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public DashboardVisaoGeralResponse buscarVisaoGeral() {
        LocalDate hoje = LocalDate.now();
        LocalDate inicioDoMes = YearMonth.from(hoje).atDay(1);
        LocalDate inicioDosSeteDias = hoje.minusDays(6);

        var resumoHoje = vendaRepository.findResumoByDataVendaBetween(hoje, hoje);
        var resumoMes = vendaRepository.findResumoByDataVendaBetween(inicioDoMes, hoje);
        Map<LocalDate, BigDecimal> faturamentoPorDia = vendaRepository
                .buscarFaturamentoDiario(inicioDosSeteDias, hoje)
                .stream()
                .collect(Collectors.toMap(
                        item -> item.data(),
                        item -> item.faturamento()
                ));

        List<FaturamentoDiarioResponse> vendasUltimosSeteDias = IntStream.rangeClosed(0, 6)
                .mapToObj(offset -> {
                    LocalDate data = inicioDosSeteDias.plusDays(offset);
                    return new FaturamentoDiarioResponse(
                            data,
                            faturamentoPorDia.getOrDefault(data, BigDecimal.ZERO)
                    );
                })
                .toList();

        List<Venda> vendasRecentes = vendaRepository
                .findFirst5ByStatusOrderByDataVendaDescCreatedAtDesc(StatusVenda.FINALIZADA);
        Map<UUID, List<ItemVenda>> itensPorVenda = vendasRecentes.isEmpty()
                ? Map.of()
                : itemVendaRepository.findByVendaIdIn(vendasRecentes.stream().map(Venda::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(itemVenda -> itemVenda.getVenda().getId()));

        List<VendaRecenteDashboardResponse> vendasRecentesResponse = vendasRecentes.stream()
                .map(venda -> mapearVendaRecente(
                        venda,
                        itensPorVenda.getOrDefault(venda.getId(), List.of())
                ))
                .toList();

        List<ProdutoEstoqueBaixoDashboardResponse> estoqueBaixo = itemRepository
                .findByTipoAndAtivoAndEstoqueLessThanEqualOrderByEstoqueAscNomeAsc(
                        TipoItem.PRODUTO,
                        true,
                        LIMITE_ESTOQUE_BAIXO
                )
                .stream()
                .map(item -> new ProdutoEstoqueBaixoDashboardResponse(
                        item.getId(),
                        item.getNome(),
                        item.getEstoque()
                ))
                .toList();

        return new DashboardVisaoGeralResponse(
                resumoHoje.faturamento(),
                resumoHoje.quantidadeVendas(),
                resumoMes.faturamento(),
                buscarCaixaAtual(),
                clienteRepository.count(),
                vendasUltimosSeteDias,
                estoqueBaixo,
                vendasRecentesResponse
        );
    }

    private CaixaDashboardResponse buscarCaixaAtual() {
        return caixaService.atualComRespostaOpcional()
                .map(CaixaDashboardResponse::from)
                .orElse(null);
    }

    private VendaRecenteDashboardResponse mapearVendaRecente(Venda venda, List<ItemVenda> itens) {
        String nomeCliente = venda.getCliente() == null
                ? "Cliente avulso"
                : venda.getCliente().getNome();
        List<ItemVendaRecenteDashboardResponse> itensResponse = itens.stream()
                .map(itemVenda -> new ItemVendaRecenteDashboardResponse(
                        itemVenda.getItem().getNome(),
                        itemVenda.getQuantidade()
                ))
                .toList();
        return new VendaRecenteDashboardResponse(
                venda.getId(),
                nomeCliente,
                itensResponse,
                venda.getValorTotal(),
                venda.getDataVenda()
        );
    }

    private ItemMaisVendidoResponse mapearItem(ItemRelatorioProjection item) {
        return new ItemMaisVendidoResponse(
                item.itemId(), item.nome(), item.tipo(), item.quantidade(), item.faturamento()
        );
    }

    private Periodo resolverPeriodo(LocalDate dataInicial, LocalDate dataFinal) {
        if (dataInicial == null && dataFinal == null) {
            YearMonth mesAtual = YearMonth.now();
            return new Periodo(mesAtual.atDay(1), mesAtual.atEndOfMonth());
        }
        if (dataInicial == null || dataFinal == null) {
            throw new DashboardValidationException("dataInicial e dataFinal devem ser informadas juntas");
        }
        if (dataInicial.isAfter(dataFinal)) {
            throw new DashboardValidationException("A data inicial não pode ser posterior à data final");
        }
        return new Periodo(dataInicial, dataFinal);
    }

    private record Periodo(LocalDate dataInicial, LocalDate dataFinal) {
    }
}
