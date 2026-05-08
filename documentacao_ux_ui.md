# VISÃO GERAL DO PRODUTO

* **Nome do produto:** CoreTracker
* **Resumo do sistema:** Aplicação web progressiva (PWA) focada no fortalecimento adaptativo do core. Utiliza um sistema inteligente e gamificado para gerenciar volume de treinos e dificuldade com base no feedback diário do usuário e seus níveis de dor lombar.
* **Objetivo principal:** Guiar a prática segura de fortalecimento da região central do corpo (core), prevenindo dores lombares e melhorando a performance por meio de um algoritmo de progressão.
* **Diferenciais:**
  * Algoritmo de Índice de Prontidão do Core (IPC).
  * Design refinado utilizando conceitos modernos de Glassmorphism e Neumorphism.
  * Gamificação leve (Streaks, Personal Records).
  * Funciona como um treinador virtual inteligente que adapta o nível automaticamente.
* **Público-alvo:** Desde iniciantes ou pessoas em reabilitação de dores lombares até usuários moderados/avançados que desejam melhorar a performance do core.

---

# CONCEITO DO PRODUTO

* **O que ele faz:** Fornece timers inteligentes para a prancha isométrica e um catálogo focado em exercícios para abdômen/lombar, controlando a carga e progressão de forma automatizada.
* **Como funciona:** O usuário preenche um onboarding definindo sua dor atual, experiência e objetivo. Baseado nisso, o sistema calcula metas diárias. Ao final de cada exercício, o usuário dá uma nota de feedback. O IPC cruza frequência, feedback e dor para determinar se a carga de treino no próximo dia deve aumentar, manter ou se o app deve focar apenas em exercícios de mobilidade e alívio (trava de dor).
* **Qual experiência ele entrega:** Um ecossistema de cuidado pessoal premium. A experiência é imersiva, direta e foca totalmente no bem-estar físico.
* **Sensação visual:** O design deve passar uma percepção de "tecnologia de ponta", saúde conectada, foco e fluidez.
* **Referências visuais sugeridas:** Interface de apps como Apple Fitness+, aplicativos de tracking esportivo em Dark Mode, interfaces cyberpunk sutis e dashboards analíticos de alta performance.

---

# MAPEAMENTO COMPLETO DAS TELAS

### 1. Onboarding (`/onboarding`)
* **Objetivo:** Coleta inicial de dados de saúde para calibrar o IPC.
* **Elementos:** Stepper de progresso; Slider de 1 a 10 para nível de dor lombar; Lista selecionável de objetivos (Alívio, Fortalecimento, Performance); Nível de experiência com prancha.
* **Componentes UI:** Inputs customizados (Slider/Range com gradiente), Stepper de progresso em barras, Cards de seleção com hover states e brilho direcional.
* **Estados:** Se dor lombar >= 7, um alerta de segurança aparece avisando sobre as limitações automáticas.

### 2. Login (`/login`)
* **Objetivo:** Autenticação e entrada no ecossistema via Supabase.
* **Elementos:** Logo customizada animada ("CoreIcon"), Toggle para alternar entre Login/Cadastro, Campos de Email/Senha, Botão principal, Botão de Social Login (Google).
* **Componentes UI:** Inputs translúcidos (Glassmorphism) com ícones em linha (Lucide React), Botão primário em gradiente (Amber), Animações de entrada (Framer Motion).
* **Comportamento:** Validações em tempo real e integração com backend cloud.

### 3. Home Dashboard (`/`)
* **Objetivo:** Visão geral e call-to-action principal diário.
* **Elementos:** Saudação baseada na hora do dia; Badge gamificado indicando a "Streak" (dias consecutivos); Treinos rápidos (Ícones 3D em vidro); Treino Sugerido (Cards de ação para Prancha Diária e Mobilidade/Core); Resumo rápido de volume da semana; Card em destaque detalhando a Prontidão do Core (IPC) com gráficos radiais e dica rápida.
* **Prioridade Visual:** A pontuação IPC e o botão "Treino Rápido" ganham total peso hierárquico na tela.

