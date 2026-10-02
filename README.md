# Money Control &bull; Sistema de Gestão Financeira

> Sistema completo de gestão e análise financeira pessoal e familiar, com arquitetura robusta em **Node.js / Express**, interface moderna e responsiva em **Vanilla CSS / JavaScript**, gráficos interativos com **Chart.js** e banco de dados relacional **PostgreSQL 16 Alpine** executado em contêineres **Docker**.

---

## 📋 Sumário
- [1. Visão Geral do Sistema](#1-visão-geral-do-sistema)
- [2. Principais Recursos](#2-principais-recursos)
- [3. Arquitetura e Tecnologias](#3-arquitetura-e-tecnologias)
- [4. Como é Usado o Banco de Dados com Docker](#4-como-é-usado-o-banco-de-dados-com-docker)
  - [4.1 Por que PostgreSQL no Docker?](#41-por-que-postgresql-no-docker)
  - [4.2 Estrutura da Pasta `database/`](#42-estrutura-da-pasta-database)
  - [4.3 Princípio do Menor Privilégio (Least Privilege)](#43-princípio-do-menor-privilégio-least-privilege)
  - [4.4 Modelo Relacional e Esquema SQL](#44-modelo-relacional-e-esquema-sql)
  - [4.5 Persistência com Volumes Docker](#45-persistência-com-volumes-docker)
- [5. Como Executar a Aplicação](#5-como-executar-a-aplicação)
  - [Opção 1: Execução Total via Docker Compose (Recomendada)](#opção-1-execução-total-via-docker-compose-recomendada)
  - [Opção 2: Banco no Docker e Aplicação Local (Node.js)](#opção-2-banco-no-docker-e-aplicação-local-nodejs)
  - [Opção 3: Subindo o Contêiner do Banco Manualmente via Docker CLI](#opção-3-subindo-o-contêiner-do-banco-manualmente-via-docker-cli)
- [6. Variáveis de Ambiente (`.env`)](#6-variáveis-de-ambiente-env)
- [7. Comandos Úteis do Docker](#7-comandos-úteis-do-docker)

---

## 1. Visão Geral do Sistema

O **Money Control** foi desenvolvido para oferecer controle financeiro detalhado, confiável e com visualização analítica clara de despesas e receitas. O projeto substitui planilhas manuais e sistemas legados por uma aplicação web rápida, moderna e segura.

Toda a arquitetura foi desenhada priorizando:
1. **Segurança de Dados**: Prevenção ativa contra SQL Injection, controle de acesso restrito ao banco e sanitização estrita de inputs.
2. **Confiabilidade**: Transações atômicas no PostgreSQL com integridade referencial rigorosa (`ON DELETE RESTRICT`).
3. **Facilidade de Implantação**: Banco de dados e aplicação conteinerizados com Docker, eliminando a necessidade de instalar e configurar PostgreSQL manualmente no sistema operacional hospedeiro.

---

## 2. Principais Recursos

- **Dashboard Financeiro**:
  - Resumo de métricas principais: Saldo Atual, Total de Entradas (Ganhos), Total de Saídas (Gastos) e Balanço Mensal.
  - Indicador de status em tempo real da conexão com o banco de dados PostgreSQL.
- **Visualização com Gráficos Interativos (Chart.js)**:
  - **Gráfico de Donut / Pizza**: Distribuição percentual de gastos por categoria/classe (Alimentação, Transporte, Moradia, Estudos, Lazer, etc.).
  - **Gráfico de Barras / Colunas**: Balanço comparativo mensal (Receitas em verde esmeralda vs. Despesas em coral/rosa).
- **Gestão de Transações**:
  - Cadastro rápido de receitas e despesas com validação de formato e valor positivo.
  - **Parcelamentos Inteligentes**: Suporte a parcelamentos automáticos (ex: 1/12, 2/12...), registrando o grupo de parcelas no banco de dados.
  - Filtros instantâneos por descrição (busca com *debounce*), tipo (`gasto` / `ganho`), classe e mês de competência.
  - Edição e exclusão direta com modal de confirmação e feedback visual.
- **Gerenciador de Classes / Categorias**:
  - Criação de novas categorias com seleção de cores personalizadas e ícones.
  - Proteção de integridade referencial: impede a exclusão acidental de categorias que possuam movimentações vinculadas.
  - Estatísticas automáticas por categoria (total acumulado e contagem de lançamentos).

---

## 3. Arquitetura e Tecnologias

- **Backend**:
  - **Node.js** (v20+ / v22 Alpine no Docker)
  - **Express 5**: Roteamento RESTful, middlewares de segurança e tratamento centralizado de erros.
  - **pg (node-postgres)**: Pool de conexões otimizado (`Pool`) com queries 100% parametrizadas.
- **Frontend**:
  - **HTML5 Semântico**
  - **Vanilla CSS3**: Design system moderno baseado em Dark Obsidian, detalhes em verde Emerald, efeito Glassmorphism e tipografias *Plus Jakarta Sans* e *JetBrains Mono*.
  - **JavaScript Puro (ES6+)**: SPA leve e veloz, sem a sobrecarga de frameworks pesados.
  - **Chart.js (UMD)**: Biblioteca de gráficos empacotada localmente (`chart.umd.min.js`), garantindo privacidade e funcionamento offline.
- **Banco de Dados & Infraestrutura**:
  - **PostgreSQL 16 Alpine**: Banco relacional ACID de alta performance.
  - **Docker & Docker Compose**: Isolamento de contêineres, orquestração de rede e volumes persistentes.

---

## 4. Como é Usado o Banco de Dados com Docker

### 4.1 Por que PostgreSQL no Docker?

Rodar o PostgreSQL dentro do Docker oferece múltiplos benefícios:
- **Portabilidade**: Não é necessário instalar o PostgreSQL na máquina do desenvolvedor nem configurar serviços locais no Windows/Linux/macOS.
- **Isolamento**: O banco roda em uma camada de rede isolada, expondo apenas as portas configuradas e sem interferir em outras versões de banco que o sistema possua.
- **Automatização de Inicialização**: Scripts de schema, criação de usuários de menor privilégio e dados iniciais são executados automaticamente na primeira vez em que o contêiner sobe.
- **Persistência Segura**: Os dados ficam gravados em um Docker Volume desacoplado do ciclo de vida do contêiner.

### 4.2 Estrutura da Pasta `database/`

```
database/
├── Dockerfile                  # Define a imagem personalizada do PostgreSQL 16
└── init-scripts/
    └── 01-init-moneycontrol.sql # Script SQL executado na inicialização do contêiner
```

- **`database/Dockerfile`**:
  ```dockerfile
  FROM postgres:16-alpine
  ENV TZ=America/Sao_Paulo
  COPY init-scripts/ /docker-entrypoint-initdb.d/
  HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
      CMD pg_isready -U postgres -d moneycontrol_db || exit 1
  EXPOSE 5432
  ```
  Ao iniciar, o PostgreSQL executa automaticamente qualquer script `.sql` localizado dentro da pasta padrão `/docker-entrypoint-initdb.d/`.

### 4.3 Princípio do Menor Privilégio (Least Privilege)

Um dos pilares do sistema é a separação rígida entre as funções administrativas e operacionais do banco:
1. **Administrador (`postgres`)**:
   - Usado exclusivamente na fase de inicialização do contêiner ou em migrações controladas.
   - Possui credenciais de superusuário para criar o banco de dados e as roles.
2. **Usuário da Aplicação (`moneycontrol_user`)**:
   - A aplicação web conecta **exclusivamente** através deste usuário.
   - O usuário possui permissões estritas de DML:
     ```sql
     GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO moneycontrol_user;
     GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO moneycontrol_user;
     ```
   - O acesso direto de outros usuários públicos ao banco é revogado (`REVOKE ALL ON DATABASE moneycontrol_db FROM PUBLIC;`).
   - Se houver qualquer falha ou tentativa indevida de execução de comandos DDL (como `DROP DATABASE` ou `ALTER TABLE`), o banco bloqueia a operação por falta de privilégios.

### 4.4 Modelo Relacional e Esquema SQL

O script `01-init-moneycontrol.sql` cria as duas tabelas fundamentais:

```sql
-- 1. Categorias / Classes
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) UNIQUE NOT NULL,
    tipo_padrao VARCHAR(20) DEFAULT 'ambos' CHECK (tipo_padrao IN ('gasto', 'ganho', 'ambos')),
    cor VARCHAR(10) DEFAULT '#10b981',
    icone VARCHAR(30) DEFAULT 'tag',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transações Financeiras (Receitas e Despesas)
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

-- Índices estratégicos para relatórios e pesquisas instantâneas
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes (data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_classe ON transacoes (classe_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_parcelamento ON transacoes (parcelamento_id);
CREATE INDEX IF NOT EXISTS idx_classes_nome ON classes (LOWER(nome));
```

### 4.5 Persistência com Volumes Docker

O contêiner utiliza um volume nomeado do Docker (ex: `moneycontrol_pgdata`). Isso assegura que:
- Parar, reiniciar ou atualizar o contêiner do banco **nunca** apaga os registros cadastrados.
- O diretório interno `/var/lib/postgresql/data` do contêiner é persistido no disco gerenciado pelo Docker.

---

## 5. Como Executar a Aplicação

### Pré-requisitos
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados.
- (Opcional, caso queira rodar o Node fora do Docker) [Node.js 18+](https://nodejs.org/).

---

### Opção 1: Execução Total via Docker Compose (Recomendada)

Com apenas um comando, o Docker Compose constrói a imagem do banco, executa os scripts de schema e inicializa a aplicação web conectada na mesma rede interna.

1. **Clone o repositório e acerte as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
2. **Inicie os serviços com o Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```
3. **Verifique os contêineres ativos**:
   ```bash
   docker-compose ps
   ```
4. **Acesse no navegador**:
   - Aplicação: **[http://localhost:3002](http://localhost:3002)**
   - Status da API e Banco: **[http://localhost:3002/api/status](http://localhost:3002/api/status)**

Para encerrar os serviços:
```bash
docker-compose down
```

---

### Opção 2: Banco no Docker e Aplicação Local (Node.js)

Se preferir desenvolver e testar a aplicação Node.js diretamente no seu computador (com auto-reload):

1. **Suba apenas o contêiner do banco de dados**:
   ```bash
   docker-compose up -d moneycontrol-db
   ```
2. **Instale as dependências da aplicação**:
   ```bash
   npm install
   ```
3. **Configure seu `.env` local**:
   Certifique-se de que o host e a porta apontam para o Docker exposto (ex: `127.0.0.1:5433` ou `127.0.0.1:5432`).
4. **Inicie o servidor Node.js**:
   ```bash
   # Modo desenvolvimento com recarga automática
   npm run dev

   # Ou modo produção
   npm start
   ```
5. **Acesse:** `http://localhost:3002`

---

### Opção 3: Subindo o Contêiner do Banco Manualmente via Docker CLI

Se você não quiser usar o Docker Compose e preferir gerenciar o contêiner do PostgreSQL diretamente pela CLI do Docker:

1. **Construa a imagem a partir da pasta `database`**:
   ```bash
   docker build -t moneycontrol-db:1.0 ./database
   ```
2. **Execute o contêiner**:
   ```bash
   docker run -d \
     --name moneycontrol-db \
     -p 5433:5432 \
     -e POSTGRES_DB=moneycontrol_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=AdminMasterDoceria2026! \
     -v moneycontrol_pgdata:/var/lib/postgresql/data \
     moneycontrol-db:1.0
   ```
3. **Execute o setup das tabelas (se necessário manualmente)**:
   ```bash
   npm run init-db
   ```

---

## 6. Variáveis de Ambiente (`.env`)

Crie seu arquivo `.env` a partir do modelo `.env.example`:

| Variável | Descrição | Exemplo Padrão |
| :--- | :--- | :--- |
| `PORT` | Porta HTTP em que o Express escutará | `3002` |
| `DB_HOST` | Host do PostgreSQL (IP local ou nome do serviço Docker) | `127.0.0.1` ou `moneycontrol-db` |
| `DB_PORT` | Porta de conexão com o PostgreSQL | `5433` (externa) / `5432` (interna) |
| `DB_NAME` | Nome da base de dados | `moneycontrol_db` |
| `DB_USER` | Usuário com menor privilégio da aplicação | `moneycontrol_user` |
| `DB_PASSWORD` | Senha do usuário da aplicação | `MoneyControlSeguro2026!` |
| `DB_ADMIN_USER` | Usuário admin (para scripts de migração/setup) | `postgres` |
| `DB_ADMIN_PASSWORD` | Senha administrativa | `AdminMasterDoceria2026!` |

---

## 7. Comandos Úteis do Docker

- **Verificar logs do banco de dados em tempo real**:
  ```bash
  docker logs -f moneycontrol-db
  ```
- **Verificar logs da aplicação**:
  ```bash
  docker logs -f moneycontrol-app
  ```
- **Acessar o terminal interativo do PostgreSQL dentro do contêiner**:
  ```bash
  docker exec -it moneycontrol-db psql -U moneycontrol_user -d moneycontrol_db
  ```
- **Fazer backup completo da base de dados (Dump)**:
  ```bash
  docker exec -t moneycontrol-db pg_dump -U postgres -d moneycontrol_db > backup_moneycontrol.sql
  ```
- **Restaurar um backup**:
  ```bash
  docker exec -i moneycontrol-db psql -U postgres -d moneycontrol_db < backup_moneycontrol.sql
  ```
- **Checar o status de saúde (Healthcheck) do contêiner**:
  ```bash
  docker inspect --format='{{json .State.Health.Status}}' moneycontrol-db
  ```

---

## 📄 Licença
Distribuído sob a licença ISC. Desenvolvido para uso pessoal e profissional.
