// ========================================================
// SCRIPT DE SETUP / INICIALIZAÇÃO SEGURA DO BANCO DE DADOS
// Money Control - Criação do banco, usuário com menor privilégio e tabelas
// ========================================================

require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function executarSetup() {
    console.log("=== INICIANDO CONFIGURAÇÃO DO BANCO MONEY CONTROL ===");

    const host = process.env.DB_HOST || "127.0.0.1";
    const port = Number(process.env.DB_PORT) || 5433;
    const adminUser = process.env.DB_ADMIN_USER || "postgres";
    const adminPassword = process.env.DB_ADMIN_PASSWORD || "AdminMasterDoceria2026!";
    const targetDbName = process.env.DB_NAME || "moneycontrol_db";

    console.log(`Conectando como admin (${adminUser}) em ${host}:${port}...`);

    // 1. Conecta ao banco padrão 'postgres' para verificar/criar o banco 'moneycontrol_db'
    const adminClient = new Client({
        host,
        port,
        database: "postgres",
        user: adminUser,
        password: adminPassword,
        connectionTimeoutMillis: 5000,
    });

    try {
        await adminClient.connect();
        console.log("Conectado ao servidor PostgreSQL!");

        const checkDb = await adminClient.query(
            "SELECT 1 FROM pg_database WHERE datname = $1;",
            [targetDbName]
        );

        if (checkDb.rows.length === 0) {
            console.log(`Criando banco de dados "${targetDbName}"...`);
            // Nomes de banco não aceitam parâmetros em CREATE DATABASE, sanitizado via regex
            const safeDbName = targetDbName.replace(/[^a-zA-Z0-9_]/g, "");
            await adminClient.query(`CREATE DATABASE ${safeDbName};`);
            console.log(`Banco "${safeDbName}" criado com sucesso!`);
        } else {
            console.log(`Banco de dados "${targetDbName}" já existe.`);
        }
    } catch (err) {
        console.error("Erro ao verificar/criar banco no servidor:", err.message);
        process.exit(1);
    } finally {
        await adminClient.end();
    }

    // 2. Conecta diretamente ao banco de dados alvo para executar o script de schema e permissões
    console.log(`Conectando ao banco "${targetDbName}" para aplicar migrations e permissões...`);
    const dbClient = new Client({
        host,
        port,
        database: targetDbName,
        user: adminUser,
        password: adminPassword,
        connectionTimeoutMillis: 5000,
    });

    try {
        await dbClient.connect();
        const sqlPath = path.join(__dirname, "..", "database", "init-scripts", "01-init-moneycontrol.sql");
        const sql = fs.readFileSync(sqlPath, "utf-8");

        console.log("Executando scripts SQL de inicialização segura...");
        await dbClient.query(sql);
        console.log("Schema, índices, menor privilégio e dados iniciais aplicados com SUCESSO!");
    } catch (err) {
        console.error("Erro ao aplicar script no banco:", err.message);
        process.exit(1);
    } finally {
        await dbClient.end();
    }

    console.log("=== CONFIGURAÇÃO CONCLUÍDA COM SUCESSO ===");
}

executarSetup();
