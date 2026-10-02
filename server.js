// ========================================================
// SERVIDOR - MONEY CONTROL
// Backend com Express, Persistência PostgreSQL e Hardening
// Diretrizes do Guia de Boas Práticas (Tríade CIA, Seções 10 a 74)
// ========================================================

require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORTA = Number(process.env.PORT) || 3002;

// ========================================================
// POLÍTICAS DE SEGURANÇA & MIDDLEWARES
// ========================================================

// 1. Limite no tamanho do corpo das requisições (Prevenção de DoS / Seção 13)
app.use(express.json({ limit: "20kb" }));

// 2. Cabeçalhos HTTP de Segurança Essenciais (Hardening / Seção 30)
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});

// 3. Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "public")));

// ========================================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO E FORMATAÇÃO
// ========================================================

function validarDataISO(dataStr) {
    if (!dataStr || typeof dataStr !== "string") return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dataStr)) return false;
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    return dateObj.getFullYear() === ano && (dateObj.getMonth() + 1) === mes && dateObj.getDate() === dia;
}

function sanitizarTexto(texto) {
    if (typeof texto !== "string") return "";
    return texto.trim();
}

function formatarDataBR(dataSql) {
    if (!dataSql) return "";
    if (dataSql instanceof Date) {
        return dataSql.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    }
    const str = String(dataSql);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [ano, mes, dia] = str.slice(0, 10).split("-");
        return `${dia}/${mes}/${ano}`;
    }
    return str;
}

function dataParaISO(dataSql) {
    if (!dataSql) return "";
    if (dataSql instanceof Date) {
        return dataSql.toISOString().slice(0, 10);
    }
    const str = String(dataSql);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.slice(0, 10);
    }
    return str;
}

function calcularDataParcela(dataBaseISO, indiceParcela) {
    const [anoStr, mesStr] = dataBaseISO.split("-");
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10); // 1 a 12
    const totalMeses = (ano * 12 + (mes - 1)) + indiceParcela;
    const novoAno = Math.floor(totalMeses / 12);
    const novoMes = (totalMeses % 12) + 1;
    const mesFormatado = String(novoMes).padStart(2, "0");
    return `${novoAno}-${mesFormatado}-01`;
}

function calcularValoresParcelas(valorTotal, numParcelas) {
    const totalCentavos = Math.round(Number(valorTotal) * 100);
    const centavosBase = Math.floor(totalCentavos / numParcelas);
    let sobra = totalCentavos % numParcelas;
    const parcelas = [];
    for (let i = 0; i < numParcelas; i++) {
        const centavos = centavosBase + (sobra > 0 ? 1 : 0);
        if (sobra > 0) sobra--;
        parcelas.push(Number((centavos / 100).toFixed(2)));
    }
    return parcelas;
}

// ========================================================
// ROTAS DE STATUS E SAÚDE DO SISTEMA (Seção 43)
// ========================================================

app.get("/api/status", async (req, res) => {
    try {
        const status = db.getStatus();
        res.json({
            sistema: "Money Control API",
            status: "online",
            banco: {
                conectado: status.conectado,
                host: status.host,
                porta: status.porta,
                nomeBanco: status.banco,
                usuario: status.usuario
            },
            horaServidor: new Date().toISOString()
        });
    } catch (err) {
        console.error("Erro na rota de status:", err.message);
        res.status(500).json({ error: "Erro interno ao obter status do sistema." });
    }
});

// ========================================================
// ROTAS DE CLASSES / CATEGORIAS (CRUD COMPLETO)
// ========================================================

