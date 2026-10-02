// ========================================================
// MONEY CONTROL - JAVASCRIPT DO FRONTEND
// Lógica de Abas, CRUD de Transações e Classes, Gráficos Chart.js
// Segurança: Sanitização no DOM (Anti-XSS), Validações, Sem Segredos no Front
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
    // Estado Global da Aplicação
    const state = {
        classes: [],
        transacoes: [],
        analise: null,
        filtroDashboardMes: "",
        filtrosTransacoes: {
            busca: "",
            tipo: "",
            classe_id: "",
            mes: ""
        },
        idTransacaoExclusao: null,
        transacaoExclusaoParcelamentoId: null,
        idClasseExclusao: null,
        graficoPizza: null,
        graficoColuna: null
    };

    // ========================================================
    // SELETORES DO DOM
    // ========================================================
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".painel-aba");
    const statusBancoBadge = document.getElementById("statusBancoBadge");

    // Badges Contadores
    const contadorTransacoesBadge = document.getElementById("contadorTransacoesBadge");
    const contadorClassesBadge = document.getElementById("contadorClassesBadge");
    const totalClassesCount = document.getElementById("totalClassesCount");

    // Elementos do Dashboard
    const filtroMesDashboard = document.getElementById("filtroMesDashboard");
    const btnMesAtual = document.getElementById("btnMesAtual");
    const btnRecarregarDashboard = document.getElementById("btnRecarregarDashboard");
    const kpiSaldoValor = document.getElementById("kpiSaldoValor");
    const kpiSaldoIndicador = document.getElementById("kpiSaldoIndicador");
    const kpiGanhosValor = document.getElementById("kpiGanhosValor");
    const kpiGastosValor = document.getElementById("kpiGastosValor");
    const kpiTaxaValor = document.getElementById("kpiTaxaValor");
    const barraTaxaFill = document.getElementById("barraTaxaFill");
    const listaLegendaClasses = document.getElementById("listaLegendaClasses");
    const resumoComparativoColunas = document.getElementById("resumoComparativoColunas");
    const tabelaTransacoesRecentesBody = document.getElementById("tabelaTransacoesRecentesBody");
    const btnVerTodasTransacoes = document.getElementById("btnVerTodasTransacoes");
    const vazioGraficoPizza = document.getElementById("vazioGraficoPizza");
    const vazioGraficoColuna = document.getElementById("vazioGraficoColuna");

    // Elementos da Aba de Transações
    const tabelaTransacoesCompletaBody = document.getElementById("tabelaTransacoesCompletaBody");
    const vazioTransacoes = document.getElementById("vazioTransacoes");
    const filtroBuscaTexto = document.getElementById("filtroBuscaTexto");
    const filtroTipoTransacao = document.getElementById("filtroTipoTransacao");
    const filtroClasseTransacao = document.getElementById("filtroClasseTransacao");
    const filtroMesTransacao = document.getElementById("filtroMesTransacao");
    const btnLimparFiltrosTransacao = document.getElementById("btnLimparFiltrosTransacao");
    const btnNovaTransacaoAba = document.getElementById("btnNovaTransacaoAba");
    const btnAbrirModalTransacao = document.getElementById("btnAbrirModalTransacao");

    // Elementos da Aba de Classes
    const formClasse = document.getElementById("formClasse");
    const classeEditandoId = document.getElementById("classeEditandoId");
    const classeNomeInput = document.getElementById("classeNomeInput");
    const classeTipoPadraoSelect = document.getElementById("classeTipoPadraoSelect");
    const classeCorInput = document.getElementById("classeCorInput");
    const botoesCor = document.querySelectorAll(".btn-cor");
    const btnSalvarClasse = document.getElementById("btnSalvarClasse");
    const btnCancelarEdicaoClasse = document.getElementById("btnCancelarEdicaoClasse");
    const tituloFormClasse = document.getElementById("tituloFormClasse");
    const subtituloFormClasse = document.getElementById("subtituloFormClasse");
    const gradeCardsClasses = document.getElementById("gradeCardsClasses");

    // Modal de Transação
    const modalTransacao = document.getElementById("modalTransacao");
    const btnFecharModalTransacao = document.getElementById("btnFecharModalTransacao");
    const btnCancelarModalTransacao = document.getElementById("btnCancelarModalTransacao");
    const formTransacao = document.getElementById("formTransacao");
    const modalTransacaoTitulo = document.getElementById("modalTransacaoTitulo");
    const transacaoEditandoId = document.getElementById("transacaoEditandoId");
    const transacaoTipoInput = document.getElementById("transacaoTipoInput");
    const btnToggleGasto = document.getElementById("btnToggleGasto");
    const btnToggleGanho = document.getElementById("btnToggleGanho");
    const transacaoDescricaoInput = document.getElementById("transacaoDescricaoInput");
    const transacaoValorInput = document.getElementById("transacaoValorInput");
    const transacaoDataInput = document.getElementById("transacaoDataInput");
    const transacaoClasseSelect = document.getElementById("transacaoClasseSelect");
    const transacaoObservacaoInput = document.getElementById("transacaoObservacaoInput");

    // Elementos de Parcelamento (Novo)
    const campoParcelamentoWrapper = document.getElementById("campoParcelamentoWrapper");
    const transacaoParcelasSelect = document.getElementById("transacaoParcelasSelect");
    const campoParcelasCustomWrapper = document.getElementById("campoParcelasCustomWrapper");
    const transacaoParcelasCustomInput = document.getElementById("transacaoParcelasCustomInput");
    const previewParcelamento = document.getElementById("previewParcelamento");
    const previewParcelasTexto = document.getElementById("previewParcelasTexto");
    const previewParcelasDatas = document.getElementById("previewParcelasDatas");
    const avisoEdicaoParcela = document.getElementById("avisoEdicaoParcela");
    const textoAvisoEdicaoParcela = document.getElementById("textoAvisoEdicaoParcela");

    // Modal de Exclusão
    const modalConfirmarExclusao = document.getElementById("modalConfirmarExclusao");
    const tituloConfirmarExclusao = document.getElementById("tituloConfirmarExclusao");
    const mensagemConfirmarExclusao = document.getElementById("mensagemConfirmarExclusao");
    const opcaoExcluirParcelasWrapper = document.getElementById("opcaoExcluirParcelasWrapper");
    const chkExcluirTodasParcelas = document.getElementById("chkExcluirTodasParcelas");
    const lblExcluirTodasParcelas = document.getElementById("lblExcluirTodasParcelas");
    const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
    const btnConfirmarExclusaoAcao = document.getElementById("btnConfirmarExclusaoAcao");

    // Toast Container
    const toastContainer = document.getElementById("toastContainer");

    // ========================================================
    // FUNÇÕES UTILITÁRIAS E SEGURANÇA
    // ========================================================

    // Formatação de Moeda Brasileira (R$)
    function formatarMoeda(valor) {
        const num = Number(valor) || 0;
        return num.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Formatação de Data ISO (AAAA-MM-DD) para PT-BR (DD/MM/AAAA)
    function formatarDataBR(dataIso) {
        if (!dataIso) return "";
        if (dataIso.includes("/")) return dataIso;
        const [ano, mes, dia] = dataIso.split("-");
        if (!dia) return dataIso;
        return `${dia}/${mes}/${ano}`;
    }

    // Data de hoje no formato ISO YYYY-MM-DD
    function dataHojeISO() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    // Sanitizador para prevenir XSS ao injetar texto no HTML
    function escaparHTML(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Sistema de Notificações Toast
    function exibirToast(mensagem, tipo = "sucesso") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${tipo}`;

        let iconeSVG = "";
        if (tipo === "sucesso") {
            iconeSVG = `<svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (tipo === "erro") {
            iconeSVG = `<svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else {
            iconeSVG = `<svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            ${iconeSVG}
            <span>${escaparHTML(mensagem)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px) scale(0.95)";
            setTimeout(() => toast.remove(), 250);
        }, 4000);
    }

    // ========================================================
    // CONTROLE DE NAVEGAÇÃO POR ABAS
    // ========================================================
    function alternarAba(idAbaDestino) {
        tabButtons.forEach(btn => {
            const isActive = btn.dataset.aba === idAbaDestino;
            btn.classList.toggle("active", isActive);
        });

        tabPanels.forEach(panel => {
            const isTarget = panel.id === idAbaDestino;
            panel.classList.toggle("active", isTarget);
            panel.style.display = isTarget ? "block" : "none";
        });

        // Se abriu dashboard, redimensionar gráficos para ajustar ao container
        if (idAbaDestino === "aba-dashboard") {
            if (state.graficoPizza) state.graficoPizza.resize();
            if (state.graficoColuna) state.graficoColuna.resize();
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => alternarAba(btn.dataset.aba));
    });

    if (btnVerTodasTransacoes) {
        btnVerTodasTransacoes.addEventListener("click", () => alternarAba("aba-transacoes"));
    }

    // ========================================================
    // COMUNICAÇÃO COM A API DO BACKEND
    // ========================================================

    async function apiRequest(endpoint, options = {}) {
        try {
            const res = await fetch(endpoint, {
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                },
                ...options
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const erroMsg = data.error || `Erro HTTP ${res.status}`;
                throw new Error(erroMsg);
            }

            return data;
        } catch (err) {
            console.error(`Erro na requisição ${endpoint}:`, err.message);
            throw err;
        }
    }

    // Verifica status da conexão com PostgreSQL
    async function verificarStatusBanco() {
        try {
            const data = await apiRequest("/api/status");
            if (data.banco && data.banco.conectado) {
                statusBancoBadge.innerHTML = `
                    <span class="status-dot"></span>
                    <span class="status-texto">PostgreSQL Ativo</span>
                `;
                statusBancoBadge.title = `Conectado ao banco: ${data.banco.nomeBanco} | Usuário: ${data.banco.usuario}`;
            } else {
                statusBancoBadge.innerHTML = `
                    <span class="status-dot" style="background:#fb7185; box-shadow:0 0 8px #fb7185;"></span>
                    <span class="status-texto" style="color:#fb7185;">Banco Offline</span>
                `;
            }
        } catch {
            statusBancoBadge.innerHTML = `
                <span class="status-dot" style="background:#fbbf24; box-shadow:0 0 8px #fbbf24;"></span>
                <span class="status-texto" style="color:#fbbf24;">Aguardando API</span>
            `;
        }
    }

    // ========================================================
    // CARREGAMENTO DE DADOS (CLASSES, TRANSAÇÕES, ANÁLISE)
    // ========================================================

    // 1. Carregar Classes
    async function carregarClasses() {
        try {
            const classes = await apiRequest("/api/classes");
            state.classes = classes;

            // Atualiza contadores
            if (contadorClassesBadge) contadorClassesBadge.textContent = classes.length;
            if (totalClassesCount) totalClassesCount.textContent = classes.length;

            renderizarSelectClasses();
            renderizarCardsClasses();
            renderizarFiltroClasses();
        } catch (err) {
            exibirToast(`Não foi possível carregar as classes: ${err.message}`, "erro");
        }
    }

    // Preenche select do modal de transação
    function renderizarSelectClasses() {
        if (!transacaoClasseSelect) return;
        const valorAtual = transacaoClasseSelect.value;
        transacaoClasseSelect.innerHTML = '<option value="">Selecione uma classe...</option>';

        state.classes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `${c.nome} (${c.tipo_padrao === "ambos" ? "Geral" : c.tipo_padrao === "gasto" ? "Despesa" : "Receita"})`;
            transacaoClasseSelect.appendChild(opt);
        });

        if (valorAtual) transacaoClasseSelect.value = valorAtual;
    }

    // Preenche select do filtro de transações
    function renderizarFiltroClasses() {
        if (!filtroClasseTransacao) return;
        const valorAtual = filtroClasseTransacao.value;
        filtroClasseTransacao.innerHTML = '<option value="">Todas as Classes</option>';

        state.classes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.nome;
            filtroClasseTransacao.appendChild(opt);
        });

        if (valorAtual) filtroClasseTransacao.value = valorAtual;
    }

    // Renderiza grid de cards na Aba de Classes
    function renderizarCardsClasses() {
        if (!gradeCardsClasses) return;
        gradeCardsClasses.innerHTML = "";

        if (state.classes.length === 0) {
            gradeCardsClasses.innerHTML = `
                <div class="estado-vazio" style="grid-column: 1 / -1;">
                    <p>Nenhuma classe cadastrada ainda.</p>
                </div>
            `;
            return;
        }

        state.classes.forEach(c => {
            const card = document.createElement("div");
            card.className = "card-classe-item";
            card.style.setProperty("--classe-cor", c.cor || "#10b981");

            const tipoLabel = c.tipo_padrao === "ambos" ? "Ambos" : c.tipo_padrao === "gasto" ? "Gasto" : "Ganho";

            card.innerHTML = `
                <div class="classe-item-topo">
                    <div class="classe-item-titulo">
                        <span class="classe-cor-circulo"></span>
                        <span class="classe-item-nome">${escaparHTML(c.nome)}</span>
                    </div>
                    <div class="acoes-linha">
                        <button class="btn-acao-tabela editar" title="Editar Classe" onclick="window.editarClasse(${c.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="btn-acao-tabela excluir" title="Excluir Classe" onclick="window.confirmarExclusaoClasse(${c.id}, '${escaparHTML(c.nome)}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="classe-item-dados">
                    <span>Natureza: <strong>${tipoLabel}</strong></span>
                    <span>Transações: <strong>${c.total_transacoes || 0}</strong></span>
                </div>
                <div class="classe-item-dados" style="border:none; padding:0;">
                    <span>Total Movimentado:</span>
                    <span class="classe-total-gasto">${formatarMoeda((c.total_gastos || 0) + (c.total_ganhos || 0))}</span>
                </div>
            `;
            gradeCardsClasses.appendChild(card);
        });
    }

    // 2. Carregar Transações (com filtros)
    async function carregarTransacoes() {
        try {
            const queryParams = new URLSearchParams();
            if (state.filtrosTransacoes.mes) queryParams.set("mes", state.filtrosTransacoes.mes);
            if (state.filtrosTransacoes.tipo) queryParams.set("tipo", state.filtrosTransacoes.tipo);
            if (state.filtrosTransacoes.classe_id) queryParams.set("classe_id", state.filtrosTransacoes.classe_id);
            if (state.filtrosTransacoes.busca) queryParams.set("busca", state.filtrosTransacoes.busca);

            const url = `/api/transacoes${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
            const transacoes = await apiRequest(url);
            state.transacoes = transacoes;

            if (contadorTransacoesBadge) contadorTransacoesBadge.textContent = transacoes.length;

            renderizarTabelaTransacoes();
            renderizarTransacoesRecentesDashboard();
        } catch (err) {
            exibirToast(`Erro ao carregar transações: ${err.message}`, "erro");
        }
    }

    // Renderiza a tabela principal de transações
    function renderizarTabelaTransacoes() {
        if (!tabelaTransacoesCompletaBody) return;
        tabelaTransacoesCompletaBody.innerHTML = "";

        if (state.transacoes.length === 0) {
            if (vazioTransacoes) vazioTransacoes.style.display = "flex";
            return;
        }

        if (vazioTransacoes) vazioTransacoes.style.display = "none";

        state.transacoes.forEach(t => {
            const tr = document.createElement("tr");
            const ehGanho = t.tipo === "ganho";
            const sinal = ehGanho ? "+ " : "- ";

            const badgeParcela = (t.total_parcelas && t.total_parcelas > 1)
                ? `<span class="badge-parcela-tag" title="Parcela ${t.parcela_atual} de ${t.total_parcelas}">💳 ${t.parcela_atual}/${t.total_parcelas}</span>`
                : "";

            tr.innerHTML = `
                <td class="data-col">${t.data_formatada || formatarDataBR(t.data_iso)}</td>
                <td>
                    <span class="pill-tipo ${t.tipo}">
                        ${ehGanho ? "▲ Ganho" : "▼ Gasto"}
                    </span>
                </td>
                <td>
                    <strong>${escaparHTML(t.descricao)}</strong>${badgeParcela}
                </td>
                <td>
                    <span class="pill-classe" style="border-left: 3px solid ${t.classe_cor || "#10b981"};">
                        ${escaparHTML(t.classe_nome)}
                    </span>
                </td>
                <td class="valor-transacao ${t.tipo}">
                    ${sinal}${formatarMoeda(t.valor)}
                </td>
                <td style="color: var(--text-muted); font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escaparHTML(t.observacao || "—")}
                </td>
                <td class="text-right">
                    <div class="acoes-linha">
                        <button class="btn-acao-tabela editar" title="Editar Transação" onclick="window.editarTransacao(${t.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="btn-acao-tabela excluir" title="Excluir Transação" onclick="window.confirmarExclusaoTransacao(${t.id}, '${escaparHTML(t.descricao)}', '${t.parcelamento_id || ""}', ${t.total_parcelas || 0})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tabelaTransacoesCompletaBody.appendChild(tr);
        });
    }

    // Renderiza a tabela resumida na aba de Dashboard
    function renderizarTransacoesRecentesDashboard() {
        if (!tabelaTransacoesRecentesBody) return;
        tabelaTransacoesRecentesBody.innerHTML = "";

        const recentes = state.transacoes.slice(0, 5);

        if (recentes.length === 0) {
            tabelaTransacoesRecentesBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">
                        Nenhuma movimentação registrada no momento.
                    </td>
                </tr>
            `;
            return;
        }

        recentes.forEach(t => {
            const tr = document.createElement("tr");
            const ehGanho = t.tipo === "ganho";
            const sinal = ehGanho ? "+ " : "- ";

            const badgeParcela = (t.total_parcelas && t.total_parcelas > 1)
                ? `<span class="badge-parcela-tag" title="Parcela ${t.parcela_atual} de ${t.total_parcelas}">💳 ${t.parcela_atual}/${t.total_parcelas}</span>`
                : "";

            tr.innerHTML = `
                <td class="data-col">${t.data_formatada || formatarDataBR(t.data_iso)}</td>
                <td>
                    <span class="pill-tipo ${t.tipo}">
                        ${ehGanho ? "▲ Ganho" : "▼ Gasto"}
                    </span>
                </td>
                <td><strong>${escaparHTML(t.descricao)}</strong>${badgeParcela}</td>
                <td>
                    <span class="pill-classe" style="border-left: 3px solid ${t.classe_cor || "#10b981"};">
                        ${escaparHTML(t.classe_nome)}
                    </span>
                </td>
                <td class="valor-transacao ${t.tipo}">${sinal}${formatarMoeda(t.valor)}</td>
                <td class="text-right">
                    <div class="acoes-linha">
                        <button class="btn-acao-tabela editar" title="Editar" onclick="window.editarTransacao(${t.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="btn-acao-tabela excluir" title="Excluir" onclick="window.confirmarExclusaoTransacao(${t.id}, '${escaparHTML(t.descricao)}', '${t.parcelamento_id || ""}', ${t.total_parcelas || 0})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tabelaTransacoesRecentesBody.appendChild(tr);
        });
    }

    // 3. Carregar Análise Financeira e Atualizar Gráficos
    async function carregarAnalise() {
        try {
            const query = state.filtroDashboardMes ? `?mes=${state.filtroDashboardMes}` : "";
            const analise = await apiRequest(`/api/analise${query}`);
            state.analise = analise;

            atualizarDropdownMeses(analise.meses_disponiveis);
            atualizarKpis(analise.kpis);
            renderizarGraficoPizza(analise.gastos_por_classe);
            renderizarGraficoColuna(analise.comparativo_mensal);
        } catch (err) {
            console.error("Erro ao carregar análise financeira:", err);
            exibirToast(`Erro ao carregar gráficos: ${err.message}`, "erro");
        }
    }

    // Atualiza os dropdowns de seleção de mês
    function atualizarDropdownMeses(meses) {
        if (!meses) return;

        const mesesNomes = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        function preencherSelect(selectElem, opcaoPadraoTexto) {
            if (!selectElem) return;
            const valorAtual = selectElem.value;
            selectElem.innerHTML = `<option value="">${opcaoPadraoTexto}</option>`;

            meses.forEach(anoMes => {
                const [ano, mes] = anoMes.split("-");
                const nomeMes = mesesNomes[parseInt(mes, 10) - 1] || mes;
                const opt = document.createElement("option");
                opt.value = anoMes;
                opt.textContent = `${nomeMes} de ${ano}`;
                selectElem.appendChild(opt);
            });

            if (valorAtual) selectElem.value = valorAtual;
        }

        preencherSelect(filtroMesDashboard, "Todo o Período");
        preencherSelect(filtroMesTransacao, "Todo o Histórico");
    }

    // Atualiza os cards de KPIs do Dashboard
    function atualizarKpis(kpis) {
        if (!kpis) return;

        kpiSaldoValor.textContent = formatarMoeda(kpis.saldo_liquido);
        kpiGanhosValor.textContent = formatarMoeda(kpis.total_ganhos);
        kpiGastosValor.textContent = formatarMoeda(kpis.total_gastos);
        kpiTaxaValor.textContent = `${kpis.taxa_poupanca}%`;

        // Balanço positivo ou negativo
        if (kpis.saldo_liquido >= 0) {
            kpiSaldoIndicador.textContent = "● Saldo Positivo";
            kpiSaldoIndicador.className = "indicador-balanco";
            kpiSaldoValor.style.color = "#ffffff";
        } else {
            kpiSaldoIndicador.textContent = "▼ Saldo Negativo (Déficit)";
            kpiSaldoIndicador.className = "indicador-balanco negativo";
            kpiSaldoValor.style.color = "var(--rose-400)";
        }

        // Barra de progresso da poupança
        const percBarra = Math.max(0, Math.min(100, kpis.taxa_poupanca));
        barraTaxaFill.style.width = `${percBarra}%`;
    }

    // ========================================================
    // GRÁFICO 1: PIZZA (GASTOS POR CLASSE)
    // ========================================================
    function renderizarGraficoPizza(gastosClasses) {
        const canvas = document.getElementById("graficoPizzaClasses");
        if (!canvas) return;

        if (!gastosClasses || gastosClasses.length === 0) {
            if (vazioGraficoPizza) vazioGraficoPizza.style.display = "flex";
            canvas.style.display = "none";
            if (listaLegendaClasses) listaLegendaClasses.innerHTML = "";
            if (state.graficoPizza) {
                state.graficoPizza.destroy();
                state.graficoPizza = null;
            }
            return;
        }

        if (vazioGraficoPizza) vazioGraficoPizza.style.display = "none";
        canvas.style.display = "block";

        const labels = gastosClasses.map(g => g.classe_nome);
        const dataValores = gastosClasses.map(g => g.total_gasto);
        const cores = gastosClasses.map(g => g.classe_cor);

        // Preenche lista de legenda interativa ao lado
        if (listaLegendaClasses) {
            listaLegendaClasses.innerHTML = "";
            gastosClasses.forEach(g => {
                const item = document.createElement("div");
                item.className = "legenda-item";
                item.innerHTML = `
                    <div class="legenda-item-info">
                        <span class="ponto-cor" style="background: ${g.classe_cor}; box-shadow: 0 0 6px ${g.classe_cor};"></span>
                        <span class="legenda-nome" title="${escaparHTML(g.classe_nome)}">${escaparHTML(g.classe_nome)}</span>
                    </div>
                    <div class="legenda-item-valores">
                        <span class="legenda-valor">${formatarMoeda(g.total_gasto)}</span>
                        <span class="legenda-perc">(${g.percentual}%)</span>
                    </div>
                `;
                listaLegendaClasses.appendChild(item);
            });
        }

        // Destrói instância anterior para evitar sobreposição
        if (state.graficoPizza) {
            state.graficoPizza.destroy();
        }

        // Criação com Chart.js (Donut refinado)
        state.graficoPizza = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: dataValores,
                    backgroundColor: cores,
                    borderColor: "#0e1713",
                    borderWidth: 3,
                    hoverOffset: 8,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        display: false // Usamos a legenda HTML customizada muito mais elegante
                    },
                    tooltip: {
                        backgroundColor: "rgba(14, 23, 19, 0.95)",
                        borderColor: "#223c2d",
                        borderWidth: 1,
                        titleColor: "#ffffff",
                        bodyColor: "#a7f3d0",
                        padding: 12,
                        cornerRadius: 8,
                        boxPadding: 6,
                        callbacks: {
                            label: function(context) {
                                const valor = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const perc = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                                return ` Gasto: ${formatarMoeda(valor)} (${perc}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 800
                }
            }
        });
    }

    // ========================================================
    // GRÁFICO 2: COLUNA (COMPARAÇÃO GASTOS VS GANHOS)
    // ========================================================
    function renderizarGraficoColuna(comparativoMensal) {
        const canvas = document.getElementById("graficoColunaGanhosGastos");
        if (!canvas) return;

        if (!comparativoMensal || comparativoMensal.length === 0) {
            if (vazioGraficoColuna) vazioGraficoColuna.style.display = "flex";
            canvas.style.display = "none";
            if (resumoComparativoColunas) resumoComparativoColunas.innerHTML = "";
            if (state.graficoColuna) {
                state.graficoColuna.destroy();
                state.graficoColuna = null;
            }
            return;
        }

        if (vazioGraficoColuna) vazioGraficoColuna.style.display = "none";
        canvas.style.display = "block";

        const rotulos = comparativoMensal.map(m => m.rotulo);
        const dadosGanhos = comparativoMensal.map(m => m.ganhos);
        const dadosGastos = comparativoMensal.map(m => m.gastos);

        // Atualiza o resumo numérico abaixo do gráfico
        if (resumoComparativoColunas) {
            const somaGanhos = dadosGanhos.reduce((a, b) => a + b, 0);
            const somaGastos = dadosGastos.reduce((a, b) => a + b, 0);
            const balanco = somaGanhos - somaGastos;

            resumoComparativoColunas.innerHTML = `
                <div class="resumo-bloco">
                    <span class="resumo-bloco-label">Total Entradas</span>
                    <strong class="resumo-bloco-valor verde">${formatarMoeda(somaGanhos)}</strong>
                </div>
                <div class="resumo-bloco">
                    <span class="resumo-bloco-label">Total Saídas</span>
                    <strong class="resumo-bloco-valor vermelho">${formatarMoeda(somaGastos)}</strong>
                </div>
                <div class="resumo-bloco">
                    <span class="resumo-bloco-label">Balanço Total</span>
                    <strong class="resumo-bloco-valor ${balanco >= 0 ? "verde" : "vermelho"}">${formatarMoeda(balanco)}</strong>
                </div>
            `;
        }

        if (state.graficoColuna) {
            state.graficoColuna.destroy();
        }

        state.graficoColuna = new Chart(canvas, {
            type: "bar",
            data: {
                labels: rotulos,
                datasets: [
                    {
                        label: "Ganhos (Receitas)",
                        data: dadosGanhos,
                        backgroundColor: "#10b981",
                        borderColor: "#34d399",
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.7,
                        categoryPercentage: 0.6
                    },
                    {
                        label: "Gastos (Despesas)",
                        data: dadosGastos,
                        backgroundColor: "#f43f5e",
                        borderColor: "#fb7185",
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.7,
                        categoryPercentage: 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            color: "rgba(25, 45, 33, 0.4)",
                            drawBorder: false
                        },
                        ticks: {
                            color: "#94a3b8",
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
                        }
                    },
                    y: {
                        grid: {
                            color: "rgba(25, 45, 33, 0.4)",
                            drawBorder: false
                        },
                        ticks: {
                            color: "#94a3b8",
                            font: { family: "'JetBrains Mono', monospace", size: 10 },
                            callback: function(value) {
                                return "R$ " + value.toLocaleString("pt-BR");
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: "#f8fafc",
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: "600" },
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: "rgba(14, 23, 19, 0.95)",
                        borderColor: "#223c2d",
                        borderWidth: 1,
                        titleColor: "#ffffff",
                        bodyColor: "#f8fafc",
                        padding: 12,
                        cornerRadius: 8,
                        boxPadding: 6,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${formatarMoeda(context.raw)}`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 800,
                    easing: "easeOutQuart"
                }
            }
        });
    }

    // ========================================================
    // MODAL DE TRANSAÇÃO (NOVO / EDITAR GASTO OU GANHO)
    // ========================================================

    // ========================================================
    // LÓGICA DE PARCELAMENTO NO MODAL (CÁLCULO E PREVIEW)
    // ========================================================

    function calcularDataParcelaJS(dataBaseISO, indiceParcela) {
        const base = dataBaseISO || dataHojeISO();
        const [anoStr, mesStr] = base.split("-");
        const ano = parseInt(anoStr, 10);
        const mes = parseInt(mesStr, 10); // 1 a 12
        const totalMeses = (ano * 12 + (mes - 1)) + indiceParcela;
        const novoAno = Math.floor(totalMeses / 12);
        const novoMes = (totalMeses % 12) + 1;
        const mesFormatado = String(novoMes).padStart(2, "0");
        return `01/${mesFormatado}/${novoAno}`;
    }

    function atualizarPreviewParcelamento() {
        if (!previewParcelamento || !campoParcelamentoWrapper) return;

        const tipo = transacaoTipoInput.value;
        const isEditando = Boolean(transacaoEditandoId.value);

        if (tipo !== "gasto" || isEditando) {
            previewParcelamento.style.display = "none";
            return;
        }

        const valor = parseFloat(transacaoValorInput.value) || 0;
        const dataCompra = transacaoDataInput.value || dataHojeISO();
        const valorOpcao = transacaoParcelasSelect.value;

        let numParcelas = 1;
        let ehProximoMes = false;

        if (valorOpcao === "1_prox_mes") {
            numParcelas = 1;
            ehProximoMes = true;
        } else if (valorOpcao === "custom") {
            numParcelas = parseInt(transacaoParcelasCustomInput.value, 10) || 1;
            ehProximoMes = false;
        } else {
            numParcelas = parseInt(valorOpcao, 10) || 1;
            ehProximoMes = false;
        }

        const badgeParcelamentoInfo = document.getElementById("badgeParcelamentoInfo");
        if (badgeParcelamentoInfo) {
            if (ehProximoMes) {
                badgeParcelamentoInfo.textContent = "1º dia do mês seguinte";
            } else if (numParcelas > 1) {
                badgeParcelamentoInfo.textContent = "1ª na compra • Próximas dia 1º";
            } else {
                badgeParcelamentoInfo.textContent = "1ª na data da compra";
            }
        }

        if (numParcelas <= 1 && !ehProximoMes) {
            previewParcelamento.style.display = "none";
            return;
        }

        previewParcelamento.style.display = "block";

        if (numParcelas === 1 && ehProximoMes) {
            const dataPrimeira = calcularDataParcelaJS(dataCompra, 1);
            previewParcelasTexto.innerHTML = `1 parcela de <strong>${formatarMoeda(valor)}</strong>`;
            previewParcelasDatas.innerHTML = `Vencimento no 1º dia do próximo mês: <strong>${dataPrimeira}</strong>`;
        } else {
            const dataPrimeira = formatarDataBR(dataCompra);
            const dataUltima = numParcelas > 1 ? calcularDataParcelaJS(dataCompra, numParcelas - 1) : dataPrimeira;
            const valorParcela = valor > 0 ? (valor / numParcelas) : 0;
            previewParcelasTexto.innerHTML = `${numParcelas} parcelas de <strong>${formatarMoeda(valorParcela)}</strong>`;
            previewParcelasDatas.innerHTML = `1ª parcela em <strong>${dataPrimeira}</strong> • Última parcela em <strong>${dataUltima}</strong>`;
        }
    }

    // Ouvintes para atualização em tempo real do preview
    if (transacaoValorInput) {
        transacaoValorInput.addEventListener("input", atualizarPreviewParcelamento);
    }
    if (transacaoDataInput) {
        transacaoDataInput.addEventListener("change", atualizarPreviewParcelamento);
    }
    if (transacaoParcelasSelect) {
        transacaoParcelasSelect.addEventListener("change", (e) => {
            if (e.target.value === "custom") {
                if (campoParcelasCustomWrapper) campoParcelasCustomWrapper.style.display = "block";
                if (transacaoParcelasCustomInput) transacaoParcelasCustomInput.focus();
            } else {
                if (campoParcelasCustomWrapper) campoParcelasCustomWrapper.style.display = "none";
            }
            atualizarPreviewParcelamento();
        });
    }
    if (transacaoParcelasCustomInput) {
        transacaoParcelasCustomInput.addEventListener("input", atualizarPreviewParcelamento);
    }

    function abrirModalTransacao(dados = null) {
        if (!modalTransacao) return;

        if (dados) {
            // Modo Edição
            modalTransacaoTitulo.textContent = "Editar Transação";
            transacaoEditandoId.value = dados.id;
            transacaoDescricaoInput.value = dados.descricao;
            transacaoValorInput.value = dados.valor;
            transacaoDataInput.value = dados.data_iso || dataHojeISO();
            transacaoClasseSelect.value = dados.classe_id;
            transacaoObservacaoInput.value = dados.observacao || "";
            definirTipoTransacao(dados.tipo);

            // Esconder seletor de parcelas em edição
            if (campoParcelamentoWrapper) campoParcelamentoWrapper.style.display = "none";
            if (previewParcelamento) previewParcelamento.style.display = "none";

            // Se for parcela de um parcelamento, exibe aviso informativo
            if (dados.total_parcelas && dados.total_parcelas > 1) {
                if (avisoEdicaoParcela) {
                    avisoEdicaoParcela.style.display = "flex";
                    if (textoAvisoEdicaoParcela) {
                        textoAvisoEdicaoParcela.textContent = `Esta movimentação é a parcela ${dados.parcela_atual} de ${dados.total_parcelas} do gasto parcelado.`;
                    }
                }
            } else {
                if (avisoEdicaoParcela) avisoEdicaoParcela.style.display = "none";
            }
        } else {
            // Modo Criação
            modalTransacaoTitulo.textContent = "Novo Lançamento";
            transacaoEditandoId.value = "";
            formTransacao.reset();
            transacaoDataInput.value = dataHojeISO();
            if (avisoEdicaoParcela) avisoEdicaoParcela.style.display = "none";
            if (transacaoParcelasSelect) transacaoParcelasSelect.value = "1";
            if (campoParcelasCustomWrapper) campoParcelasCustomWrapper.style.display = "none";
            if (transacaoParcelasCustomInput) transacaoParcelasCustomInput.value = "";
            definirTipoTransacao("gasto");
            atualizarPreviewParcelamento();
        }

        modalTransacao.classList.add("active");
        modalTransacao.setAttribute("aria-hidden", "false");
        setTimeout(() => transacaoDescricaoInput.focus(), 150);
    }

    function fecharModalTransacao() {
        if (!modalTransacao) return;
        modalTransacao.classList.remove("active");
        modalTransacao.setAttribute("aria-hidden", "true");
        formTransacao.reset();
        transacaoEditandoId.value = "";
        if (avisoEdicaoParcela) avisoEdicaoParcela.style.display = "none";
        if (campoParcelasCustomWrapper) campoParcelasCustomWrapper.style.display = "none";
        if (previewParcelamento) previewParcelamento.style.display = "none";
    }

    function definirTipoTransacao(tipo) {
        transacaoTipoInput.value = tipo;
        btnToggleGasto.classList.toggle("active", tipo === "gasto");
        btnToggleGanho.classList.toggle("active", tipo === "ganho");

        const isEditando = Boolean(transacaoEditandoId.value);
        if (campoParcelamentoWrapper) {
            if (tipo === "gasto" && !isEditando) {
                campoParcelamentoWrapper.style.display = "block";
                atualizarPreviewParcelamento();
            } else {
                campoParcelamentoWrapper.style.display = "none";
                if (previewParcelamento) previewParcelamento.style.display = "none";
            }
        }
    }

    btnToggleGasto.addEventListener("click", () => definirTipoTransacao("gasto"));
    btnToggleGanho.addEventListener("click", () => definirTipoTransacao("ganho"));

    if (btnAbrirModalTransacao) {
        btnAbrirModalTransacao.addEventListener("click", () => abrirModalTransacao());
    }
    if (btnNovaTransacaoAba) {
        btnNovaTransacaoAba.addEventListener("click", () => abrirModalTransacao());
    }
    if (btnFecharModalTransacao) {
        btnFecharModalTransacao.addEventListener("click", fecharModalTransacao);
    }
    if (btnCancelarModalTransacao) {
        btnCancelarModalTransacao.addEventListener("click", fecharModalTransacao);
    }

    modalTransacao.addEventListener("click", (e) => {
        if (e.target === modalTransacao) fecharModalTransacao();
    });

    // Submissão do Formulário de Transação (POST / PUT)
    formTransacao.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = transacaoEditandoId.value;
        const descricao = transacaoDescricaoInput.value.trim();
        const tipo = transacaoTipoInput.value;
        const valor = parseFloat(transacaoValorInput.value);
        const data_transacao = transacaoDataInput.value;
        const classe_id = parseInt(transacaoClasseSelect.value, 10);
        const observacao = transacaoObservacaoInput.value.trim();

        // Validação Frontend preventiva (Seção 71)
        if (!descricao) {
            exibirToast("Informe a descrição da transação.", "erro");
            transacaoDescricaoInput.focus();
            return;
        }
        if (isNaN(valor) || valor <= 0) {
            exibirToast("Informe um valor maior que zero.", "erro");
            transacaoValorInput.focus();
            return;
        }
        if (!data_transacao) {
            exibirToast("Selecione a data da transação.", "erro");
            transacaoDataInput.focus();
            return;
        }
        if (isNaN(classe_id) || classe_id <= 0) {
            exibirToast("Selecione uma classe para o lançamento.", "erro");
            transacaoClasseSelect.focus();
            return;
        }

        const payload = {
            descricao,
            tipo,
            valor,
            data_transacao,
            classe_id,
            observacao
        };

        // Enviar parcelamento apenas ao criar gasto novo
        if (!id && tipo === "gasto" && transacaoParcelasSelect) {
            const opcaoParcelas = transacaoParcelasSelect.value;
            if (opcaoParcelas === "custom") {
                const qtdCustom = parseInt(transacaoParcelasCustomInput.value, 10);
                payload.parcelas = (!isNaN(qtdCustom) && qtdCustom >= 2) ? qtdCustom : 1;
            } else {
                payload.parcelas = opcaoParcelas;
            }
        }

        const btnSalvar = document.getElementById("btnSalvarTransacao");
        btnSalvar.disabled = true;
        btnSalvar.textContent = "Salvando...";

        try {
            if (id) {
                // Atualizar (PUT)
                const res = await apiRequest(`/api/transacoes/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
                exibirToast(res.message || "Transação atualizada com sucesso!", "sucesso");
            } else {
                // Criar (POST)
                const res = await apiRequest("/api/transacoes", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                exibirToast(res.message || "Transação registrada com sucesso!", "sucesso");
            }

            fecharModalTransacao();
            await carregarTransacoes();
            await carregarAnalise();
            await carregarClasses();
        } catch (err) {
            exibirToast(err.message, "erro");
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = "Salvar Lançamento";
        }
    });

    // Função global para edição de transação a partir dos botões da tabela
    window.editarTransacao = async function(id) {
        try {
            const transacao = await apiRequest(`/api/transacoes/${id}`);
            abrirModalTransacao(transacao);
        } catch (err) {
            exibirToast(`Erro ao carregar transação: ${err.message}`, "erro");
        }
    };

    // Modal de Confirmação de Exclusão de Transação
    window.confirmarExclusaoTransacao = function(id, descricao, parcelamentoId = null, totalParcelas = null) {
        state.idTransacaoExclusao = id;
        state.transacaoExclusaoParcelamentoId = parcelamentoId || null;
        state.idClasseExclusao = null;
        tituloConfirmarExclusao.textContent = "Excluir Transação";

        if (parcelamentoId && totalParcelas && totalParcelas > 1) {
            mensagemConfirmarExclusao.textContent = `Esta movimentação faz parte de um gasto parcelado em ${totalParcelas}x ("${descricao}").`;
            if (opcaoExcluirParcelasWrapper) {
                opcaoExcluirParcelasWrapper.style.display = "block";
                if (chkExcluirTodasParcelas) chkExcluirTodasParcelas.checked = true;
                if (lblExcluirTodasParcelas) lblExcluirTodasParcelas.textContent = `Excluir todas as ${totalParcelas} parcelas deste parcelamento`;
            }
        } else {
            mensagemConfirmarExclusao.textContent = `Tem certeza que deseja excluir "${descricao}"? Esta operação é definitiva.`;
            if (opcaoExcluirParcelasWrapper) opcaoExcluirParcelasWrapper.style.display = "none";
        }

        modalConfirmarExclusao.classList.add("active");
    };

    // ========================================================
    // GESTÃO DE CLASSES (FORMULÁRIO, EDIÇÃO, EXCLUSÃO)
    // ========================================================

    // Seletor de Cores
    botoesCor.forEach(btn => {
        btn.addEventListener("click", () => {
            botoesCor.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            classeCorInput.value = btn.dataset.cor;
        });
    });

    // Submissão do Formulário de Classes (POST / PUT)
    formClasse.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = classeEditandoId.value;
        const nome = classeNomeInput.value.trim();
        const tipo_padrao = classeTipoPadraoSelect.value;
        const cor = classeCorInput.value;

        if (!nome) {
            exibirToast("Informe o nome da classe.", "erro");
            classeNomeInput.focus();
            return;
        }

        const payload = { nome, tipo_padrao, cor };

        btnSalvarClasse.disabled = true;
        btnSalvarClasse.textContent = "Salvando...";

        try {
            if (id) {
                // Atualizar Classe (PUT)
                const res = await apiRequest(`/api/classes/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
                exibirToast(res.message || "Classe atualizada com sucesso!", "sucesso");
            } else {
                // Criar Classe (POST)
                const res = await apiRequest("/api/classes", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                exibirToast(res.message || "Classe criada com sucesso!", "sucesso");
            }

            cancelarEdicaoClasse();
            await carregarClasses();
            await carregarAnalise();
        } catch (err) {
            exibirToast(err.message, "erro");
        } finally {
            btnSalvarClasse.disabled = false;
            btnSalvarClasse.textContent = id ? "Atualizar Classe" : "Cadastrar Classe";
        }
    });

    function cancelarEdicaoClasse() {
        classeEditandoId.value = "";
        formClasse.reset();
        classeCorInput.value = "#10b981";
        botoesCor.forEach(b => b.classList.toggle("active", b.dataset.cor === "#10b981"));
        tituloFormClasse.textContent = "Cadastrar Nova Classe";
        subtituloFormClasse.textContent = "Crie categorias para organizar seus gastos e receitas";
        btnSalvarClasse.textContent = "Cadastrar Classe";
        btnCancelarEdicaoClasse.style.display = "none";
    }

    if (btnCancelarEdicaoClasse) {
        btnCancelarEdicaoClasse.addEventListener("click", cancelarEdicaoClasse);
    }

    // Edição de classe
    window.editarClasse = function(id) {
        const classe = state.classes.find(c => c.id === id);
        if (!classe) return;

        alternarAba("aba-classes");
        classeEditandoId.value = classe.id;
        classeNomeInput.value = classe.nome;
        classeTipoPadraoSelect.value = classe.tipo_padrao || "ambos";
        classeCorInput.value = classe.cor || "#10b981";

        botoesCor.forEach(b => {
            b.classList.toggle("active", b.dataset.cor.toLowerCase() === (classe.cor || "#10b981").toLowerCase());
        });

        tituloFormClasse.textContent = `Editar Classe: ${classe.nome}`;
        subtituloFormClasse.textContent = "Modifique os dados da categoria e salve";
        btnSalvarClasse.textContent = "Atualizar Classe";
        btnCancelarEdicaoClasse.style.display = "inline-flex";

        classeNomeInput.focus();
    };

    // Confirmação de Exclusão de Classe
    window.confirmarExclusaoClasse = function(id, nome) {
        state.idClasseExclusao = id;
        state.idTransacaoExclusao = null;
        tituloConfirmarExclusao.textContent = "Excluir Classe";
        mensagemConfirmarExclusao.textContent = `Deseja realmente excluir a classe "${nome}"? A classe não poderá ser removida se houver transações atreladas a ela.`;
        modalConfirmarExclusao.classList.add("active");
    };

    // ========================================================
    // EXECUÇÃO DA EXCLUSÃO NO MODAL
    // ========================================================
    btnCancelarExclusao.addEventListener("click", () => {
        modalConfirmarExclusao.classList.remove("active");
        state.idTransacaoExclusao = null;
        state.idClasseExclusao = null;
    });

    btnConfirmarExclusaoAcao.addEventListener("click", async () => {
        const idTransacao = state.idTransacaoExclusao;
        const idClasse = state.idClasseExclusao;

        modalConfirmarExclusao.classList.remove("active");

        if (idTransacao) {
            try {
                const excluirTodas = Boolean(
                    state.transacaoExclusaoParcelamentoId &&
                    chkExcluirTodasParcelas &&
                    chkExcluirTodasParcelas.checked
                );
                const query = excluirTodas ? "?excluir_todas=true" : "";
                const res = await apiRequest(`/api/transacoes/${idTransacao}${query}`, { method: "DELETE" });
                exibirToast(res.message || "Transação removida!", "sucesso");
                await carregarTransacoes();
                await carregarAnalise();
                await carregarClasses();
            } catch (err) {
                exibirToast(err.message, "erro");
            } finally {
                state.idTransacaoExclusao = null;
                state.transacaoExclusaoParcelamentoId = null;
            }
        } else if (idClasse) {
            try {
                const res = await apiRequest(`/api/classes/${idClasse}`, { method: "DELETE" });
                exibirToast(res.message || "Classe removida!", "sucesso");
                await carregarClasses();
                await carregarAnalise();
            } catch (err) {
                exibirToast(err.message, "erro");
            } finally {
                state.idClasseExclusao = null;
            }
        }
    });

    // ========================================================
    // EVENTOS DE FILTROS DO DASHBOARD E TRANSAÇÕES
    // ========================================================

    // Filtro de mês no Dashboard
    if (filtroMesDashboard) {
        filtroMesDashboard.addEventListener("change", (e) => {
            state.filtroDashboardMes = e.target.value;
            carregarAnalise();
        });
    }

    if (btnMesAtual) {
        btnMesAtual.addEventListener("click", () => {
            const mesAtual = dataHojeISO().slice(0, 7);
            state.filtroDashboardMes = mesAtual;
            if (filtroMesDashboard) filtroMesDashboard.value = mesAtual;
            carregarAnalise();
        });
    }

    if (btnRecarregarDashboard) {
        btnRecarregarDashboard.addEventListener("click", () => {
            carregarAnalise();
            carregarTransacoes();
            carregarClasses();
            verificarStatusBanco();
            exibirToast("Painel atualizado!", "info");
        });
    }

    // Filtros da Aba de Transações
    let debounceBusca = null;
    if (filtroBuscaTexto) {
        filtroBuscaTexto.addEventListener("input", (e) => {
            clearTimeout(debounceBusca);
            debounceBusca = setTimeout(() => {
                state.filtrosTransacoes.busca = e.target.value;
                carregarTransacoes();
            }, 300);
        });
    }

    if (filtroTipoTransacao) {
        filtroTipoTransacao.addEventListener("change", (e) => {
            state.filtrosTransacoes.tipo = e.target.value;
            carregarTransacoes();
        });
    }

    if (filtroClasseTransacao) {
        filtroClasseTransacao.addEventListener("change", (e) => {
            state.filtrosTransacoes.classe_id = e.target.value;
            carregarTransacoes();
        });
    }

    if (filtroMesTransacao) {
        filtroMesTransacao.addEventListener("change", (e) => {
            state.filtrosTransacoes.mes = e.target.value;
            carregarTransacoes();
        });
    }

    if (btnLimparFiltrosTransacao) {
        btnLimparFiltrosTransacao.addEventListener("click", () => {
            filtroBuscaTexto.value = "";
            filtroTipoTransacao.value = "";
            filtroClasseTransacao.value = "";
            filtroMesTransacao.value = "";
            state.filtrosTransacoes = { busca: "", tipo: "", classe_id: "", mes: "" };
            carregarTransacoes();
        });
    }

    // Atalho global para abrir modal com tipo pré-selecionado
    window.abrirModalTransacaoComTipo = function(tipo) {
        abrirModalTransacao();
        definirTipoTransacao(tipo);
    };

    // ========================================================
    // INICIALIZAÇÃO DA APLICAÇÃO
    // ========================================================
    async function inicializar() {
        await verificarStatusBanco();
        await carregarClasses();
        await carregarTransacoes();
        await carregarAnalise();
    }

    inicializar();
});
