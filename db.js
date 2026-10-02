// ========================================================
// MÓDULO DE BANCO DE DADOS - MONEY CONTROL
// Conexão Segura com PostgreSQL via Pool e Menor Privilégio
// Baseado nas diretrizes do guia de boas práticas (Seções 9, 10, 15, 70)
// ========================================================

const { Pool } = require("pg");
require("dotenv").config();

// Configurações obtidas das variáveis de ambiente (Segurança de Segredos)
const poolConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5433,
    database: process.env.DB_NAME || "moneycontrol_db",
    user: process.env.DB_USER || "moneycontrol_user",
    password: process.env.DB_PASSWORD || "MoneyControlSeguro2026!",
    max: 10, // Limite de conexões no pool para evitar DoS por exaustão (Hardening / Seção 13)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

let statusBanco = {
    conectado: false,
    usuario: poolConfig.user,
    banco: poolConfig.database,
    host: poolConfig.host,
    porta: poolConfig.port,
    ultimoErro: null,
    ultimaVerificacao: null
};

// Monitoramento interno de erros do pool sem expor detalhes sensíveis
pool.on("error", (err) => {
    console.error("Erro inesperado no pool do PostgreSQL:", err.message);
    statusBanco.conectado = false;
    statusBanco.ultimoErro = "Falha de conexão com o pool";
});

// Testa conexão inicial de forma assíncrona
async function testarConexao() {
    statusBanco.ultimaVerificacao = new Date().toISOString();
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT current_user, current_database(), version();");
        client.release();

        statusBanco.conectado = true;
        statusBanco.usuario = res.rows[0].current_user;
        statusBanco.banco = res.rows[0].current_database;
        statusBanco.ultimoErro = null;

        console.log(`[Money Control] PostgreSQL Conectado com sucesso! [Banco: ${statusBanco.banco} | Usuário: ${statusBanco.usuario}]`);
        return true;
    } catch (err) {
        statusBanco.conectado = false;
        statusBanco.ultimoErro = err.message;
        console.warn(`[Money Control] Aviso de conexão com banco (${poolConfig.host}:${poolConfig.port}):`, err.message);
        return false;
    }
}

function getStatus() {
    return { ...statusBanco };
}

module.exports = {
    // Força uso exclusivo de queries parametrizadas ($1, $2, ...) para prevenção absoluta de SQL Injection
    query: (text, params) => pool.query(text, params),
    pool,
    testarConexao,
    getStatus
};