// 1. Listar classes com estatísticas vinculadas (GET)
app.get("/api/classes", async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id, 
                c.nome, 
                c.tipo_padrao, 
                c.cor, 
                c.icone, 
                c.criado_em,
                COUNT(t.id)::int AS total_transacoes,
                COALESCE(SUM(CASE WHEN t.tipo = 'gasto' THEN t.valor ELSE 0 END), 0)::numeric AS total_gastos,
                COALESCE(SUM(CASE WHEN t.tipo = 'ganho' THEN t.valor ELSE 0 END), 0)::numeric AS total_ganhos
            FROM classes c
            LEFT JOIN transacoes t ON t.classe_id = c.id
            GROUP BY c.id
            ORDER BY c.nome ASC;
        `;
        const resultado = await db.query(query);

        const classesFormatadas = resultado.rows.map(row => ({
            id: Number(row.id),
            nome: row.nome,
            tipo_padrao: row.tipo_padrao,
            cor: row.cor || "#10b981",
            icone: row.icone || "tag",
            total_transacoes: Number(row.total_transacoes),
            total_gastos: Number(row.total_gastos),
            total_ganhos: Number(row.total_ganhos)
        }));

        res.json(classesFormatadas);
    } catch (err) {
        console.error("Erro ao listar classes:", err.message);
        res.status(500).json({ error: "Erro interno ao consultar categorias." });
    }
});

// 2. Criar nova classe (POST)
app.post("/api/classes", async (req, res) => {
    try {
        // Prevenção de Mass Assignment (Seção 14): capturar estritamente os campos esperados
        const nome = sanitizarTexto(req.body.nome);
        const tipoPadraoRaw = sanitizarTexto(req.body.tipo_padrao || "ambos").toLowerCase();
        const cor = sanitizarTexto(req.body.cor || "#10b981");
        const icone = sanitizarTexto(req.body.icone || "tag");

        // Validação de entrada rigorosa (Seções 12 e 47)
        if (!nome) {
            return res.status(400).json({ error: "O nome da classe é obrigatório." });
        }

        if (nome.length > 60) {
            return res.status(400).json({ error: "O nome da classe não pode exceder 60 caracteres." });
        }

        const tiposPermitidos = ["gasto", "ganho", "ambos"];
        const tipo_padrao = tiposPermitidos.includes(tipoPadraoRaw) ? tipoPadraoRaw : "ambos";

        // Validação de cor hexadecimal
        const corValida = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(cor) ? cor : "#10b981";

        // Query parametrizada para verificação de duplicidade (Seção 15)
        const duplicado = await db.query(
            "SELECT id FROM classes WHERE LOWER(nome) = LOWER($1);",
            [nome]
        );

        if (duplicado.rows.length > 0) {
            return res.status(400).json({ error: `A classe "${nome}" já existe.` });
        }

        const insercao = await db.query(
            `INSERT INTO classes (nome, tipo_padrao, cor, icone) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nome, tipo_padrao, cor, icone, criado_em;`,
            [nome, tipo_padrao, corValida, icone]
        );

        const novaClasse = insercao.rows[0];
        res.status(201).json({
            message: `Classe "${novaClasse.nome}" criada com sucesso!`,
            classe: {
                id: Number(novaClasse.id),
                nome: novaClasse.nome,
                tipo_padrao: novaClasse.tipo_padrao,
                cor: novaClasse.cor,
                icone: novaClasse.icone,
                total_transacoes: 0,
                total_gastos: 0,
                total_ganhos: 0
            }
        });
    } catch (err) {
        console.error("Erro ao adicionar classe:", err.message);
        res.status(500).json({ error: "Erro interno ao cadastrar nova classe." });
    }
});

// 3. Atualizar classe (PUT)
app.put("/api/classes/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Identificador de classe inválido." });
        }

        const nome = sanitizarTexto(req.body.nome);
        const tipoPadraoRaw = sanitizarTexto(req.body.tipo_padrao || "ambos").toLowerCase();
        const cor = sanitizarTexto(req.body.cor || "#10b981");
        const icone = sanitizarTexto(req.body.icone || "tag");

        if (!nome) {
            return res.status(400).json({ error: "O nome da classe é obrigatório." });
        }

        if (nome.length > 60) {
            return res.status(400).json({ error: "O nome da classe não pode exceder 60 caracteres." });
        }

        const tiposPermitidos = ["gasto", "ganho", "ambos"];
        const tipo_padrao = tiposPermitidos.includes(tipoPadraoRaw) ? tipoPadraoRaw : "ambos";
        const corValida = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(cor) ? cor : "#10b981";

        // Verifica existência da classe
        const existente = await db.query("SELECT id FROM classes WHERE id = $1;", [id]);
        if (existente.rows.length === 0) {
            return res.status(404).json({ error: "Classe não encontrada." });
        }

        // Verifica se outro registro já utiliza o mesmo nome
        const duplicado = await db.query(
            "SELECT id FROM classes WHERE LOWER(nome) = LOWER($1) AND id <> $2;",
            [nome, id]
        );
        if (duplicado.rows.length > 0) {
            return res.status(400).json({ error: `Já existe outra classe com o nome "${nome}".` });
        }

        const atualizado = await db.query(
            `UPDATE classes 
             SET nome = $1, tipo_padrao = $2, cor = $3, icone = $4 
             WHERE id = $5 
             RETURNING id, nome, tipo_padrao, cor, icone;`,
            [nome, tipo_padrao, corValida, icone, id]
        );

        res.json({
            message: `Classe "${nome}" atualizada com sucesso!`,
            classe: atualizado.rows[0]
        });
    } catch (err) {
        console.error("Erro ao atualizar classe:", err.message);
        res.status(500).json({ error: "Erro interno ao atualizar a classe." });
    }
});

// 4. Excluir classe (DELETE)
app.delete("/api/classes/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Identificador de classe inválido." });
        }

        // Integridade Referencial: checar se há transações usando esta classe
        const transacoesVinculadas = await db.query(
            "SELECT COUNT(*)::int as total FROM transacoes WHERE classe_id = $1;",
            [id]
        );
        const total = transacoesVinculadas.rows[0].total;

        if (total > 0) {
            return res.status(409).json({
                error: `Esta classe não pode ser excluída pois possui ${total} transação(ões) vinculada(s). Exclua ou altere as transações primeiro.`
            });
        }

        const resultado = await db.query(
            "DELETE FROM classes WHERE id = $1 RETURNING id, nome;",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Classe não encontrada." });
        }

        res.json({
            message: `Classe "${resultado.rows[0].nome}" removida com sucesso!`
        });
    } catch (err) {
        console.error("Erro ao excluir classe:", err.message);
        res.status(500).json({ error: "Erro interno ao excluir a classe." });
    }
});

// ========================================================
// ROTAS DE TRANSAÇÕES (GASTOS E GANHOS - CRUD COMPLETO)
// ========================================================

// 1. Listar transações com filtros avançados (GET)
app.get("/api/transacoes", async (req, res) => {
    try {
        const { mes, tipo, classe_id, busca } = req.query;

        let sql = `
            SELECT 
                t.id,
                t.descricao,
                t.tipo,
                t.valor,
                t.classe_id,
                c.nome AS classe_nome,
                c.cor AS classe_cor,
                c.icone AS classe_icone,
                t.data_transacao,
                t.observacao,
                t.parcela_atual,
                t.total_parcelas,
                t.parcelamento_id,
                t.criado_em,
                t.atualizado_em
            FROM transacoes t
            INNER JOIN classes c ON c.id = t.classe_id
            WHERE 1=1
        `;

        const params = [];
        let paramIdx = 1;

        // Filtro por mês (YYYY-MM)
        if (mes && /^\d{4}-\d{2}$/.test(mes)) {
            sql += ` AND TO_CHAR(t.data_transacao, 'YYYY-MM') = $${paramIdx}`;
            params.push(mes);
            paramIdx++;
        }

        // Filtro por tipo ('gasto' ou 'ganho')
        if (tipo && (tipo === "gasto" || tipo === "ganho")) {
            sql += ` AND t.tipo = $${paramIdx}`;
            params.push(tipo);
            paramIdx++;
        }

        // Filtro por classe
        if (classe_id && !isNaN(parseInt(classe_id, 10))) {
            sql += ` AND t.classe_id = $${paramIdx}`;
            params.push(parseInt(classe_id, 10));
            paramIdx++;
        }

        // Busca textual segura na descrição ou observação
        if (busca && typeof busca === "string" && busca.trim().length > 0) {
            sql += ` AND (t.descricao ILIKE $${paramIdx} OR t.observacao ILIKE $${paramIdx})`;
            params.push(`%${busca.trim()}%`);
            paramIdx++;
        }

        sql += ` ORDER BY t.data_transacao DESC, t.id DESC;`;

        const resultado = await db.query(sql, params);

        const transacoesFormatadas = resultado.rows.map(row => ({
            id: Number(row.id),
            descricao: row.descricao,
            tipo: row.tipo,
            valor: Number(row.valor),
            classe_id: Number(row.classe_id),
            classe_nome: row.classe_nome,
            classe_cor: row.classe_cor || "#10b981",
            classe_icone: row.classe_icone || "tag",
            data_iso: dataParaISO(row.data_transacao),
            data_formatada: formatarDataBR(row.data_transacao),
            observacao: row.observacao || "",
            parcela_atual: row.parcela_atual ? Number(row.parcela_atual) : null,
            total_parcelas: row.total_parcelas ? Number(row.total_parcelas) : null,
            parcelamento_id: row.parcelamento_id || null,
            criado_em: row.criado_em
        }));

        res.json(transacoesFormatadas);
    } catch (err) {
        console.error("Erro ao listar transações:", err.message);
        res.status(500).json({ error: "Erro interno ao consultar transações." });
    }
});

// 2. Obter transação por ID (GET)
app.get("/api/transacoes/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "ID inválido." });
        }

        const resultado = await db.query(
            `SELECT 
                t.id, t.descricao, t.tipo, t.valor, t.classe_id, 
                c.nome as classe_nome, c.cor as classe_cor,
                t.data_transacao, t.observacao,
                t.parcela_atual, t.total_parcelas, t.parcelamento_id
             FROM transacoes t
             INNER JOIN classes c ON c.id = t.classe_id
             WHERE t.id = $1;`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Transação não encontrada." });
        }

        const row = resultado.rows[0];
        res.json({
            id: Number(row.id),
            descricao: row.descricao,
            tipo: row.tipo,
            valor: Number(row.valor),
            classe_id: Number(row.classe_id),
            classe_nome: row.classe_nome,
            classe_cor: row.classe_cor,
            data_iso: dataParaISO(row.data_transacao),
            data_formatada: formatarDataBR(row.data_transacao),
            observacao: row.observacao || "",
            parcela_atual: row.parcela_atual ? Number(row.parcela_atual) : null,
            total_parcelas: row.total_parcelas ? Number(row.total_parcelas) : null,
            parcelamento_id: row.parcelamento_id || null
        });
    } catch (err) {
        console.error("Erro ao buscar transação:", err.message);
        res.status(500).json({ error: "Erro interno ao buscar transação." });
    }
});

// 3. Criar transação (POST) - com suporte a parcelamento
app.post("/api/transacoes", async (req, res) => {
    try {
        const descricao = sanitizarTexto(req.body.descricao);
        const tipo = sanitizarTexto(req.body.tipo).toLowerCase();
        const valorRaw = req.body.valor;
        const classeIdRaw = req.body.classe_id;
        const dataTransacao = sanitizarTexto(req.body.data_transacao || req.body.data);
        const observacao = sanitizarTexto(req.body.observacao || "");
        const parcelasRaw = req.body.parcelas;
        const primeiraParcelaMesSeguinteRaw = req.body.primeira_parcela_mes_seguinte;

        // Validações rigorosas de segurança (Seção 12 e 47)
        if (!descricao) {
            return res.status(400).json({ error: "A descrição da transação é obrigatória." });
        }
        if (descricao.length > 150) {
            return res.status(400).json({ error: "A descrição não pode ter mais que 150 caracteres." });
        }

        if (tipo !== "gasto" && tipo !== "ganho") {
            return res.status(400).json({ error: "O tipo deve ser exclusivamente 'gasto' ou 'ganho'." });
        }

        const valor = Number(valorRaw);
        if (isNaN(valor) || valor <= 0) {
            return res.status(400).json({ error: "Informe um valor numérico válido maior que zero." });
        }

        const classe_id = parseInt(classeIdRaw, 10);
        if (isNaN(classe_id) || classe_id <= 0) {
            return res.status(400).json({ error: "Selecione uma classe válida." });
        }

        // Validação da data
        const dataFinal = dataTransacao || new Date().toISOString().slice(0, 10);
        if (!validarDataISO(dataFinal)) {
            return res.status(400).json({ error: "Data da transação inválida. Utilize o formato AAAA-MM-DD." });
        }

        // Verifica se a classe existe no banco
        const classeExistente = await db.query("SELECT id, nome, cor FROM classes WHERE id = $1;", [classe_id]);
        if (classeExistente.rows.length === 0) {
            return res.status(400).json({ error: "A classe selecionada não existe." });
        }

        const dadosClasse = classeExistente.rows[0];

        // Lógica de Parcelamento (exclusiva para Gastos / Despesas)
        let numParcelas = 1;
        let iniciarMesSeguinte = false;

        if (tipo === "gasto") {
            if (parcelasRaw === "1_prox_mes") {
                numParcelas = 1;
                iniciarMesSeguinte = true;
            } else if (parcelasRaw !== undefined && parcelasRaw !== null && parcelasRaw !== "") {
                const parsed = parseInt(parcelasRaw, 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 60) {
                    numParcelas = parsed;
                    if (primeiraParcelaMesSeguinteRaw === true || primeiraParcelaMesSeguinteRaw === "true") {
                        iniciarMesSeguinte = true;
                    }
                }
            } else if (primeiraParcelaMesSeguinteRaw === true || primeiraParcelaMesSeguinteRaw === "true") {
                iniciarMesSeguinte = true;
            }
        }

        // Se for parcelado em múltiplas vezes OU agendado para o mês seguinte
        if (numParcelas > 1 || iniciarMesSeguinte) {
            const client = await db.pool.connect();
            try {
                await client.query("BEGIN;");
                const valoresParcelas = calcularValoresParcelas(valor, numParcelas);
                const parcelamentoId = `parc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const transacoesCriadas = [];

                for (let i = 1; i <= numParcelas; i++) {
                    const dataParcela = iniciarMesSeguinte
                        ? calcularDataParcela(dataFinal, i)
                        : (i === 1 ? dataFinal : calcularDataParcela(dataFinal, i - 1));

                    const valorParcela = valoresParcelas[i - 1];
                    const descParcela = numParcelas > 1 ? `${descricao} (${i}/${numParcelas})` : descricao;
                    const obsParcela = numParcelas > 1
                        ? (observacao ? `${observacao} | Parcela ${i}/${numParcelas}` : `Parcela ${i}/${numParcelas}`)
                        : (observacao || "Pagamento agendado para o 1º dia do mês seguinte");

                    const insercao = await client.query(
                        `INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao, parcela_atual, total_parcelas, parcelamento_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                         RETURNING id, descricao, tipo, valor, classe_id, data_transacao, observacao, parcela_atual, total_parcelas, parcelamento_id, criado_em;`,
                        [descParcela, tipo, valorParcela, classe_id, dataParcela, obsParcela, i, numParcelas, parcelamentoId]
                    );
                    transacoesCriadas.push(insercao.rows[0]);
                }

                await client.query("COMMIT;");

                const primeiraTransacao = transacoesCriadas[0];

                return res.status(201).json({
                    message: numParcelas > 1
                        ? `Gasto parcelado em ${numParcelas}x com sucesso! A 1ª parcela vence em ${formatarDataBR(primeiraTransacao.data_transacao)}.`
                        : `Gasto registrado com sucesso para o 1º dia do próximo mês (${formatarDataBR(primeiraTransacao.data_transacao)})!`,
                    transacao: {
                        id: Number(primeiraTransacao.id),
                        descricao: primeiraTransacao.descricao,
                        tipo: primeiraTransacao.tipo,
                        valor: Number(primeiraTransacao.valor),
                        classe_id: Number(primeiraTransacao.classe_id),
                        classe_nome: dadosClasse.nome,
                        classe_cor: dadosClasse.cor,
                        data_iso: dataParaISO(primeiraTransacao.data_transacao),
                        data_formatada: formatarDataBR(primeiraTransacao.data_transacao),
                        observacao: primeiraTransacao.observacao,
                        parcela_atual: primeiraTransacao.parcela_atual ? Number(primeiraTransacao.parcela_atual) : null,
                        total_parcelas: primeiraTransacao.total_parcelas ? Number(primeiraTransacao.total_parcelas) : null,
                        parcelamento_id: primeiraTransacao.parcelamento_id || null
                    },
                    total_parcelas_criadas: transacoesCriadas.length,
                    parcelamento_id: parcelamentoId
                });
            } catch (errTx) {
                await client.query("ROLLBACK;");
                throw errTx;
            } finally {
                client.release();
            }
        }

        // Inserção padrão sem parcelamento
        const insercao = await db.query(
            `INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao, parcela_atual, total_parcelas, parcelamento_id)
             VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, NULL)
             RETURNING id, descricao, tipo, valor, classe_id, data_transacao, observacao, parcela_atual, total_parcelas, parcelamento_id, criado_em;`,
            [descricao, tipo, valor, classe_id, dataFinal, observacao]
        );

        const novaTransacao = insercao.rows[0];

        res.status(201).json({
            message: `${tipo === "gasto" ? "Gasto" : "Ganho"} registrado com sucesso!`,
            transacao: {
                id: Number(novaTransacao.id),
                descricao: novaTransacao.descricao,
                tipo: novaTransacao.tipo,
                valor: Number(novaTransacao.valor),
                classe_id: Number(novaTransacao.classe_id),
                classe_nome: dadosClasse.nome,
                classe_cor: dadosClasse.cor,
                data_iso: dataParaISO(novaTransacao.data_transacao),
                data_formatada: formatarDataBR(novaTransacao.data_transacao),
                observacao: novaTransacao.observacao,
                parcela_atual: null,
                total_parcelas: null,
                parcelamento_id: null
            }
        });
    } catch (err) {
        console.error("Erro ao cadastrar transação:", err.message);
        res.status(500).json({ error: "Erro interno ao registrar transação." });
    }
});

