/* =============================================
   LEITOR MARKDOWN — Script Principal
   =============================================
   Aplicação vanilla JavaScript para renderização
   de Markdown em tempo real.

    Organização:
    1. Configuração
    2. Gerenciamento de Estado
    3. Referências do DOM
    4. Inicialização
    5. Pipeline de Renderização
    6. Renderização KaTeX (matemática)
    7. Renderização Mermaid (diagramas)
    8. Melhoria de Blocos de Código
    9. Operações de Arquivo
    10. Operações de Área de Transferência
    11. Exportação
    12. Estatísticas
    13. Notificações Toast
    14. Manipuladores de Eventos
    15. Drag and Drop
    16. Utilitários
    17. Modo Foco
    18. Redimensionamento de Painéis
    19. Inicialização da Aplicação
============================================= */


/* =============================================
   1. CONFIGURAÇÃO
   =============================================
   Constantes e configurações globais da aplicação.
   Centralizar facilita manutenção e ajustes.
============================================= */

/** Configurações do parser Marked */
const MARKED_OPTIONS = {
    gfm: true,          // GitHub Flavored Markdown: tabelas, task lists, strikethrough
    breaks: false,      // Quebras de linha normais (não inserir <br> automático)
    pedantic: false,    // Não ser estritamente compatível com Markdown original
    smartypants: true,  // Aspas inteligentes e travessões tipográficos
};

/** Configuração de sanitização DOMPurify — whitelist de tags e atributos permitidos */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6',
        'p','br','hr',
        'ul','ol','li',
        'a','img','figure','figcaption',
        'blockquote','pre','code','span','div','button','code-header',
        'table','thead','tbody','tr','th','td',
        'strong','em','del','sup','sub',
        'input',        // Para checkboxes de task lists
        'details','summary',
        'dl','dt','dd',
        'mark','abbr','ins',
        'section','article','aside','nav',
        'svg','path','polyline','line','circle','rect', // Para Mermaid
        'pre',
    ],
    ALLOWED_ATTR: [
        'href','src','alt','title','width','height',
        'class','id','type','checked','disabled',
        'target','rel','colspan','rowspan',
        'start','value','open',
        'viewBox','fill','stroke','stroke-width',
        'stroke-linecap','stroke-linejoin','d',
        'points','cx','cy','r','x','y','rx','ry',
    ],
    ALLOW_DATA_ATTR: true,    // Permitir data-* (usado internamente para data-math do KaTeX)
    ADD_ATTR: ['target'],     // Permitir target="_blank" em links
};

/** Configuração do Highlight.js */
const HIGHLIGHT_OPTIONS = {
    ignoreIllegals: true,     // Não parar em código malformado
    throwOnError: false,      // Não lançar erros de highlight
};

/** Configuração do Mermaid — tema claro WCAG AA+ */
const MERMAID_LIGHT_CONFIG = {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    themeVariables: {
        // === GERAL ===
        darkMode: false,
        background: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',

        // === CORES BASE (usadas por nós, atores, classes etc.) ===
        primaryColor: '#2563eb',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#1e40af',
        secondaryColor: '#eff6ff',
        secondaryTextColor: '#1e3a5f',
        secondaryBorderColor: '#93c5fd',
        tertiaryColor: '#f8fafc',
        tertiaryTextColor: '#0f172a',
        tertiaryBorderColor: '#cbd5e1',
        lineColor: '#475569',
        textColor: '#0f172a',
        mainBkg: '#eff6ff',

        // === FLOWCHART ===
        nodeBorder: '#1e40af',
        nodeTextColor: '#0f172a',
        clusterBkg: '#f1f5f9',
        clusterBorder: '#94a3b8',
        defaultLinkColor: '#475569',
        titleColor: '#0f172a',
        edgeLabelBackground: '#ffffff',
        nodeBkg: '#dbeafe',

        // === SEQUENCE DIAGRAM ===
        actorBorder: '#1e40af',
        actorBkg: '#2563eb',
        actorTextColor: '#ffffff',
        actorLineColor: '#1e40af',
        labelBoxBkgColor: '#eff6ff',
        labelBoxBorderColor: '#93c5fd',
        labelTextColor: '#1e3a5f',
        signalColor: '#1e293b',
        signalTextColor: '#1e293b',
        loopTextColor: '#1e3a5f',
        activationBorderColor: '#2563eb',
        activationBkgColor: '#dbeafe',
        sequenceNumberColor: '#475569',

        // === NOTES ===
        noteBkgColor: '#fef9c3',
        noteTextColor: '#422006',
        noteBorderColor: '#eab308',

        // === CLASS DIAGRAM ===
        classText: '#0f172a',

        // === STATE DIAGRAM ===
        labelColor: '#0f172a',
        stateBkg: '#eff6ff',
        stateLabelColor: '#0f172a',
        stateBorder: '#1e40af',
        compositeBackground: '#f8fafc',
        altBackground: '#f1f5f9',
        compositeTitleBackground: '#dbeafe',
        compositeBorder: '#94a3b8',
        innerEndBackground: '#ffffff',
        specialStateColor: '#1e40af',
        transitionColor: '#475569',
        transitionLabelColor: '#0f172a',

        // === ER DIAGRAM ===
        attributeBackgroundColorOdd: '#f8fafc',
        attributeBackgroundColorEven: '#f1f5f9',

        // === GANTT ===
        sectionBkgColor: '#eff6ff',
        sectionBkgColor2: '#dbeafe',
        altSectionBkgColor: '#f1f5f9',
        excludeBkgColor: '#fef2f2',
        taskBorderColor: '#2563eb',
        taskBkgColor: '#93c5fd',
        taskTextColor: '#0f172a',
        taskTextOutsideColor: '#475569',
        taskTextLightColor: '#64748b',
        taskTextDarkColor: '#0f172a',
        taskTextClickableColor: '#2563eb',
        activeTaskBorderColor: '#16a34a',
        activeTaskBkgColor: '#bbf7d0',
        doneTaskBorderColor: '#16a34a',
        doneTaskBkgColor: '#dcfce7',
        critBorderColor: '#dc2626',
        critBkgColor: '#fecaca',
        todayLineColor: '#dc2626',
        gridColor: '#e2e8f0',

        // === PIE ===
        pieTitleTextColor: '#0f172a',
        pieTitleTextSize: '16px',
        pieSectionTextSize: '14px',
        pieSectionTextColor: '#0f172a',
        pieLegendTextSize: '14px',
        pieLegendTextColor: '#0f172a',
        pieStrokeColor: '#475569',
        pieStrokeWidth: '2px',
        pieOuterStrokeWidth: '2px',
        pieOuterStrokeColor: '#475569',
        pieOpacity: '0.85',
        // Paleta de 12 cores para fatias (WCAG AA+ contra #fff fundo)
        pie1: '#2563eb', pie2: '#16a34a', pie3: '#dc2626',
        pie4: '#9333ea', pie5: '#d97706', pie6: '#0891b2',
        pie7: '#db2777', pie8: '#65a30d', pie9: '#0d9488',
        pie10: '#7c3aed', pie11: '#ea580c', pie12: '#0284c7',

        // === GIT GRAPH ===
        git0: '#2563eb', git1: '#16a34a', git2: '#dc2626',
        git3: '#9333ea', git4: '#d97706', git5: '#0891b2',
        git6: '#db2777', git7: '#65a30d',
        gitInv0: '#ffffff', gitInv1: '#ffffff',
        gitInv2: '#ffffff', gitInv3: '#ffffff',
        gitInv4: '#ffffff', gitInv5: '#ffffff',
        gitInv6: '#ffffff', gitInv7: '#ffffff',
        branchLabelColor: '#0f172a',
        gitBranchLabel0: '#ffffff', gitBranchLabel1: '#ffffff',
        gitBranchLabel2: '#ffffff', gitBranchLabel3: '#ffffff',
        gitBranchLabel4: '#ffffff', gitBranchLabel5: '#ffffff',
        gitBranchLabel6: '#ffffff', gitBranchLabel7: '#ffffff',
        tagLabelColor: '#ffffff',
        tagLabelBackground: '#2563eb',
        tagLabelBorder: '#1e40af',
        tagLabelFontSize: '12px',
        commitLabelColor: '#0f172a',
        commitLabelBackground: '#f1f5f9',
        commitLabelFontSize: '12px',

        // === JOURNEY ===
        personBorder: '#1e40af',
        personBkg: '#2563eb',
        rowOdd: '#f8fafc',
        rowEven: '#f1f5f9',

        // === REQUIREMENT ===
        requirementBackground: '#eff6ff',
        requirementBorderColor: '#2563eb',
        requirementBorderSize: '1',
        requirementTextColor: '#0f172a',
        relationColor: '#475569',
        relationLabelBackground: '#ffffff',
        relationLabelColor: '#0f172a',

        // === C4 ===
        cScale0: '#2563eb', cScale1: '#16a34a',
        cScale2: '#dc2626', cScale3: '#9333ea',
        cScale4: '#d97706', cScale5: '#0891b2',
        cScale6: '#db2777', cScale7: '#65a30d',
        cScale8: '#7c3aed', cScale9: '#ea580c',
        cScale10: '#0284c7', cScale11: '#0d9488',

        // === QUADRANT ===
        quadrant1Fill: '#dbeafe', quadrant2Fill: '#dcfce7',
        quadrant3Fill: '#fef9c3', quadrant4Fill: '#fce7f3',
        quadrant1TextFill: '#1e3a5f', quadrant2TextFill: '#052e16',
        quadrant3TextFill: '#422006', quadrant4TextFill: '#831843',
        quadrantPointFill: '#2563eb',
        quadrantPointTextFill: '#ffffff',
        quadrantXAxisTextFill: '#0f172a',
        quadrantYAxisTextFill: '#0f172a',
        quadrantInternalBorderStrokeFill: '#94a3b8',
        quadrantExternalBorderStrokeFill: '#475569',
        quadrantTitleFill: '#0f172a',

        // === XY CHART ===
        xyChart: '#ffffff',

        // === ESCALA ===
        scaleLabelColor: '#0f172a',

        // === BORDAS ===
        border2: '#64748b',
        arrowheadColor: '#475569',
        edgeLabelBackground: '#ffffff',

        // === ERROS ===
        errorBkgColor: '#fef2f2',
        errorTextColor: '#dc2626',

        // === ARQUITETURA ===
        archEdgeColor: '#475569',
        archEdgeArrowColor: '#475569',
        archEdgeWidth: '2',
        archGroupBorderColor: '#94a3b8',
        archGroupBorderWidth: '2',

        // === RADAR ===
        radar: '#ffffff',

        // === MISC ===
        fillType0: '#eff6ff', fillType1: '#dbeafe',
        fillType2: '#bfdbfe', fillType3: '#93c5fd',
        fillType4: '#60a5fa', fillType5: '#3b82f6',
        fillType6: '#2563eb', fillType7: '#1d4ed8',
        labelBackgroundColor: '#ffffff',
    },
};

