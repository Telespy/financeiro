# ========================================================
# DOCKERFILE - BANCO DE DADOS MONEY CONTROL
# Base: PostgreSQL 16 Alpine (Otimizado, Leve e Seguro)
# ========================================================

FROM postgres:16-alpine

LABEL maintainer="Money Control Team"
LABEL description="Imagem segura de banco de dados para o sistema Money Control"

# Configuração de Fuso Horário Brasil/São Paulo
ENV TZ=America/Sao_Paulo

# Copia os scripts de inicialização segura
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Healthcheck interno para monitoramento contínuo de integridade
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD pg_isready -U postgres -d moneycontrol_db || exit 1

EXPOSE 5432
