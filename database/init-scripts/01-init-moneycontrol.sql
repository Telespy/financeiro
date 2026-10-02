-- ========================================================
-- MONEY CONTROL - SCRIPT DE INICIALIZAÇÃO SEGURA DO BANCO
-- Diretrizes: Menor Privilégio, Integridade Referencial, Sanitização
-- Baseado no arquivo de Boas Práticas (Seções 8, 9, 10, 15, 36, 70)
-- ========================================================

-- 1. Criação do Usuário de Menor Privilégio da Aplicação
-- Princípio de Menor Privilégio: a aplicação NUNCA usa credenciais de superusuário
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'moneycontrol_user') THEN
      CREATE ROLE moneycontrol_user WITH LOGIN PASSWORD 'MoneyControlSeguro2026!';
   END IF;
END
$do$;

-- 2. Restringir acesso ao banco de dados exclusivamente a usuários autorizados
REVOKE ALL ON DATABASE moneycontrol_db FROM PUBLIC;
GRANT CONNECT ON DATABASE moneycontrol_db TO moneycontrol_user;

-- 3. Criação da Tabela de Classes (Categorias Financeiras)
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) UNIQUE NOT NULL,
    tipo_padrao VARCHAR(20) DEFAULT 'ambos' CHECK (tipo_padrao IN ('gasto', 'ganho', 'ambos')),
    cor VARCHAR(10) DEFAULT '#10b981',
    icone VARCHAR(30) DEFAULT 'tag',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criação da Tabela de Transações (Gastos e Ganhos)
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(150) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('gasto', 'ganho')),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    classe_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    data_transacao DATE NOT NULL,
    observacao VARCHAR(255),
    parcela_atual INTEGER DEFAULT NULL,
    total_parcelas INTEGER DEFAULT NULL,
    parcelamento_id VARCHAR(50) DEFAULT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de alta performance e otimização de relatórios/filtros (Seções 48 e 70)
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes (data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_classe ON transacoes (classe_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_parcelamento ON transacoes (parcelamento_id);
CREATE INDEX IF NOT EXISTS idx_classes_nome ON classes (LOWER(nome));

-- 5. Aplicação Estrita do Princípio de Menor Privilégio (Seção 10)
GRANT USAGE ON SCHEMA public TO moneycontrol_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO moneycontrol_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO moneycontrol_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO moneycontrol_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO moneycontrol_user;

-- 6. Carga inicial de Classes Padrão (incluindo as solicitadas)
INSERT INTO classes (nome, tipo_padrao, cor, icone)
VALUES 
    ('Transporte', 'gasto', '#38bdf8', 'car'),
    ('Alimentação', 'gasto', '#fbbf24', 'utensils'),
    ('Estudos', 'gasto', '#a78bfa', 'graduation-cap'),
    ('Salário', 'ganho', '#34d399', 'wallet'),
    ('Investimentos', 'ambos', '#10b981', 'trending-up'),
    ('Moradia', 'gasto', '#f87171', 'home'),
    ('Lazer', 'gasto', '#f472b6', 'gamepad'),
    ('Saúde', 'gasto', '#fb923c', 'heart-pulse'),
    ('Freelance / Extra', 'ganho', '#6ee7b7', 'briefcase'),
    ('Outros', 'ambos', '#94a3b8', 'tag')
ON CONFLICT (nome) DO NOTHING;

-- 7. Dados iniciais de demonstração (facilitam validação imediata dos gráficos)
INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Salário Mensal', 'ganho', 5200.00, c.id, CURRENT_DATE - INTERVAL '15 days', 'Depósito em conta corrente'
FROM classes c WHERE c.nome = 'Salário' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Salário Mensal');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Supermercado Mensal', 'gasto', 850.50, c.id, CURRENT_DATE - INTERVAL '12 days', 'Compras do mês'
FROM classes c WHERE c.nome = 'Alimentação' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Supermercado Mensal');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Curso de Programação e IA', 'gasto', 340.00, c.id, CURRENT_DATE - INTERVAL '10 days', 'Mensalidade da plataforma de estudos'
FROM classes c WHERE c.nome = 'Estudos' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Curso de Programação e IA');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Combustível / Metrô', 'gasto', 280.00, c.id, CURRENT_DATE - INTERVAL '8 days', 'Transporte diário'
FROM classes c WHERE c.nome = 'Transporte' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Combustível / Metrô');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Consultoria / Freelance Web', 'ganho', 1600.00, c.id, CURRENT_DATE - INTERVAL '5 days', 'Projeto entregue com sucesso'
FROM classes c WHERE c.nome = 'Freelance / Extra' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Consultoria / Freelance Web');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Restaurante Fim de Semana', 'gasto', 195.00, c.id, CURRENT_DATE - INTERVAL '3 days', 'Almoço em família'
FROM classes c WHERE c.nome = 'Alimentação' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Restaurante Fim de Semana');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Livros Técnicos e Materiais', 'gasto', 120.00, c.id, CURRENT_DATE - INTERVAL '2 days', 'Livro de arquitetura de software'
FROM classes c WHERE c.nome = 'Estudos' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Livros Técnicos e Materiais');

INSERT INTO transacoes (descricao, tipo, valor, classe_id, data_transacao, observacao)
SELECT 'Cinema e Streaming', 'gasto', 89.90, c.id, CURRENT_DATE - INTERVAL '1 day', 'Assinatura e lazer'
FROM classes c WHERE c.nome = 'Lazer' AND NOT EXISTS (SELECT 1 FROM transacoes WHERE descricao = 'Cinema e Streaming');
