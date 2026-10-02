// ========================================================
// SCRIPT DE IMPORTAÇÃO DE TRANSAÇÕES E CLASSES
// Insere todas as transações dos prints no Money Control
// ========================================================

const listaTransacoes = [
    // Imagem 3
    { data: "2026-09-29", tipo: "ganho", descricao: "25 referências", classe: "Trabalho", obs: "PIX", valor: 200.00 },
    { data: "2026-09-29", tipo: "gasto", descricao: "sorvete", classe: "Alimentação", obs: "Cartão de Crédito", valor: 7.00 },
    { data: "2026-09-26", tipo: "gasto", descricao: "gasolina", classe: "Hana", obs: "Cartão de Crédito", valor: 30.00 },
    { data: "2026-09-26", tipo: "gasto", descricao: "salgados", classe: "Alimentação", obs: "Cartão de Crédito", valor: 24.00 },
    { data: "2026-09-26", tipo: "gasto", descricao: "mt", classe: "Hana", obs: "Cartão de Crédito", valor: 55.00 },
    { data: "2026-09-25", tipo: "gasto", descricao: "padaria", classe: "Hana", obs: "Cartão de Crédito", valor: 47.00 },
    { data: "2026-09-24", tipo: "ganho", descricao: "18 referências", classe: "Trabalho", obs: "PIX", valor: 144.00 },
    { data: "2026-09-23", tipo: "gasto", descricao: "estacionamento", classe: "Hana", obs: "Cartão de Crédito", valor: 13.00 },

    // Imagem 2
    { data: "2026-09-23", tipo: "gasto", descricao: "padaria", classe: "Hana", obs: "PIX", valor: 35.00 },
    { data: "2026-09-23", tipo: "gasto", descricao: "cinema", classe: "Hana", obs: "PIX", valor: 50.00 },
    { data: "2026-09-21", tipo: "gasto", descricao: "mac donalds", classe: "Alimentação", obs: "Cartão de Crédito", valor: 20.00 },
    { data: "2026-09-21", tipo: "gasto", descricao: "padaria", classe: "Hana", obs: "Cartão de Crédito", valor: 80.00 },
    { data: "2026-09-19", tipo: "gasto", descricao: "padaria", classe: "Hana", obs: "Cartão de Crédito", valor: 35.00 },
    { data: "2026-09-19", tipo: "gasto", descricao: "picolé", classe: "Alimentação", obs: "Cartão de Crédito", valor: 7.00 },
    { data: "2026-09-19", tipo: "gasto", descricao: "estacionamento", classe: "Hana", obs: "Cartão de Crédito", valor: 13.00 },
    { data: "2026-09-19", tipo: "gasto", descricao: "estacionamento", classe: "Hana", obs: "Cartão de Crédito", valor: 21.50 },
    { data: "2026-09-19", tipo: "ganho", descricao: "6 referências", classe: "Trabalho", obs: "PIX", valor: 48.00 },
    { data: "2026-09-19", tipo: "gasto", descricao: "gasolina", classe: "Hana", obs: "Cartão de Crédito", valor: 29.00 },
    { data: "2026-09-17", tipo: "ganho", descricao: "11 referências", classe: "Trabalho", obs: "PIX", valor: 88.00 },
    { data: "2026-09-17", tipo: "gasto", descricao: "fatia de bolo", classe: "Alimentação", obs: "Cartão de Crédito", valor: 7.00 },
    { data: "2026-09-16", tipo: "gasto", descricao: "cinema + combo pipoca", classe: "Hana", obs: "Cartão de Crédito", valor: 51.00 },

    // Imagem 1
    { data: "2026-09-16", tipo: "gasto", descricao: "estacionamento", classe: "Hana", obs: "Cartão de Crédito", valor: 12.00 },
    { data: "2026-09-15", tipo: "gasto", descricao: "fatia de bolo", classe: "Hana", obs: "Cartão de Crédito", valor: 23.00 },
    { data: "2026-09-11", tipo: "gasto", descricao: "MT", classe: "Hana", obs: "Cartão de Crédito", valor: 120.00 },
    { data: "2026-09-10", tipo: "gasto", descricao: "salgado + coca lata", classe: "Alimentação", obs: "Cartão de Crédito", valor: 15.00 },
    { data: "2026-09-08", tipo: "gasto", descricao: "croissant + suco + fatia de bolo", classe: "Hana", obs: "Cartão de Crédito", valor: 74.00 },
    { data: "2026-09-08", tipo: "gasto", descricao: "coxinha + pet coca", classe: "Alimentação", obs: "Cartão de Crédito", valor: 11.50 },
    { data: "2026-09-05", tipo: "gasto", descricao: "Browkie", classe: "Alimentação", obs: "PIX", valor: 18.00 },
    { data: "2026-09-04", tipo: "gasto", descricao: "Café da manhã", classe: "Hana", obs: "Cartão de Crédito", valor: 61.00 },
    { data: "2026-09-01", tipo: "gasto", descricao: "salgados", classe: "Hana", obs: "Cartão de Crédito", valor: 35.00 },
    { data: "2026-09-01", tipo: "gasto", descricao: "2 canetas + fita adesiva", classe: "Hana", obs: "Cartão de Crédito", valor: 12.00 },
    { data: "2026-09-01", tipo: "gasto", descricao: "mesig", classe: "Hana", obs: "Cartão de Crédito", valor: 39.90 }
];