### 4. Cronômetro da Prancha (`/plank`)
* **Objetivo:** Interface de execução de treino isométrico.
* **Elementos:** Toggle de modo (Progresso vs Livre); Indicador de recorde pessoal (PR); Checklist retrátil de postura (animações checkmark); Timer central gigante em SVG com anel de progresso (Radial Progress); Controles de Player (Play/Pause, Stop, Refresh).
* **Estados:** Parado (com checklist à mostra); Executando (esconde checklist, altera cor); Finalizado (Apresenta modal de feedback).

### 5. Biblioteca de Exercícios (`/exercises`)
* **Objetivo:** Escolher e registrar exercícios focados no core.
* **Elementos:** Lista de exercícios vertical; Badges visuais indicando o impacto de cada um (Mobilidade, Baixo, Médio).
* **Ações Possíveis:** Ao clicar, um *Bottom Sheet* modal se eleva trazendo detalhes: checklist de execução passo a passo, dicas, e contadores (+ / -) de séries e repetições.
* **Comportamento esperado:** Bloqueio visual dinâmico (opacidade 50% e não-clicável) para exercícios intensos caso o usuário relate nível alto de dor.

### 6. Progresso e Métricas (`/progress`)
* **Objetivo:** Tangibilizar os resultados ao longo do tempo.
* **Elementos:** Dash principal (Streak, Recorde, Total de sessões); Toggle para volume (Semana/Mês); Gráfico de linha (Recharts) acompanhando o tempo na prancha; Gráfico de teia (RadarChart) de Equilíbrio Muscular; Heatmap estilo GitHub para consistência (últimos 28 dias).

### 7. Configurações (`/settings`)
* **Objetivo:** Gerenciar opções da conta e visibilidade do algorítmo IPC "under-the-hood".
* **Elementos:** Seção ultra-detalhada mostrando o cálculo do IPC (Escore de estabilidade, resposta e dor); Slider para alterar dor do dia; Ajuste de perfil; Zona de Perigo (limpeza de dados locais e cloud).

---

# FLUXO DO USUÁRIO

* **Jornada principal (Caminho Feliz):**
  1. Acessa app (Login/Onboarding se primeira vez).
  2. Verifica na Home seu índice IPC (O app diz se está liberado pra pegar pesado ou se deve focar em mobilidade).
  3. Acessa "Prancha" e atinge a meta calculada do dia.
  4. Finaliza a prancha e informa ao modal de feedback: "Senti-me ótimo".
  5. Vai a "Exercícios", registra duas séries de Crunch.
  6. Finaliza e vê o gráfico de progressão e *streak* diário contabilizados.
* **Experiência ideal:** Rápida, sem fricções, em 5 minutos o usuário treina e registra, sem sentir que é um "caderninho digital chato".
* **Pontos de abandono mitigados:** O app usa a estratégia de "Treino sugerido" na Home para poupar o usuário de pensar "o que fazer hoje".

---

# FUNCIONALIDADES

1. **Gestão de Perfil Adaptativo:** Pain level mutável impacta diretamente no bloqueio/desbloqueio de exercícios da biblioteca.
2. **Algoritmo IPC (Índice de Prontidão do Core):** Processamento matemático (ecs + ere + dorInversa) para sugerir avançar, manter ou regredir de fase lombar automaticamente.
3. **Timer de Prancha Inteligente:** Sugere um tempo alvo (TargetTime) com base no histórico (incrementos de 5s a 15s dependendo da experiência).
4. **Armazenamento Híbrido:** LocalStorage (rapidez e offline) + Supabase (Nuvem).
5. **Dashboard Analytics:** Gráficos com biblioteca visual customizada e *Heatmap* dinâmico.
6. **Sistema de Componentes de "Dock"**: Barra de navegação inferior estilo iOS/macOS com efeito de ampliação (magnification).
7. **Gamificação com Checklist Animado:** Interações prazerosas ao marcar *checkboxes* de exercícios/posturas.

---

# DESIGN SYSTEM SUGERIDO

Para recriar ou evoluir a UI/UX, a equipe de design deve considerar:

* **Estilo Visual:** Neumorfismo misturado com Glassmorphism. Fundo escuro para não ofuscar o usuário durante exercícios noturnos ou deitado.
* **Tipografia:** `Inter` da Google Fonts, usando pesos de 300 (light) a 800 (extrabold) para hierarquia visual estrita.
* **Espaçamentos e Layout:** Mobile-First agressivo. Limite de largura de tela de `430px` (largura máxima do iPhone Pro Max). Bordas extremamente redondas (`2xl = 1rem` e `3xl = 1.5rem`).
* **Sistema de Cores:**
  * Fundos: `#0F0F14` (Background Principal), `#1A1A24` (Cards/Superfícies).
  * Acentos e Call-to-actions:
    * **Âmbar/Laranja (`#F59E0B` a `#F97316`)**: Cor primária, intensidade, prancha, calor.
    * **Ciano/Teal (`#14B8A6` a `#06B6D4`)**: Cor secundária, exercícios técnicos e controle.
    * **Vermelho/Perigo (`#EF4444`)**: Erros, travas de segurança e dor elevada.
* **Motion / Animações:** Essencial. Componentes não devem apenas aparecer; eles devem usar animações de mola (*spring*) e desfoque. Elementos flutuam.
* **Orbes Ambientais:** Detalhe visual crucial da marca. O background não é sólido; possui gradientes ovais super-desfocados que se movimentam de forma orgânica no fundo.

---

# ANÁLISE UX E MELHORIAS SUGERIDAS

* **Problema:** Ao registrar uma prancha, a transição entre fechar o relógio e abrir o Modal de Feedback é abrupta.
  * *Melhoria:* O modal pode deslizar para cima integrando-se organicamente assim que o botão *Parar* for pressionado.
* **Ajuste de Usabilidade:** O "Botão Dock" de navegação, embora muito bonito e com efeito 'macOS', pode ser difícil de mirar durante um exercício ou em movimento. Uma navegação bottom tradicional com *hitboxes* maiores seria mais ergonômica e acessível.
* **Melhorias de Fluxo:** Implementar rotinas completas (*Workouts*) com reprodução automática em sequência, onde o usuário inicia uma rotina que já integra a Prancha e mais 2 ou 3 exercícios sem precisar clicar em nada na transição.
* **Feedbacks Visuais e Audíveis:** Como o app lida com cronômetro de exercício, bipes sonoros (ao faltar 10 segundos para meta ou ao finalizar) são fundamentais e atualmente não estão aparentes.

---

# 🚀 ENTREGA PARA O TIME DE DESIGN

### O que precisa ser criado / estruturado no Figma
A equipe deve iniciar criando os "Tokens" e "Atmosfera" visual, não comece desenhando as telas soltas.

1. **Atmosfera Global:**
   * Crie o Background `#0F0F14`.
   * Crie o componente "Ambient Orb": Círculos desfocados (`Blur: 80-100px`) com cores Âmbar e Ciano nas bordas do viewport.
2. **Componentização Base (Library):**
   * **Glass Card:** Preenchimento: `Branco 5%` ou `#1A1A24` em `60%`. Blur (Backdrop): `20px`. Borda interna: `Branco 5%`. Sombra paralela: `Y: 8px, Blur: 32px, 30% Opacidade`.
   * **Badges de Impacto:** (Verde = Mobilidade, Amarelo = Baixo, Vermelho = Médio). Texto pequeno `10px` e maiúsculo.
   * **Custom Sliders:** Range de dor.
   * **Bottom Sheets Modais:** Cartões que sobem de baixo para interações de exercícios e feedback.
3. **Ordem de Prioridade de Desenho (Figma):**
   1. Dashboard (Home) - Para cravar o Key Visual.
   2. Timer Isométrico (Prancha) - O coração funcional.
   3. Library / Lista (Exercícios).
   4. Charts & Analytics (Progresso).
   5. Modais de Componentes (Feedback, Cadastro, Alerts).

### Sugestões Estratégicas
* Projetem sempre pensando em componentes escuros. Evitem fundos opacos e chapados. O charme desta UI é a translucidez (Glassmorphism).
* Não usem as fontes padrões dos navegadores (Arial, Helvetica). Importem `Inter` e brinquem bastante com os pesos `Medium (500)` para descrições e `ExtraBold (800)` para os Call-to-actions principais.
* A UX deve transmitir que o App "cuida" da pessoa, logo, o peso da "Dor Lombar" na tela não deve parecer um alarme vermelho agressivo e punitivo, mas sim informativo, como um colete de segurança. O uso do Glass Card ajuda a suavizar isso.