// 4. Atualizar transação (PUT)
app.put("/api/transacoes/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Identificador de transação inválido." });
        }

        const descricao = sanitizarTexto(req.body.descricao);
        const tipo = sanitizarTexto(req.body.tipo).toLowerCase();
        const valorRaw = req.body.valor;
        const classeIdRaw = req.body.classe_id;
        const dataTransacao = sanitizarTexto(req.body.data_transacao || req.body.data);
        const observacao = sanitizarTexto(req.body.observacao || "");

        if (!descricao) {
            return res.status(400).json({ error: "A descrição é obrigatória." });
        }
        if (descricao.length > 150) {
            return res.status(400).json({ error: "A descrição não pode exceder 150 caracteres." });
        }

        if (tipo !== "gasto" && tipo !== "ganho") {
            return res.status(400).json({ error: "O tipo deve ser 'gasto' ou 'ganho'." });
        }

        const valor = Number(valorRaw);
        if (isNaN(valor) || valor <= 0) {
            return res.status(400).json({ error: "Informe um valor numérico válido maior que zero." });
        }

        const classe_id = parseInt(classeIdRaw, 10);
        if (isNaN(classe_id) || classe_id <= 0) {
            return res.status(400).json({ error: "Selecione uma classe válida." });
        }

        if (!validarDataISO(dataTransacao)) {
            return res.status(400).json({ error: "Data inválida." });
        }

        // Verifica existência da transação
        const transacaoExistente = await db.query("SELECT id FROM transacoes WHERE id = $1;", [id]);
        if (transacaoExistente.rows.length === 0) {
            return res.status(404).json({ error: "Transação não encontrada." });
        }

        // Verifica existência da classe
        const classeExistente = await db.query("SELECT id, nome, cor FROM classes WHERE id = $1;", [classe_id]);
        if (classeExistente.rows.length === 0) {
            return res.status(400).json({ error: "A classe informada não existe." });
        }

        const atualizado = await db.query(
            `UPDATE transacoes
             SET descricao = $1, tipo = $2, valor = $3, classe_id = $4, data_transacao = $5, observacao = $6, atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING id, descricao, tipo, valor, classe_id, data_transacao, observacao, parcela_atual, total_parcelas, parcelamento_id;`,
            [descricao, tipo, valor, classe_id, dataTransacao, observacao, id]
        );

        const dadosRetorno = atualizado.rows[0];
        const dadosClasse = classeExistente.rows[0];

        res.json({
            message: "Transação atualizada com sucesso!",
            transacao: {
                id: Number(dadosRetorno.id),
                descricao: dadosRetorno.descricao,
                tipo: dadosRetorno.tipo,
                valor: Number(dadosRetorno.valor),
                classe_id: Number(dadosRetorno.classe_id),
                classe_nome: dadosClasse.nome,
                classe_cor: dadosClasse.cor,
                data_iso: dataParaISO(dadosRetorno.data_transacao),
                data_formatada: formatarDataBR(dadosRetorno.data_transacao),
                observacao: dadosRetorno.observacao,
                parcela_atual: dadosRetorno.parcela_atual ? Number(dadosRetorno.parcela_atual) : null,
                total_parcelas: dadosRetorno.total_parcelas ? Number(dadosRetorno.total_parcelas) : null,
                parcelamento_id: dadosRetorno.parcelamento_id || null
            }
        });
    } catch (err) {
        console.error("Erro ao atualizar transação:", err.message);
        res.status(500).json({ error: "Erro interno ao atualizar transação." });
    }
});