/** Configuração Mermaid para tema escuro — WCAG AA+ */
const MERMAID_DARK_CONFIG = {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    themeVariables: {
        // === GERAL ===
        darkMode: true,
        background: '#0f172a',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',

        // === CORES BASE ===
        primaryColor: '#3b82f6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#60a5fa',
        secondaryColor: '#1e293b',
        secondaryTextColor: '#e2e8f0',
        secondaryBorderColor: '#475569',
        tertiaryColor: '#334155',
        tertiaryTextColor: '#f1f5f9',
        tertiaryBorderColor: '#64748b',
        lineColor: '#94a3b8',
        textColor: '#f1f5f9',
        mainBkg: '#1e3a5f',

        // === FLOWCHART ===
        nodeBorder: '#60a5fa',
        nodeTextColor: '#f1f5f9',
        clusterBkg: '#1e293b',
        clusterBorder: '#475569',
        defaultLinkColor: '#94a3b8',
        titleColor: '#f1f5f9',
        edgeLabelBackground: '#1e293b',
        nodeBkg: '#1e3a5f',

        // === SEQUENCE DIAGRAM ===
        actorBorder: '#60a5fa',
        actorBkg: '#3b82f6',
        actorTextColor: '#ffffff',
        actorLineColor: '#60a5fa',
        labelBoxBkgColor: '#1e293b',
        labelBoxBorderColor: '#475569',
        labelTextColor: '#e2e8f0',
        signalColor: '#f1f5f9',
        signalTextColor: '#f1f5f9',
        loopTextColor: '#e2e8f0',
        activationBorderColor: '#60a5fa',
        activationBkgColor: '#1e3a5f',
        sequenceNumberColor: '#94a3b8',

        // === NOTES ===
        noteBkgColor: '#422006',
        noteTextColor: '#fef9c3',
        noteBorderColor: '#eab308',

        // === CLASS DIAGRAM ===
        classText: '#f1f5f9',

        // === STATE DIAGRAM ===
        labelColor: '#f1f5f9',
        stateBkg: '#1e293b',
        stateLabelColor: '#f1f5f9',
        stateBorder: '#60a5fa',
        compositeBackground: '#0f172a',
        altBackground: '#1e293b',
        compositeTitleBackground: '#1e3a5f',
        compositeBorder: '#475569',
        innerEndBackground: '#0f172a',
        specialStateColor: '#60a5fa',
        transitionColor: '#94a3b8',
        transitionLabelColor: '#f1f5f9',

        // === ER DIAGRAM ===
        attributeBackgroundColorOdd: '#1e293b',
        attributeBackgroundColorEven: '#334155',

        // === GANTT ===
        sectionBkgColor: '#1e293b',
        sectionBkgColor2: '#1e3a5f',
        altSectionBkgColor: '#334155',
        excludeBkgColor: '#3b1a1a',
        taskBorderColor: '#3b82f6',
        taskBkgColor: '#1e40af',
        taskTextColor: '#f1f5f9',
        taskTextOutsideColor: '#94a3b8',
        taskTextLightColor: '#64748b',
        taskTextDarkColor: '#f1f5f9',
        taskTextClickableColor: '#60a5fa',
        activeTaskBorderColor: '#22c55e',
        activeTaskBkgColor: '#14532d',
        doneTaskBorderColor: '#22c55e',
        doneTaskBkgColor: '#052e16',
        critBorderColor: '#ef4444',
        critBkgColor: '#450a0a',
        todayLineColor: '#ef4444',
        gridColor: '#334155',

        // === PIE ===
        pieTitleTextColor: '#f1f5f9',
        pieTitleTextSize: '16px',
        pieSectionTextSize: '14px',
        pieSectionTextColor: '#ffffff',
        pieLegendTextSize: '14px',
        pieLegendTextColor: '#e2e8f0',
        pieStrokeColor: '#64748b',
        pieStrokeWidth: '2px',
        pieOuterStrokeWidth: '2px',
        pieOuterStrokeColor: '#64748b',
        pieOpacity: '0.85',
        pie1: '#3b82f6', pie2: '#22c55e', pie3: '#ef4444',
        pie4: '#a855f7', pie5: '#f59e0b', pie6: '#06b6d4',
        pie7: '#ec4899', pie8: '#84cc16', pie9: '#14b8a6',
        pie10: '#8b5cf6', pie11: '#f97316', pie12: '#0ea5e9',

        // === GIT GRAPH ===
        git0: '#3b82f6', git1: '#22c55e', git2: '#ef4444',
        git3: '#a855f7', git4: '#f59e0b', git5: '#06b6d4',
        git6: '#ec4899', git7: '#84cc16',
        gitInv0: '#0f172a', gitInv1: '#0f172a',
        gitInv2: '#0f172a', gitInv3: '#0f172a',
        gitInv4: '#0f172a', gitInv5: '#0f172a',
        gitInv6: '#0f172a', gitInv7: '#0f172a',
        branchLabelColor: '#f1f5f9',
        gitBranchLabel0: '#ffffff', gitBranchLabel1: '#ffffff',
        gitBranchLabel2: '#ffffff', gitBranchLabel3: '#ffffff',
        gitBranchLabel4: '#ffffff', gitBranchLabel5: '#ffffff',
        gitBranchLabel6: '#ffffff', gitBranchLabel7: '#ffffff',
        tagLabelColor: '#ffffff',
        tagLabelBackground: '#3b82f6',
        tagLabelBorder: '#60a5fa',
        tagLabelFontSize: '12px',
        commitLabelColor: '#f1f5f9',
        commitLabelBackground: '#334155',
        commitLabelFontSize: '12px',

        // === JOURNEY ===
        personBorder: '#60a5fa',
        personBkg: '#3b82f6',
        rowOdd: '#1e293b',
        rowEven: '#334155',

        // === REQUIREMENT ===
        requirementBackground: '#1e293b',
        requirementBorderColor: '#3b82f6',
        requirementBorderSize: '1',
        requirementTextColor: '#f1f5f9',
        relationColor: '#94a3b8',
        relationLabelBackground: '#1e293b',
        relationLabelColor: '#f1f5f9',

        // === C4 ===
        cScale0: '#3b82f6', cScale1: '#22c55e',
        cScale2: '#ef4444', cScale3: '#a855f7',
        cScale4: '#f59e0b', cScale5: '#06b6d4',
        cScale6: '#ec4899', cScale7: '#84cc16',
        cScale8: '#8b5cf6', cScale9: '#f97316',
        cScale10: '#0ea5e9', cScale11: '#14b8a6',

        // === QUADRANT ===
        quadrant1Fill: '#1e3a5f', quadrant2Fill: '#14532d',
        quadrant3Fill: '#422006', quadrant4Fill: '#3b1e32',
        quadrant1TextFill: '#bfdbfe', quadrant2TextFill: '#bbf7d0',
        quadrant3TextFill: '#fef08a', quadrant4TextFill: '#fbcfe8',
        quadrantPointFill: '#3b82f6',
        quadrantPointTextFill: '#ffffff',
        quadrantXAxisTextFill: '#e2e8f0',
        quadrantYAxisTextFill: '#e2e8f0',
        quadrantInternalBorderStrokeFill: '#475569',
        quadrantExternalBorderStrokeFill: '#64748b',
        quadrantTitleFill: '#f1f5f9',

        // === XY CHART ===
        xyChart: '#0f172a',

        // === ESCALA ===
        scaleLabelColor: '#f1f5f9',

        // === BORDAS ===
        border2: '#64748b',
        arrowheadColor: '#94a3b8',
        edgeLabelBackground: '#1e293b',

        // === ERROS ===
        errorBkgColor: '#3b1a1a',
        errorTextColor: '#fca5a5',

        // === ARQUITETURA ===
        archEdgeColor: '#94a3b8',
        archEdgeArrowColor: '#94a3b8',
        archEdgeWidth: '2',
        archGroupBorderColor: '#475569',
        archGroupBorderWidth: '2',

        // === RADAR ===
        radar: '#0f172a',

        // === MISC ===
        fillType0: '#1e293b', fillType1: '#1e3a5f',
        fillType2: '#1e40af', fillType3: '#1d4ed8',
        fillType4: '#2563eb', fillType5: '#3b82f6',
        fillType6: '#60a5fa', fillType7: '#93c5fd',
        labelBackgroundColor: '#0f172a',
    },
};

