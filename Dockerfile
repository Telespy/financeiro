# ========================================================
# DOCKERFILE - MONEY CONTROL (OFICINA-FULLSTACK)
# Imagem Segura e Otimizada em Node.js Alpine
# Diretrizes: Menor Privilégio (Non-root user), Imagem Enxuta, Healthcheck
# ========================================================

FROM node:22-alpine

# Metadados
LABEL maintainer="Money Control Team"
LABEL description="Imagem de aplicação web do Money Control em container oficina-fullstack"

# Configura fuso horário Brasil/São Paulo
ENV TZ=America/Sao_Paulo
ENV NODE_ENV=production
ENV PORT=3002

# Instala curl / wget / tzdata para healthcheck e timezone
RUN apk add --no-cache tzdata

# Diretório de trabalho na aplicação
WORKDIR /app

# Copia manifestos de dependências primeiro (aproveitamento de cache de camadas)
COPY package*.json ./

# Instalação limpa apenas das dependências de produção
RUN npm ci --omit=dev

# Copia o código-fonte da aplicação
COPY . .

# Garante que os arquivos pertençam ao usuário não-privilegiado 'node'
RUN chown -R node:node /app

# Princípio de Menor Privilégio: Nunca rodar a aplicação como 'root'
USER node

# Porta de escuta da aplicação
EXPOSE 3002

# Healthcheck interno do container
HEALTHCHECK --interval=15s --timeout=5s --start-period=8s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/api/status || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