// 5. Excluir transação (DELETE)
app.delete("/api/transacoes/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Identificador de transação inválido." });
        }

        const excluirTodas = req.query.excluir_todas === "true";

        // Verifica existência da transação
        const transacaoExistente = await db.query(
            "SELECT id, descricao, parcelamento_id, total_parcelas FROM transacoes WHERE id = $1;",
            [id]
        );

        if (transacaoExistente.rows.length === 0) {
            return res.status(404).json({ error: "Transação não encontrada." });
        }

        const item = transacaoExistente.rows[0];

        // Se solicitado excluir todas as parcelas e pertence a um parcelamento
        if (excluirTodas && item.parcelamento_id) {
            const delRes = await db.query(
                "DELETE FROM transacoes WHERE parcelamento_id = $1 RETURNING id;",
                [item.parcelamento_id]
            );
            return res.json({
                message: `Todas as ${delRes.rowCount} parcelas do parcelamento foram excluídas com sucesso!`
            });
        }

        const resultado = await db.query(
            "DELETE FROM transacoes WHERE id = $1 RETURNING id, descricao, tipo, valor;",
            [id]
        );

        res.json({
            message: `Transação "${resultado.rows[0].descricao}" excluída com sucesso!`
        });
    } catch (err) {
        console.error("Erro ao excluir transação:", err.message);
        res.status(500).json({ error: "Erro interno ao excluir transação." });
    }
});