/** Velocidade de debounce para input (ms) — previne rendering excessivo */
const DEBOUNCE_DELAY = 150;

/** Velocidade média de leitura (palavras por minuto) */
const READING_SPEED_WPM = 200;


/* =============================================
   2. GERENCIAMENTO DE ESTADO
   =============================================
   Estado centralizado da aplicação.
   Facilita debug e persistência.
============================================= */

/** Estado global da aplicação */
const state = {
    /** Conteúdo Markdown atual no editor */
    markdown: '',

    /** Se o wrap de texto está ativado no editor */
    wordWrap: false,

    /** ID do timeout de debounce para evitar múltiplas renderizações */
    renderTimeout: null,

    /** Se a biblioteca Mermaid já foi inicializada */
    mermaidInitialized: false,

    /** Geração da renderização Mermaid (evita promises órfãs) */
    mermaidRenderGen: 0,

    /** Chave do localStorage para persistência */
    STORAGE_KEY: 'leitor_md_content',

    /** Tema atual (light/dark) */
    theme: 'light',

    /** Nome do arquivo aberto (null se nenhum) */
    fileName: null,

    /** Conteúdo anterior ao último "limpar" (para desfazer) */
    lastClearedContent: null,

    /** Se o scroll sync está ativo */
    scrollSyncActive: true,

    /** ID do requestAnimationFrame pendente */
    rafPending: null,

    /** Chave do localStorage para o tema */
    THEME_KEY: 'leitor_md_theme',

    /** Se o painel está sendo redimensionado */
    isResizing: false,

    /** Posição X inicial do mouse durante redimensionamento */
    resizeStartX: 0,

    /** Proporção inicial do editor durante redimensionamento (0-1) */
    resizeStartRatio: 0.5,

    /** Chave do localStorage para proporção dos painéis */
    PANEL_RATIO_KEY: 'leitor_md_panel_ratio',

    /** Se a proporção dos painéis já foi carregada */
    panelRatioLoaded: false,

    /** Timeout para salvar no localStorage */
    storageTimeout: null,

    /** Estado do modo foco: 'both' | 'editor' | 'preview' */
    focusMode: 'both',

    /** Chave do localStorage para modo foco */
    FOCUS_MODE_KEY: 'leitor_md_focus',

    /** Lock para evitar loop infinito no scroll sync */
    scrollSyncLock: false,
};


/* =============================================
   3. REFERÊNCIAS DO DOM
   =============================================
   Cache de elementos DOM frequentemente acessados.
   Evita buscas repetidas no DOM (querySelector).
============================================= */

/** Objeto com todas as referências DOM necessárias */
const DOM = {
    editor: document.getElementById('editor'),
    editorWrap: document.getElementById('editorWrap'),
    preview: document.getElementById('preview'),
    fileInput: document.getElementById('fileInput'),
    btnOpen: document.getElementById('btnOpen'),
    btnCopyMd: document.getElementById('btnCopyMd'),
    btnSave: document.getElementById('btnSave'),
    btnClear: document.getElementById('btnClear'),
    btnUndo: document.getElementById('btnUndo'),
    btnCopyHtml: document.getElementById('btnCopyHtml'),
    btnExport: document.getElementById('btnExport'),
    btnExportPdf: document.getElementById('btnExportPdf'),
    btnWrap: document.getElementById('btnWrap'),
    btnTheme: document.getElementById('btnTheme'),
    themeIconLight: document.getElementById('themeIconLight'),
    themeIconDark: document.getElementById('themeIconDark'),
    fileIndicator: document.getElementById('fileIndicator'),
    fileName: document.getElementById('fileName'),
    dragOverlay: document.getElementById('dragOverlay'),
    scrollTopBtn: document.getElementById('scrollTopBtn'),
    btnFocus: document.getElementById('btnFocus'),
    btnExpandEditor: document.getElementById('btnExpandEditor'),
    btnExpandPreview: document.getElementById('btnExpandPreview'),
    wordCount: document.getElementById('wordCount'),
    charCount: document.getElementById('charCount'),
    lineCount: document.getElementById('lineCount'),
    readTime: document.getElementById('readTime'),
    statusIndicator: document.getElementById('statusIndicator'),
    divider: document.querySelector('.divider'),
    editorPanel: document.querySelector('.editor-panel'),
    previewPanel: document.querySelector('.preview-panel'),
    main: document.querySelector('.main'),
};


/* =============================================
   4. INICIALIZAÇÃO
   =============================================
   Ponto de entrada da aplicação.
   Configura o parser, eventos e estado inicial.
============================================= */

/**
 * Inicializa toda a aplicação.
 * Executa quando o DOM está pronto.
 */
function initApp() {
    // Configura o parser Markdown com as opções definidas
    setupMarked();

    // Configura o Mermaid (lazy — só quando necessário)
    setupMermaid();

    // Conecta todos os event listeners aos elementos
    setupEventListeners();

    // Configura redimensionamento dos painéis
    setupPanelResize();

    // Carrega tema salvo
    loadTheme();

    // Carrega modo foco salvo
    loadFocusMode();

    // Inicializa ícones de expandir
    updateExpandIcons();

    // Carrega conteúdo salvo anteriormente (se existir)
    loadSavedContent();

    // Calcula estatísticas iniciais (também atualiza estados dos botões)
    updateStats();
}

/**
 * Configura o parser Markdown (marked.js).
 * Personaliza a renderização de código e configura sanitização.
 */
function setupMarked() {
    // Verificar se marked está disponível (carregado via CDN)
    if (typeof marked === 'undefined') {
        console.error('[Init] marked.js não está carregado.');
        return;
    }

    // Configurar opções do marked
    marked.setOptions(MARKED_OPTIONS);

    /**
     * Sobrescrever o renderer padrão para blocos de código.
     * Isso permite adicionar cabeçalho com linguagem e botão de copiar.
     */
    const renderer = new marked.Renderer();

    /**
     * Renderer customizado para blocos de código.
     * Gera HTML com cabeçalho (nome da linguagem + botão copiar)
     * e o bloco de código com syntax highlighting.
     */
    renderer.code = function ({ text, lang }) {
        // Se for bloco Mermaid, NÃO aplicar highlight — Mermaid renderiza separadamente
        if (lang === 'mermaid') {
            return `<pre><code class="language-mermaid">${escapeHtml(text)}</code></pre>\n`;
        }

        // Determinar a linguagem para highlight
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';

        // Aplicar syntax highlighting via highlight.js
        let highlighted;
        try {
            highlighted = hljs.highlight(text, { language, ...HIGHLIGHT_OPTIONS }).value;
        } catch {
            // Fallback: código sem highlighting
            highlighted = escapeHtml(text);
        }

        // Gerar HTML do code block com cabeçalho
        // NOTA: onclick não é usado porque DOMPurify o remove por segurança.
        // O event listener é adicionado via delegação no container do preview.
        const langLabel = lang || 'code';
        return `<pre><code-header><span>${escapeHtml(langLabel)}</span><button class="copy-btn" title="Copiar código"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copiar</button></code-header><code class="hljs language-${escapeHtml(langLabel)}">${highlighted}</code></pre>\n`;
    };

    // Aplicar o renderer customizado
    marked.use({ renderer });
}


