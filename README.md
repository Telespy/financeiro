# FinControl 💰 - Gestão Financeira Pessoal (PWA)

O **FinControl** é um aplicativo web progressivo (PWA) moderno, rápido e intuitivo para controle de gastos, receitas e orçamentos pessoais. Desenvolvido para funcionar perfeitamente em computadores e ser instalado na tela inicial de smartphones (Android e iOS).

![FinControl Banner](public/favicon.svg)

## 🚀 Funcionalidades

- **Dashboard Completo**: Visualização de Saldo no Mês, Total de Receitas (Ganhos), Total de Despesas (Gastos) e Taxa de Economia (%).
- **Gráficos Interativos**:
  - **Fluxo Diário de Caixa**: Acompanhamento diário de entradas vs saídas.
  - **Gastos por Categoria**: Gráfico de rosca dinâmico dividindo despesas por Alimentação, Moradia, Transporte, Lazer, Saúde, etc.
- **Metas de Orçamento por Categoria**: Alertas visuais e barras de progresso quando os gastos atingem 80% ou 100% da meta estabelecida.
- **Histórico & Filtros em Tempo Real**: Busca por descrição ou valor e filtros avançados por Tipo (Receita/Despesa), Categoria e Forma de Pagamento (PIX, Cartão de Crédito/Débito, Dinheiro).
- **Exportação para Excel (CSV) & JSON**: Baixe seus relatórios formatados para abrir no Microsoft Excel ou faça backup completo dos dados.
- **PWA (Progressive Web App)**: Funciona offline e permite instalação como app nativo no celular.
- **Design Moderno (Glassmorphic)**: Alternância entre Modo Escuro (Dark) e Modo Claro (Light).

---

## 🛠️ Tecnologias Utilizadas

- **React 19** & **Vite**
- **Chart.js** & **React-Chartjs-2** (Gráficos interativos)
- **Lucide React** (Ícones modernos)
- **Canvas-Confetti** (Animação de conquistas)
- **CSS Vanilla Moderno** (Design Glassmorphic e Variáveis CSS)
- **Web App Manifest & Service Worker** (Instalação PWA)

---

## 📱 Como Rodar Localmente

1. **Clonar o repositório**:
   ```bash
   git clone https://github.com/Telespy/financeiro.git
   cd financeiro
   ```

2. **Instalar as dependências**:
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev -- --host
   ```
   - Acesse no computador: `http://localhost:5173/`
   - Acesse no celular (mesmo Wi-Fi): `http://<seu-ip-local>:5173/`

4. **Gerar a versão de produção (Build)**:
   ```bash
   npm run build
   ```

---

## 📲 Como Instalar no Celular

- **Android (Google Chrome)**: Acesse o app no navegador, toque no menu de 3 pontos (`⋮`) e selecione **"Adicionar à Tela inicial"** ou **"Instalar aplicativo"**.
- **iPhone (Safari)**: Acesse o app no Safari, toque no ícone de **Compartilhar** (seta para cima) e escolha **"Adicionar à Tela de Início"**.

---

## 📄 Licença
Este projeto está sob a licença MIT. Sinta-se livre para usar e modificar!