// ========================================================
// ROTA DE ANÁLISE FINANCEIRA & DADOS PARA GRÁFICOS
// ========================================================

app.get("/api/analise", async (req, res) => {
    try {
        const { mes } = req.query; // YYYY-MM opcional
        const paramsFiltro = [];
        let condicaoMes = "";

        if (mes && /^\d{4}-\d{2}$/.test(mes)) {
            condicaoMes = " AND TO_CHAR(t.data_transacao, 'YYYY-MM') = $1";
            paramsFiltro.push(mes);
        }

        // 1. Métricas Globais do período
        const queryKpis = `
            SELECT 
                COALESCE(SUM(CASE WHEN t.tipo = 'ganho' THEN t.valor ELSE 0 END), 0)::numeric AS total_ganhos,
                COALESCE(SUM(CASE WHEN t.tipo = 'gasto' THEN t.valor ELSE 0 END), 0)::numeric AS total_gastos,
                COUNT(t.id)::int AS total_transacoes
            FROM transacoes t
            WHERE 1=1 ${condicaoMes};
        `;
        const resKpis = await db.query(queryKpis, paramsFiltro);
        const kpisRaw = resKpis.rows[0] || { total_ganhos: 0, total_gastos: 0, total_transacoes: 0 };

        const totalGanhos = Number(kpisRaw.total_ganhos);
        const totalGastos = Number(kpisRaw.total_gastos);
        const saldoLiquido = Number((totalGanhos - totalGastos).toFixed(2));
        const taxaPoupanca = totalGanhos > 0 ? Number((((totalGanhos - totalGastos) / totalGanhos) * 100).toFixed(1)) : 0;

        // 2. Gráfico de Pizza: Gastos divididos entre as Classes (solicitado pelo usuário)
        const queryGastosClasses = `
            SELECT 
                c.id AS classe_id,
                c.nome AS classe_nome,
                c.cor AS classe_cor,
                COALESCE(SUM(t.valor), 0)::numeric AS total_gasto,
                COUNT(t.id)::int AS quantidade
            FROM classes c
            INNER JOIN transacoes t ON t.classe_id = c.id
            WHERE t.tipo = 'gasto' ${condicaoMes}
            GROUP BY c.id, c.nome, c.cor
            HAVING SUM(t.valor) > 0
            ORDER BY total_gasto DESC;
        `;
        const resGastosClasses = await db.query(queryGastosClasses, paramsFiltro);

        const gastosPorClasse = resGastosClasses.rows.map(row => {
            const gastoVal = Number(row.total_gasto);
            const perc = totalGastos > 0 ? Number(((gastoVal / totalGastos) * 100).toFixed(1)) : 0;
            return {
                classe_id: Number(row.classe_id),
                classe_nome: row.classe_nome,
                classe_cor: row.classe_cor || "#10b981",
                total_gasto: gastoVal,
                percentual: perc,
                quantidade: Number(row.quantidade)
            };
        });

        // 3. Gráfico de Coluna: Comparação Mensal Gastos vs Ganhos (solicitado pelo usuário)
        // Se um mês específico for selecionado, trazemos os últimos 6 meses até ele para visualização comparativa rica
        let queryComparativo = `
            SELECT 
                TO_CHAR(t.data_transacao, 'YYYY-MM') AS ano_mes,
                COALESCE(SUM(CASE WHEN t.tipo = 'ganho' THEN t.valor ELSE 0 END), 0)::numeric AS ganhos,
                COALESCE(SUM(CASE WHEN t.tipo = 'gasto' THEN t.valor ELSE 0 END), 0)::numeric AS gastos,
                COUNT(t.id)::int AS total_transacoes
            FROM transacoes t
            GROUP BY TO_CHAR(t.data_transacao, 'YYYY-MM')
            ORDER BY ano_mes ASC;
        `;
        const resComparativo = await db.query(queryComparativo);

        const mesesNomes = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ];

        const comparativoMensal = resComparativo.rows.map(row => {
            const [ano, mesNum] = row.ano_mes.split("-");
            const nomeCurto = mesesNomes[parseInt(mesNum, 10) - 1] || row.ano_mes;
            const ganhos = Number(row.ganhos);
            const gastos = Number(row.gastos);
            return {
                ano_mes: row.ano_mes,
                rotulo: `${nomeCurto}/${ano.slice(2)}`,
                ganhos,
                gastos,
                saldo: Number((ganhos - gastos).toFixed(2))
            };
        });

        // 4. Lista dos meses disponíveis para preencher dropdown de filtro
        const queryMesesDisponiveis = `
            SELECT DISTINCT TO_CHAR(data_transacao, 'YYYY-MM') AS ano_mes
            FROM transacoes
            ORDER BY ano_mes DESC;
        `;
        const resMeses = await db.query(queryMesesDisponiveis);
        const mesesDisponiveis = resMeses.rows.map(r => r.ano_mes);

        res.json({
            periodo: mes || "todos",
            kpis: {
                total_ganhos: totalGanhos,
                total_gastos: totalGastos,
                saldo_liquido: saldoLiquido,
                taxa_poupanca: taxaPoupanca,
                total_transacoes: Number(kpisRaw.total_transacoes)
            },
            gastos_por_classe: gastosPorClasse,
            comparativo_mensal: comparativoMensal,
            meses_disponiveis: mesesDisponiveis
        });
    } catch (err) {
        console.error("Erro ao gerar análise financeira:", err.message);
        res.status(500).json({ error: "Erro interno ao processar dados analíticos." });
    }
});

// ========================================================
// TRATAMENTO CENTRALIZADO DE ERROS (Seção 27 das Boas Práticas)
// ========================================================

// Rota fallback para API não encontrada (Compatível com Express 5)
app.all(/^\/api(\/.*)?$/, (req, res) => {
    res.status(404).json({ error: "Endpoint não encontrado." });
});

// Middleware de erro genérico seguro (nunca expõe stack trace ou queries)
app.use((err, req, res, next) => {
    console.error("Erro não capturado:", err.message);
    if (err.type === "entity.too.large") {
        return res.status(413).json({ error: "O tamanho da requisição excedeu o limite máximo seguro (20KB)." });
    }
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "JSON com formatação inválida no corpo da requisição." });
    }
    res.status(500).json({ error: "Ocorreu um erro interno seguro no servidor." });
});

// ========================================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================================

app.listen(PORTA, async () => {
    console.log(`[Money Control] Servidor ativo em http://localhost:${PORTA}`);
    await db.testarConexao();
});