/* =============================================
   5. PIPELINE DE RENDERIZAÇÃO
   =============================================
   Fluxo completo de conversão:
   Markdown → (preprocess) → marked → DOMPurify → (postprocess) → DOM

   Cada etapa é uma função pura e testável.
============================================= */

/**
 * Função principal de renderização.
 * Executa o pipeline completo de conversão Markdown → HTML.
 *
 * Pipeline:
 * 1. Preprocessamento (KaTeX: $...$ e $$...$$)
 * 2. Parse com marked.js
 * 3. Sanitização com DOMPurify
 * 4. Pós-processamento (KaTeX render, Mermaid render)
 * 5. Inserção no DOM
 */
function renderMarkdown() {
    const markdown = state.markdown;

    // Se vazio, mostrar estado vazio
    if (!markdown.trim()) {
        showEmptyState();
        return;
    }

    try {
        // Atualizar indicador de status
        setStatus('rendering', 'Renderizando...');

        // Etapa 1: Preprocessar matemática ($$ e $)
        const preprocessed = preprocessMath(markdown);

        // Etapa 2: Parse Markdown para HTML
        const rawHtml = marked.parse(preprocessed);

        // Etapa 3: Sanitizar HTML (prevenir XSS)
        const cleanHtml = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);

        // Etapa 4: Inserir no DOM
        DOM.preview.innerHTML = cleanHtml;
        DOM.preview.classList.add('has-content');

        // Etapa 5: Pós-processar — renderizar KaTeX e Mermaid
        renderKaTeXBlocks();
        renderMermaidDiagrams();
        enhanceCodeBlocks();

        // Atualizar status para "pronto"
        setStatus('saved', 'Pronto');
    } catch (error) {
        // Em caso de erro, mostrar mensagem amigável
        console.error('[Render] Erro:', error);
        DOM.preview.innerHTML = `<div class="render-error"><strong>Erro ao renderizar:</strong><br>${escapeHtml(error.message)}</div>`;
        DOM.preview.classList.add('has-content');
        setStatus('error', 'Erro');
    }
}

/**
 * Mostra o estado vazio no preview (quando não há conteúdo).
 */
function showEmptyState() {
    DOM.preview.innerHTML = `
        <div class="preview-empty">
            <div class="preview-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <p class="preview-empty-title">Nenhum conteúdo para exibir</p>
            <p class="preview-empty-text">
                Digite Markdown no painel esquerdo,<br>
                cole conteúdo ou arraste um arquivo <code>.md</code>
            </p>
        </div>`;
    DOM.preview.classList.remove('has-content');
}


/* =============================================
   6. RENDERIZAÇÃO KATEX (FÓRMULAS MATEMÁTICAS)
   =============================================
   Suporte a LaTeX via KaTeX.
   Sintaxe suportada:
   - Display: $$公式$$
   - Inline: $公式$
============================================= */

/**
 * Preprocessa o Markdown para proteger expressões matemáticas.
 * Substitui $...$ e $$...$$ por placeholders HTML que o marked
 * não vai processar como Markdown.
 *
 * @param {string} markdown - Markdown bruto
 * @returns {string} Markdown com placeholders de matemática
 */
function preprocessMath(markdown) {
    let result = markdown;

    // Passo 1: Substituir display math ($$...$$) por placeholders
    // Regex: $$ seguido de qualquer coisa (não-guloso) até $$
    result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        return `<span class="math-display" data-math="${escapeAttr(math.trim())}"></span>`;
    });

    // Passo 2: Substituir inline math ($...$) por placeholders
    // Regex: $ seguido de caracteres não-$ até $
    // Não captura $$ (já processado) nem $ solitário
    result = result.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, math) => {
        return `<span class="math-inline" data-math="${escapeAttr(math.trim())}"></span>`;
    });

    return result;
}

/**
 * Renderiza todas as fórmulas matemáticas KaTeX no DOM.
 * Busca elementos com classes math-display e math-inline.
 */
function renderKaTeXBlocks() {
    // Verificar se KaTeX está disponível
    if (typeof katex === 'undefined') return;

    // Renderizar fórmulas de exibição (display)
    DOM.preview.querySelectorAll('.math-display').forEach(el => {
        try {
            katex.render(el.dataset.math, el, {
                displayMode: true,     // Modo display (centralizado, maior)
                throwOnError: false,  // Não lançar erros — mostrar fallback
                trust: true,          // Confiar no conteúdo (é do usuário)
            });
        } catch (err) {
            // Em caso de erro, mostrar a fórmula bruta com estilo de erro
            el.outerHTML = `<span class="math-error" title="${escapeAttr(err.message)}">${escapeHtml(el.dataset.math)}</span>`;
        }
    });

    // Renderizar fórmulas inline
    DOM.preview.querySelectorAll('.math-inline').forEach(el => {
        try {
            katex.render(el.dataset.math, el, {
                displayMode: false,    // Modo inline (no fluxo do texto)
                throwOnError: false,
                trust: true,
            });
        } catch (err) {
            el.outerHTML = `<span class="math-error" title="${escapeAttr(err.message)}">${escapeHtml(el.dataset.math)}</span>`;
        }
    });
}


/* =============================================
   7. RENDERIZAÇÃO MERMAID (DIAGRAMAS)
   =============================================
   Suporte a diagramas Mermaid.js.
   Detecta code blocks com classe "mermaid"
   e renderiza como diagramas SVG.
============================================= */

/**
 * Configura a biblioteca Mermaid.
 * Executa uma vez na inicialização.
 */
function setupMermaid() {
    if (typeof mermaid === 'undefined') {
        console.warn('[Init] Mermaid.js não está carregado. Diagramas não serão renderizados.');
        return;
    }

    // Usar configuração baseada no tema atual
    const config = state.theme === 'dark' ? MERMAID_DARK_CONFIG : MERMAID_LIGHT_CONFIG;
    mermaid.initialize(config);
    state.mermaidInitialized = true;
}

/**
 * Re-inicializa o Mermaid com o tema correto.
 * Chamado quando o tema é alterado.
 */
function reinitializeMermaid() {
    if (typeof mermaid === 'undefined') return;

    const config = state.theme === 'dark' ? MERMAID_DARK_CONFIG : MERMAID_LIGHT_CONFIG;
    mermaid.initialize(config);
}

/**
 * Renderiza diagramas Mermaid no DOM.
 * Busca code blocks com classe "mermaid" e os converte em SVG.
 *
 * O Mermaid usa um ID único para cada diagrama,
 * por isso geramos IDs incrementais.
 */
async function renderMermaidDiagrams() {
    if (!state.mermaidInitialized) return;

    const currentGen = ++state.mermaidRenderGen;

    // Buscar todos os blocos de código Mermaid não renderizados
    const mermaidDivs = DOM.preview.querySelectorAll('code.language-mermaid, code.mermaid');

    let rendered = 0;
    for (const codeEl of mermaidDivs) {
        const preEl = codeEl.closest('pre');
        if (!preEl || preEl.dataset.mermaidRendered) continue;

        try {
            // Gerar ID único para este diagrama
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            // Renderizar o diagrama para SVG
            const { svg } = await mermaid.render(id, codeEl.textContent);

            // Se um novo render começou, abortar (evita promise órfã)
            if (state.mermaidRenderGen !== currentGen) return;

            // Criar container para o diagrama renderizado
            const container = document.createElement('div');
            container.className = 'mermaid';
            container.innerHTML = svg;

            // Substituir o <pre> pelo diagrama renderizado
            preEl.replaceWith(container);
            rendered++;

            // Atraso entre renderizações (bug conhecido no Mermaid 11.4+)
            // https://github.com/mermaid-js/mermaid/issues/6213
            if (rendered < mermaidDivs.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (state.mermaidRenderGen !== currentGen) return;
            }
        } catch (err) {
            // Em caso de erro, mostrar código fonte com estilo de aviso
            console.warn('[Mermaid] Erro ao renderizar:', err.message);
            preEl.innerHTML = `<div class="mermaid-error"><strong>Erro no diagrama Mermaid:</strong>\n${escapeHtml(codeEl.textContent)}</div>`;
            preEl.dataset.mermaidRendered = 'error';
        }
    }
}


/* =============================================
   8. MELHORIA DE BLOCOS DE CÓDIGO
   =============================================
   Adiciona funcionalidades extras aos blocos
   de código já renderizados pelo Highlight.js:
   - Botão de copiar código
   - Header com linguagem
============================================= */

/**
 * Melhora os blocos de código no preview.
 * (O renderer do marked já adiciona o header;
 * esta função garante que event listeners estejam OK.)
 */
function enhanceCodeBlocks() {
    // Os code blocks já são renderizados pelo renderer customizado do marked.
    // Esta função pode ser usada para melhorias adicionais pós-renderização.
}