async function importar() {
    const API_BASE = "http://localhost:3002/api";
    console.log("=== INICIANDO IMPORTAÇÃO DE DADOS ===");

    // 1. Obter classes existentes
    const classesRes = await fetch(`${API_BASE}/classes`);
    let classes = await classesRes.json();
    console.log(`Classes existentes: ${classes.length}`);

    // Mapeamento de classes por nome
    const mapaClasses = {};
    classes.forEach(c => {
        mapaClasses[c.nome.toLowerCase()] = c;
    });

    // 2. Garantir que as classes Hana, Alimentação e Trabalho existam com as cores do print
    const classesNecessarias = [
        { nome: "Hana", tipo_padrao: "gasto", cor: "#a855f7" },
        { nome: "Alimentação", tipo_padrao: "gasto", cor: "#fb7185" },
        { nome: "Trabalho", tipo_padrao: "ganho", cor: "#10b981" }
    ];

    for (const cReq of classesNecessarias) {
        const chave = cReq.nome.toLowerCase();
        if (!mapaClasses[chave]) {
            console.log(`Criando classe "${cReq.nome}"...`);
            const postRes = await fetch(`${API_BASE}/classes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cReq)
            });
            const created = await postRes.json();
            mapaClasses[chave] = created.classe;
            console.log(`Classe "${cReq.nome}" criada com ID ${created.classe.id}`);
        } else {
            // Atualiza cor para harmonizar com a imagem
            if (mapaClasses[chave].cor !== cReq.cor) {
                await fetch(`${API_BASE}/classes/${mapaClasses[chave].id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nome: mapaClasses[chave].nome,
                        tipo_padrao: cReq.tipo_padrao,
                        cor: cReq.cor
                    })
                });
                mapaClasses[chave].cor = cReq.cor;
            }
        }
    }

    // 3. Inserir transações
    console.log(`Importando ${listaTransacoes.length} transações...`);
    let sucesso = 0;

    for (const item of listaTransacoes) {
        const classeObj = mapaClasses[item.classe.toLowerCase()];
        if (!classeObj) {
            console.error(`Classe não encontrada para: ${item.classe}`);
            continue;
        }

        const payload = {
            descricao: item.descricao,
            tipo: item.tipo,
            valor: item.valor,
            classe_id: classeObj.id,
            data_transacao: item.data,
            observacao: item.obs
        };

        const postRes = await fetch(`${API_BASE}/transacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (postRes.ok) {
            sucesso++;
        } else {
            const err = await postRes.json();
            console.error(`Erro ao inserir "${item.descricao}":`, err.error);
        }
    }

    console.log(`=== IMPORTAÇÃO CONCLUÍDA: ${sucesso}/${listaTransacoes.length} inseridas com sucesso! ===`);
}

importar().catch(console.error);