/**
 * Copia o conteúdo de um bloco de código para a área de transferência.
 * Chamada pelo botão "Copiar" nos code blocks.
 *
 * @param {HTMLElement} button - O botão clicado
 */
function copyCodeBlock(button) {
    // Encontrar o <pre> pai e depois o <code> dentro dele
    const pre = button.closest('pre');
    if (!pre) return;

    const code = pre.querySelector('code');
    if (!code) return;

    // Copiar o texto puro (sem HTML) do código
    navigator.clipboard.writeText(code.textContent).then(() => {
        // Feedback visual: mudar texto do botão temporariamente
        const originalText = button.innerHTML;
        button.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado!';
        button.style.color = '#1e7e34';

        // Restaurar texto original após 2 segundos
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '';
        }, 2000);
    }).catch(() => {
        showToast('Falha ao copiar código', 'error');
    });
}


/* =============================================
   9. OPERAÇÕES DE ARQUIVO
   =============================================
   Abrir, salvar e arrastar arquivos .md.
============================================= */

/**
 * Abre um seletor de arquivo para escolher um arquivo .md.
 * O input de arquivo está escondido; este botão dispara seu click.
 */
function openFile() {
    DOM.fileInput.click();
}

/**
 * Processa o arquivo selecionado pelo input.
 * Lê o conteúdo e insere no editor.
 *
 * @param {Event} event - Evento change do input
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar extensão do arquivo
    const validExtensions = ['.md', '.markdown', '.txt'];
    const hasValidExtension = validExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
        showToast('Por favor, selecione um arquivo .md, .markdown ou .txt', 'warning');
        return;
    }

    // Ler o conteúdo do arquivo
    readFileContent(file);

    // Limpar o input para permitir reabrir o mesmo arquivo
    event.target.value = '';
}

/**
 * Lê o conteúdo de um arquivo usando FileReader.
 *
 * @param {File} file - Objeto File do navegador
 */
function readFileContent(file) {
    // Validar tamanho (limite de 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showToast('Arquivo muito grande (máximo 5MB)', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        // Inserir conteúdo no editor e renderizar
        DOM.editor.value = e.target.result;
        state.markdown = e.target.result;
        renderMarkdown();
        updateStats();
        saveToLocalStorage();
        showFileName(file.name);
        showToast(`Arquivo "${file.name}" carregado com sucesso`, 'success');
    };

    reader.onerror = () => {
        showToast('Erro ao ler o arquivo', 'error');
    };

    // Ler como texto UTF-8
    reader.readAsText(file, 'UTF-8');
}

/**
 * Salva o conteúdo Markdown como arquivo .md no computador do usuário.
 * Usa a API de download do navegador.
 */
function saveMarkdown() {
    const content = state.markdown;
    if (!content.trim()) {
        showToast('Nada para salvar', 'warning');
        return;
    }

    // Criar blob com o conteúdo
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Criar elemento <a> temporário para download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.md';
    document.body.appendChild(a);
    a.click();

    // Limpar recursos
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Arquivo salvo com sucesso', 'success');
}


/* =============================================
   10. OPERAÇÕES DE ÁREA DE TRANSFERÊNCIA
   =============================================
   Copiar Markdown bruto e HTML renderizado.
============================================= */

/**
 * Copia o Markdown bruto (texto original) para a área de transferência.
 */
function copyMarkdown() {
    const content = state.markdown;
    if (!content.trim()) {
        showToast('Nada para copiar', 'warning');
        return;
    }

    navigator.clipboard.writeText(content).then(() => {
        showToast('Markdown copiado para a área de transferência', 'success');
    }).catch(() => {
        showToast('Falha ao copiar Markdown', 'error');
    });
}

/**
 * Copia o HTML renderizado (já sanitizado) para a área de transferência.
 * Copia como texto puro para colar em outros editores.
 */
function copyHtml() {
    const content = state.markdown;
    if (!content.trim()) {
        showToast('Nada para copiar', 'warning');
        return;
    }

    try {
        // Gerar HTML sanitizado
        const preprocessed = preprocessMath(content);
        const rawHtml = marked.parse(preprocessed);
        const cleanHtml = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);

        navigator.clipboard.writeText(cleanHtml).then(() => {
            showToast('HTML copiado para a área de transferência', 'success');
        }).catch(() => {
            showToast('Falha ao copiar HTML', 'error');
        });
    } catch (error) {
        showToast('Erro ao gerar HTML: ' + error.message, 'error');
    }
}


/* =============================================
   11. EXPORTAÇÃO
   =============================================
   Exportar conteúdo como arquivo HTML completo
   com estilos embutidos para visualização offline.
============================================= */

/**
 * Exporta o Markdown renderizado como um arquivo HTML completo.
 * O HTML exportado inclui estilos embutidos para ser visualizado
 * independentemente, como um documento standalone.
 */
function exportHtml() {
    const content = state.markdown;
    if (!content.trim()) {
        showToast('Nada para exportar', 'warning');
        return;
    }

    try {
        // Gerar HTML sanitizado
        const preprocessed = preprocessMath(content);
        const rawHtml = marked.parse(preprocessed);
        const cleanHtml = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);

        // Montar documento HTML completo com estilos embutidos
        const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documento Exportado</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 24px;
            line-height: 1.7;
            color: #202124;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3; }
        h1 { font-size: 2em; border-bottom: 2px solid #e8eaed; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #e8eaed; padding-bottom: 0.25em; }
        p { margin-bottom: 1em; }
        a { color: #4285f4; text-decoration: none; }
        a:hover { text-decoration: underline; }
        img { max-width: 100%; border-radius: 8px; margin: 1em 0; }
        pre { background: #f6f8fa; border: 1px solid #e8eaed; border-radius: 8px; padding: 16px; overflow-x: auto; }
        code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
        :not(pre) > code { background: #f0f0f4; padding: 2px 6px; border-radius: 4px; color: #d63384; }
        blockquote { margin: 1em 0; padding: 12px 20px; border-left: 4px solid #4285f4; background: #e8f0fe; border-radius: 0 6px 6px 0; }
        table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        th, td { padding: 10px 16px; text-align: left; border: 1px solid #dadce0; }
        th { background: #f1f3f4; font-weight: 600; }
        hr { border: none; height: 2px; background: #e8eaed; margin: 2em 0; }
        ul, ol { margin-bottom: 1em; padding-left: 2em; }
        li { margin-bottom: 0.3em; }
        .math-block { text-align: center; margin: 1em 0; overflow-x: auto; }
        .mermaid { text-align: center; margin: 1em 0; }
    </style>
</head>
<body>
${cleanHtml}
<script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('code.language-mermaid').forEach(function(el){var p=el.closest('pre');if(!p)return;var d=document.createElement('div');d.className='mermaid';d.textContent=el.textContent;p.replaceWith(d)});mermaid.initialize({startOnLoad:false,theme:'default'});mermaid.run({querySelector:'.mermaid'})});<\/script>
</body>
</html>`;

        // Criar blob e download
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('HTML exportado com sucesso', 'success');
    } catch (error) {
        showToast('Erro ao exportar: ' + error.message, 'error');
    }
}


/* =============================================
    12. ESTATÍSTICAS
   =============================================
   Calcula e exibe:
   - Número de palavras
   - Número de caracteres
   - Número de linhas
   - Tempo estimado de leitura
============================================= */

/**
 * Atualiza todas as estatísticas do editor.
 * Chamada sempre que o conteúdo muda.
 */
function updateStats() {
    const text = state.markdown;

    // Contar palavras (dividir por espaços e filtrar vazios)
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    // Contar caracteres (com e sem espaços)
    const chars = text.length;

    // Contar linhas (dividir por quebra de linha)
    const lines = text ? text.split('\n').length : 0;

    // Calcular tempo estimado de leitura
    const readMinutes = Math.max(1, Math.ceil(words / READING_SPEED_WPM));

    // Atualizar elementos DOM
    DOM.wordCount.textContent = words.toLocaleString('pt-BR');
    DOM.charCount.textContent = chars.toLocaleString('pt-BR');
    DOM.lineCount.textContent = lines.toLocaleString('pt-BR');
    DOM.readTime.textContent = words === 0 ? '0' : readMinutes;

    // Atualizar estados disabled dos botões
    updateButtonStates();
}

/**
 * Atualiza o estado (disabled) dos botões conforme o conteúdo.
 * Botões de copy/export são desabilitados quando não há conteúdo.
 */
function updateButtonStates() {
    const hasContent = state.markdown.trim().length > 0;
    DOM.btnCopyMd.disabled = !hasContent;
    DOM.btnSave.disabled = !hasContent;
    DOM.btnCopyHtml.disabled = !hasContent;
    DOM.btnExport.disabled = !hasContent;
    if (DOM.btnExportPdf) DOM.btnExportPdf.disabled = !hasContent;
}

/**
 * Exporta o conteúdo renderizado como PDF usando a impressão do navegador.
 * O CSS @print já está configurado para otimizar a saída.
 */
function exportPdf() {
    if (!state.markdown.trim()) {
        showToast('Nada para exportar', 'warning');
        return;
    }

    // Fechar toast antes do print para não aparecer na impressão
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    window.print();
}


/* =============================================
    13. NOTIFICAÇÕES TOAST
   =============================================
    Sistema de notificações temporárias.
    Aparece na parte inferior da tela e
    desaparece automaticamente.
============================================= */

/** Duração em ms para cada tipo de toast */
const TOAST_DURATION = {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 2000,
};

/**
 * Exibe uma notificação toast na tela.
 * Overhaul: canto inferior direito, botão fechar, duração configurável.
 *
 * @param {string} message - Mensagem a ser exibida
 * @param {'success'|'error'|'warning'|'info'} type - Tipo da notificação
 */
function showToast(message, type = 'info') {
    // Remover toast anterior se existir (com animação de saída)
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.classList.remove('toast-enter');
        existingToast.classList.add('toast-exit');
        setTimeout(() => existingToast.remove(), 250);
    }

    // Ícones para cada tipo de toast
    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    };

    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Fechar notificação">&times;</button>
    `;

    // Botão fechar
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
    });

    document.body.appendChild(toast);

    // Duração configurável por tipo
    const duration = TOAST_DURATION[type] || 3000;
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 250);
        }
    }, duration);
}

/**
 * Exibe um toast com botão de desfazer.
 *
 * @param {string} message - Mensagem a ser exibida
 * @param {Function} onUndo - Callback chamado ao clicar em "Desfazer"
 */
function showToastWithUndo(message, onUndo) {
    // Remover toast anterior se existir
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-info toast-enter';

    toast.innerHTML = `
        <span class="toast-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg></span>
        <span>${escapeHtml(message)}</span>
        <button class="toast-close toast-undo-btn" style="background:rgba(255,255,255,0.15);border:none;color:white;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-sans);line-height:1">Desfazer</button>
        <button class="toast-close" aria-label="Fechar notificação">&times;</button>
    `;

    toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
        onUndo();
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
    });

    toast.querySelectorAll('.toast-close')[1].addEventListener('click', () => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
    });

    document.body.appendChild(toast);

    // Remover após 5 segundos (mais tempo para desfazer)
    const duration = 5000;
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 250);
        }
    }, duration);
}


/* =============================================
   14. MANIPULADORES DE EVENTOS
   =============================================
   Configuração de todos os event listeners
   da aplicação. Centralizado para facilitar
   manutenção e debug.
============================================= */

/**
 * Configura todos os event listeners da aplicação.
 */
function setupEventListeners() {
    // === Input do editor ===
    DOM.editor.addEventListener('input', handleEditorInput);

    // === Botões de ação ===
    DOM.btnOpen.addEventListener('click', openFile);
    DOM.fileInput.addEventListener('change', handleFileSelect);
    DOM.btnCopyMd.addEventListener('click', copyMarkdown);
    DOM.btnSave.addEventListener('click', saveMarkdown);
    DOM.btnClear.addEventListener('click', clearEditor);
    DOM.btnUndo.addEventListener('click', undoClear);
    DOM.btnCopyHtml.addEventListener('click', copyHtml);
    DOM.btnExport.addEventListener('click', exportHtml);
    if (DOM.btnExportPdf) DOM.btnExportPdf.addEventListener('click', exportPdf);
    DOM.btnWrap.addEventListener('click', toggleWordWrap);
    DOM.btnTheme.addEventListener('click', toggleTheme);

    // === Modo foco ===
    if (DOM.btnFocus) DOM.btnFocus.addEventListener('click', cycleFocusMode);

    // === Expandir painéis ===
    if (DOM.btnExpandEditor) DOM.btnExpandEditor.addEventListener('click', () => togglePanelExpand('editor'));
    if (DOM.btnExpandPreview) DOM.btnExpandPreview.addEventListener('click', () => togglePanelExpand('preview'));

    // === Scroll to top ===
    DOM.scrollTopBtn.addEventListener('click', scrollToTop);

    // === Scroll sync (bidirecional) ===
    DOM.editor.addEventListener('scroll', handleEditorScroll);
    DOM.preview.addEventListener('scroll', handlePreviewScroll);

    // === Atalhos de teclado ===
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // === Delegação de eventos no preview ===
    DOM.preview.addEventListener('click', handlePreviewClick);

    // === Redimensionamento da janela ===
    window.addEventListener('resize', debounce(handleWindowResize, 250));

    // === Drag and Drop no editor ===
    setupDragAndDrop();
}

/**
 * Manipula o input do editor.
 * Usa debounce para evitar renderização excessiva.
 *
 * @param {Event} event - Evento de input
 */
function handleEditorInput(event) {
    // Atualizar estado com o novo conteúdo
    state.markdown = event.target.value;

    // Aplicar debounce — renderizar após pause de 150ms
    clearTimeout(state.renderTimeout);
    state.renderTimeout = setTimeout(() => {
        // Usar requestAnimationFrame para batching mais suave
        if (state.rafPending) cancelAnimationFrame(state.rafPending);
        state.rafPending = requestAnimationFrame(() => {
            renderMarkdown();
            updateStats();
            state.rafPending = null;
        });
    }, DEBOUNCE_DELAY);

    // Salvar no localStorage com debounce maior (500ms)
    clearTimeout(state.storageTimeout);
    state.storageTimeout = setTimeout(() => {
        saveToLocalStorage();
    }, 500);
}

/**
 * Manipula atalhos de teclado globais.
 *
 * Atalhos suportados:
 * - Ctrl+S: Salvar Markdown
 * - Ctrl+Shift+C: Copiar HTML
 * - Ctrl+W: Alternar wrap de linha
 *
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleKeyboardShortcuts(event) {
    // Ctrl+S — Salvar
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveMarkdown();
    }

    // Ctrl+Shift+C — Copiar HTML
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        copyHtml();
    }

    // Ctrl+D — Alternar tema (dark mode)
    if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        toggleTheme();
    }

    // Ctrl+Shift+F — Alternar modo foco
    if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        cycleFocusMode();
        return;
    }

    // Ctrl+P — Exportar PDF (imprimir)
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        exportPdf();
        return;
    }

    // Ctrl+W — Alternar wrap
    if (event.ctrlKey && event.key === 'w') {
        event.preventDefault();
        toggleWordWrap();
    }

    // Tab no editor — inserir 2 espaços em vez de mudar foco
    if (event.key === 'Tab' && document.activeElement === DOM.editor) {
        event.preventDefault();
        insertTab();
    }
}

/**
 * Manipula cliques dentro do container de preview.
 * Usa delegação de eventos para capturar cliques em botões
 * que foram inseridos dinamicamente (e cujos onclick foram
 * removidos pelo DOMPurify).
 *
 * @param {MouseEvent} event - Evento de clique
 */
function handlePreviewClick(event) {
    // Verificar se o clique foi em um botão de copiar código
    const copyBtn = event.target.closest('.copy-btn');
    if (copyBtn) {
        copyCodeBlock(copyBtn);
        return;
    }
}

/**
 * Manipula redimensionamento da janela.
 * Pode ser usado para recalcular layout se necessário.
 */
function handleWindowResize() {
    // Por enquanto, o layout flexbox se adapta automaticamente.
    // Esta função fica disponível para ajustes futuros.
}


/* =============================================
   15. DRAG AND DROP
   =============================================
   Permite arrastar arquivos .md diretamente
   para o editor. UX intuitiva.
============================================= */

/**
 * Configura os event listeners de Drag and Drop no editor.
 */
function setupDragAndDrop() {
    const editorWrap = DOM.editorWrap;

    // Prevenir comportamento padrão de drag (abrir arquivo)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        editorWrap.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Mostrar overlay quando arrasta sobre o editor
    editorWrap.addEventListener('dragenter', () => {
        DOM.dragOverlay.classList.add('active');
    }, false);

    // Esconder overlay quando sai ou solta
    ['dragleave', 'drop'].forEach(eventName => {
        editorWrap.addEventListener(eventName, () => {
            DOM.dragOverlay.classList.remove('active');
        }, false);
    });

    // Processar arquivo arrastado
    editorWrap.addEventListener('drop', handleDrop, false);
}

/**
 * Previne o comportamento padrão do navegador para drag events.
 *
 * @param {Event} e - Evento de drag
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Processa o arquivo solto (drop) no editor.
 * Valida a extensão e lê o conteúdo.
 *
 * @param {DragEvent} e - Evento de drop
 */
function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validar extensão
    const validExtensions = ['.md', '.markdown', '.txt'];
    const hasValidExtension = validExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
        showToast('Por favor, arraste um arquivo .md, .markdown ou .txt', 'warning');
        return;
    }

    // Ler e carregar o arquivo
    readFileContent(file);
}


/* =============================================
   16. UTILITÁRIOS
   =============================================
   Funções auxiliares genéricas.
============================================= */

/**
 * Escape HTML — previne injeção de código HTML/JavaScript.
 * Usado quando precisamos inserir texto como texto (não como HTML).
 *
 * @param {string} str - String para escapar
 * @returns {string} String com caracteres HTML escapados
 */
function escapeHtml(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Escape de atributos HTML — para uso em atributos data-*.
 *
 * @param {string} str - String para escapar
 * @returns {string} String segura para uso em atributos HTML
 */
function escapeAttr(str) {
    return escapeHtml(str);
}

/**
 * Debounce — limita a frequência de execução de uma função.
 * Essencial para performance em eventos de input.
 *
 * @param {Function} func - Função a ser limitada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Alterna o wrap de texto no editor.
 * Quando ativado, linhas longas quebram na próxima linha.
 */
function toggleWordWrap() {
    state.wordWrap = !state.wordWrap;
    DOM.editor.style.whiteSpace = state.wordWrap ? 'pre-wrap' : 'pre';
    DOM.editor.style.wordBreak = state.wordWrap ? 'break-word' : 'normal';

    // Atualizar visual do botão
    DOM.btnWrap.style.background = state.wordWrap ? 'var(--accent-light)' : '';
    DOM.btnWrap.style.color = state.wordWrap ? 'var(--accent)' : '';
    DOM.btnWrap.setAttribute('aria-pressed', state.wordWrap);

    showToast(state.wordWrap ? 'Wrap ativado' : 'Wrap desativado', 'info');
}

/**
 * Alterna entre tema claro e escuro.
 * Salva a preferência no localStorage.
 */
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveTheme();
}

/**
 * Aplica o tema atual ao documento.
 */
function applyTheme() {
    const isDark = state.theme === 'dark';
    document.documentElement.classList.toggle('dark-theme', isDark);

    // Alternar ícones do botão de tema
    DOM.themeIconLight.style.display = isDark ? 'none' : 'block';
    DOM.themeIconDark.style.display = isDark ? 'block' : 'none';

    // Atualizar visual e aria-pressed do botão
    DOM.btnTheme.classList.toggle('btn-theme-active', isDark);
    DOM.btnTheme.setAttribute('aria-pressed', isDark);

    // Re-inicializar Mermaid com o tema correto
    reinitializeMermaid();
}

/**
 * Salva o tema no localStorage.
 */
function saveTheme() {
    try {
        localStorage.setItem(state.THEME_KEY, state.theme);
    } catch (e) {
        console.warn('[Theme] Não foi possível salvar:', e.message);
    }
}

/* =============================================
   17. MODO FOCO
    =============================================
    Ciclo: ambos → só editor → só preview → ambos.
    Persiste a preferência no localStorage.
   ============================================= */

/**
 * Alterna o modo foco no ciclo: both → editor → preview → both.
 */
function cycleFocusMode() {
    const modes = ['both', 'editor', 'preview'];
    const currentIndex = modes.indexOf(state.focusMode);
    state.focusMode = modes[(currentIndex + 1) % modes.length];
    applyFocusMode();
    saveFocusMode();

    const labels = { both: 'Visão completa', editor: 'Só editor', preview: 'Só preview' };
    showToast(labels[state.focusMode], 'info');
}

/**
 * Expande/recolhe um painel individual.
 * @param {'editor'|'preview'} panel
 */
function togglePanelExpand(panel) {
    if (state.focusMode === panel) {
        state.focusMode = 'both';
    } else {
        state.focusMode = panel;
    }
    applyFocusMode();
    saveFocusMode();
}

/**
 * Atualiza os ícones dos botões de expandir conforme o modo atual.
 */
function updateExpandIcons() {
    const editorExpanded = state.focusMode === 'editor';
    const previewExpanded = state.focusMode === 'preview';

    if (DOM.btnExpandEditor) {
        DOM.btnExpandEditor.classList.toggle('btn-theme-active', editorExpanded);
        DOM.btnExpandEditor.setAttribute('aria-pressed', editorExpanded);
        DOM.btnExpandEditor.innerHTML = editorExpanded
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="10" y1="14" x2="3" y2="21"></line>
               </svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
               </svg>`;
        DOM.btnExpandEditor.title = editorExpanded ? 'Recolher editor' : 'Expandir editor';
    }

    if (DOM.btnExpandPreview) {
        DOM.btnExpandPreview.classList.toggle('btn-theme-active', previewExpanded);
        DOM.btnExpandPreview.setAttribute('aria-pressed', previewExpanded);
        DOM.btnExpandPreview.innerHTML = previewExpanded
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="10" y1="14" x2="3" y2="21"></line>
               </svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
               </svg>`;
        DOM.btnExpandPreview.title = previewExpanded ? 'Recolher preview' : 'Expandir preview';
    }
}

/**
 * Aplica a classe CSS do modo foco no .main.
 */
function applyFocusMode() {
    DOM.main.classList.remove('focus-editor', 'focus-preview');
    if (state.focusMode === 'editor') {
        DOM.main.classList.add('focus-editor');
    } else if (state.focusMode === 'preview') {
        DOM.main.classList.add('focus-preview');
    }

    // Indicador visual no botão
    if (DOM.btnFocus) {
        DOM.btnFocus.classList.toggle('btn-theme-active', state.focusMode !== 'both');
        DOM.btnFocus.setAttribute('aria-pressed', state.focusMode !== 'both');
    }

    updateExpandIcons();
}

/**
 * Salva o modo foco no localStorage.
 */
function saveFocusMode() {
    try {
        localStorage.setItem(state.FOCUS_MODE_KEY, state.focusMode);
    } catch (e) {
        console.warn('[Focus] Não foi possível salvar:', e.message);
    }
}

/**
 * Carrega o modo foco do localStorage.
 */
function loadFocusMode() {
    try {
        const saved = localStorage.getItem(state.FOCUS_MODE_KEY);
        if (saved && ['both', 'editor', 'preview'].includes(saved)) {
            state.focusMode = saved;
            applyFocusMode();
        }
    } catch (e) {
        // Padrão: both
    }
}


/**
 * Carrega o tema salvo do localStorage.
 * Se não houver salvo, detecta a preferência do sistema.
 */
function loadTheme() {
    try {
        const saved = localStorage.getItem(state.THEME_KEY);
        if (saved) {
            state.theme = saved;
        } else {
            // Detectar preferência do sistema
            state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    } catch (e) {
        state.theme = 'light';
    }
    applyTheme();
}


/* =============================================
   18. REDIMENSIONAMENTO DE PAINÉIS
   =============================================
   Permite ao usuário arrastar a divisória
   para ajustar a largura dos painéis.
============================================= */

/**
 * Configura o redimensionamento dos painéis.
 * Adiciona listeners para arrastar a divisória.
 */
function setupPanelResize() {
    if (!DOM.divider || !DOM.editorPanel || !DOM.previewPanel) return;

    // Mouse events
    DOM.divider.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    // Touch events (mobile)
    DOM.divider.addEventListener('touchstart', startResize, { passive: false });
    document.addEventListener('touchmove', handleResize, { passive: false });
    document.addEventListener('touchend', stopResize);

    // Carregar proporção salva (após layout pronto)
    window.addEventListener('load', loadPanelRatio);
    // Fallback: carregar após um frame
    requestAnimationFrame(loadPanelRatio);
}

/**
 * Inicia o redimensionamento.
 *
 * @param {MouseEvent|TouchEvent} e - Evento de início
 */
function startResize(e) {
    e.preventDefault();
    state.isResizing = true;
    state.isColumnLayout = getComputedStyle(DOM.main).flexDirection === 'column';

    const pt = e.type.includes('touch') ? e.touches[0] : e;
    state.resizeStartX = pt.clientX;
    state.resizeStartY = pt.clientY;

    // Salvar a dimensão atual do editor como proporção
    const mainRect = DOM.main.getBoundingClientRect();
    const editorRect = DOM.editorPanel.getBoundingClientRect();
    state.resizeStartRatio = state.isColumnLayout
        ? editorRect.height / mainRect.height
        : editorRect.width / mainRect.width;

    // Adicionar classe visual durante arrasto
    document.body.style.cursor = state.isColumnLayout ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    DOM.divider.classList.add('divider-active');

    // Usar requestAnimationFrame para suavidade
    if (state.rafPending) cancelAnimationFrame(state.rafPending);
}

/**
 * Processa o movimento do mouse durante redimensionamento.
 *
 * @param {MouseEvent|TouchEvent} e - Evento de movimento
 */
function handleResize(e) {
    if (!state.isResizing) return;

    e.preventDefault();

    const pt = e.type.includes('touch') ? e.touches[0] : e;
    const delta = state.isColumnLayout
        ? pt.clientY - state.resizeStartY
        : pt.clientX - state.resizeStartX;
    const mainSize = state.isColumnLayout
        ? DOM.main.getBoundingClientRect().height
        : DOM.main.getBoundingClientRect().width;

    // Converter delta pixel para proporção
    const deltaRatio = delta / mainSize;
    let newRatio = state.resizeStartRatio + deltaRatio;

    // Limites: mínimo 20%, máximo 80%
    newRatio = Math.min(Math.max(newRatio, 0.2), 0.8);

    // Aplicar proporção com flex-basis percentual
    DOM.editorPanel.style.flexBasis = `${newRatio * 100}%`;
    DOM.editorPanel.style.flexGrow = '0';
    DOM.editorPanel.style.flexShrink = '0';
    DOM.previewPanel.style.flex = '1 1 0%';
    DOM.divider.style.flex = 'none';

    // Salvar proporção
    savePanelRatio(newRatio);
}

/**
 * Para o redimensionamento.
 */
function stopResize() {
    if (!state.isResizing) return;

    state.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    DOM.divider.classList.remove('divider-active');
}

/**
 * Salva a proporção dos painéis no localStorage.
 *
 * @param {number} ratio - Proporção do editor (0-1)
 */
function savePanelRatio(ratio) {
    try {
        localStorage.setItem(state.PANEL_RATIO_KEY, ratio.toString());
    } catch (e) {
        // Ignorar erros de localStorage
    }
}

/**
 * Carrega a proporção dos painéis do localStorage.
 * Aplica a largura salva aos painéis.
 * Só executa quando o layout já está pronto.
 */
function loadPanelRatio() {
    // Evitar múltiplas execuções
    if (state.panelRatioLoaded) return;

    try {
        const saved = localStorage.getItem(state.PANEL_RATIO_KEY);
        if (saved) {
            const ratio = parseFloat(saved);
            if (!isNaN(ratio) && ratio >= 0.2 && ratio <= 0.8) {
                // Verificar se o layout está pronto
                const mainWidth = DOM.main.getBoundingClientRect().width;
                if (mainWidth > 0) {
                    state.panelRatioLoaded = true;
                    DOM.editorPanel.style.flexBasis = `${ratio * 100}%`;
                    DOM.editorPanel.style.flexGrow = '0';
                    DOM.editorPanel.style.flexShrink = '0';
                    DOM.previewPanel.style.flex = '1 1 0%';
                    DOM.divider.style.flex = 'none';
                }
            }
        }
    } catch (e) {
        // Ignorar erros de localStorage
    }
}

/**
 * Insere 2 espaços na posição do cursor do editor.
 * Chamada quando o usuário pressiona Tab.
 */
function insertTab() {
    const editor = DOM.editor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    // Inserir 2 espaços na posição do cursor
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);

    // Reposicionar o cursor após os espaços inseridos
    editor.selectionStart = editor.selectionEnd = start + 2;

    // Disparar evento de input para atualizar a renderização
    editor.dispatchEvent(new Event('input'));
}

/**
 * Limpa todo o conteúdo do editor.
 * Em vez de confirm(), salva o conteúdo e mostra botão "Desfazer".
 */
function clearEditor() {
    if (!state.markdown.trim()) {
        showToast('Editor já está vazio', 'warning');
        return;
    }

    // Salvar conteúdo para desfazer
    state.lastClearedContent = state.markdown;

    // Limpar estado e UI
    state.markdown = '';
    DOM.editor.value = '';
    showEmptyState();
    updateStats();
    saveToLocalStorage();

    // Mostrar botão de desfazer e esconder limpar
    DOM.btnClear.style.display = 'none';
    DOM.btnUndo.style.display = 'inline-flex';

    // Atualizar estados dos botões
    updateButtonStates();

    // Mostrar toast com ação de desfazer
    showToastWithUndo('Conteúdo limpo', () => undoClear());
}

/**
 * Desfazer a última limpeza.
 * Restaura o conteúdo que foi apagado.
 */
function undoClear() {
    if (state.lastClearedContent === null) {
        showToast('Nada para desfazer', 'warning');
        return;
    }

    // Se o usuário digitou após limpar, avisar antes de sobrescrever
    if (state.markdown.trim() && !confirm('Isso vai substituir o conteúdo atual. Deseja continuar?')) {
        return;
    }

    // Restaurar conteúdo
    state.markdown = state.lastClearedContent;
    DOM.editor.value = state.lastClearedContent;
    state.lastClearedContent = null;

    // Renderizar e atualizar
    renderMarkdown();
    updateStats();
    saveToLocalStorage();

    // Restaurar botões
    DOM.btnClear.style.display = 'inline-flex';
    DOM.btnUndo.style.display = 'none';

    showToast('Conteúdo restaurado', 'success');
}

/**
 * Exibe o nome do arquivo aberto no indicador.
 *
 * @param {string} name - Nome do arquivo
 */
function showFileName(name) {
    state.fileName = name;
    DOM.fileName.textContent = name;
    DOM.fileIndicator.style.display = 'inline-flex';
}

/**
 * Esconde o indicador de nome do arquivo.
 */
function hideFileName() {
    state.fileName = null;
    DOM.fileIndicator.style.display = 'none';
}

/**
 * Manipula o scroll do editor para:
 * 1. Mostrar/esconder botão scroll-to-top
 * 2. Sincronizar scroll com preview
 */
function handleEditorScroll() {
    const editor = DOM.editor;

    // Mostrar/esconder botão scroll-to-top
    const scrollPercent = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    DOM.scrollTopBtn.classList.toggle('visible', scrollPercent > 0.1);

    // Scroll sync — rolar preview proporcionalmente
    if (state.scrollSyncActive && !state.scrollSyncLock && editor.scrollHeight > editor.clientHeight) {
        state.scrollSyncLock = true;
        const previewScrollMax = DOM.preview.scrollHeight - DOM.preview.clientHeight;
        const editorScrollMax = editor.scrollHeight - editor.clientHeight;
        if (editorScrollMax > 0) {
            DOM.preview.scrollTop = (editor.scrollTop / editorScrollMax) * previewScrollMax;
        }
        requestAnimationFrame(() => { state.scrollSyncLock = false; });
    }
}

/**
 * Manipula o scroll do preview — sincroniza com o editor.
 */
function handlePreviewScroll() {
    // Mostrar/esconder botão scroll-to-top baseado no preview
    const scrollPercent = DOM.preview.scrollTop / (DOM.preview.scrollHeight - DOM.preview.clientHeight);
    DOM.scrollTopBtn.classList.toggle('visible', scrollPercent > 0.1);

    if (state.scrollSyncActive && !state.scrollSyncLock && DOM.preview.scrollHeight > DOM.preview.clientHeight) {
        state.scrollSyncLock = true;
        const editorScrollMax = DOM.editor.scrollHeight - DOM.editor.clientHeight;
        const previewScrollMax = DOM.preview.scrollHeight - DOM.preview.clientHeight;
        if (previewScrollMax > 0) {
            DOM.editor.scrollTop = (DOM.preview.scrollTop / previewScrollMax) * editorScrollMax;
        }
        requestAnimationFrame(() => { state.scrollSyncLock = false; });
    }
}

/**
 * Rola o editor e o preview de volta ao topo.
 */
function scrollToTop() {
    DOM.editor.scrollTo({ top: 0, behavior: 'smooth' });
    DOM.preview.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Atualiza o indicador de status no rodapé.
 *
 * @param {'saved'|'rendering'|'error'} status - Tipo do status
 * @param {string} text - Texto a ser exibido
 */
function setStatus(status, text) {
    const el = DOM.statusIndicator;
    el.className = `status-badge status-${status}`;
    el.innerHTML = `<span class="status-dot"></span> ${text}`;
}

/**
 * Salva o conteúdo atual no localStorage.
 * Permite persistir entre sessões do navegador.
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem(state.STORAGE_KEY, state.markdown);
    } catch (e) {
        // Falha silenciosa — localStorage pode estar cheio ou indisponível
        console.warn('[Storage] Não foi possível salvar:', e.message);
    }
}

/**
 * Carrega conteúdo salvo do localStorage.
 * Executa na inicialização da aplicação.
 */
function loadSavedContent() {
    try {
        const saved = localStorage.getItem(state.STORAGE_KEY);
        if (saved) {
            DOM.editor.value = saved;
            state.markdown = saved;
            renderMarkdown();
            updateStats();
        }
    } catch (e) {
        // Falha silenciosa
        console.warn('[Storage] Não foi possível carregar:', e.message);
    }
}


/* =============================================
   19. INICIALIZAÇÃO DA APLICAÇÃO
   =============================================
   Ponto de entrada — executa quando o DOM
   está completamente carregado.
============================================= */

// Garantir que o DOM está pronto antes de inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM já está pronto (script carregado com defer ou no final)
    initApp();
}
