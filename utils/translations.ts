

export const translations = {
  es: {
    // Auth
    loginTitle: 'Plataforma de IA Conversacional',
    tokenLabel: 'Token de Acceso',
    tokenPlaceholder: 'Introduce tu Token de Acceso',
    loginButton: 'Acceder al Panel',
    verifying: 'Verificando...',
    secureText: 'Protegido por encriptación de extremo a extremo.',
    errorTokenRequired: 'El token es obligatorio',
    errorTokenInactive: 'Este token está inactivo. Asegúrate de que tu suscripción esté activa.',
    
    // Header
    adminMode: 'Modo Admin',
    serviceActive: 'Servicio Activo',
    serviceInactive: 'Servicio Inactivo',
    aiLearningActive: '● IA Aprendiendo (Online)',
    aiLearningSaving: '⟳ Guardando Conocimiento...',
    
    // Tabs
    tabData: 'Estrategia',
    tabChatbot: 'Chatbot',
    tabAnalytics: 'Rendimiento',
    tabIntegrate: 'Integrar',
    
    // Context Builder
    configTitle: 'Configurador del Motor de Ventas',
    configDesc: 'Define la estrategia de tu vendedor experto. La IA ya está entrenada para vender; añade aquí tus reglas específicas y tu catálogo.',
    
    // Instructions Section
    agentInstructionsTitle: 'Indicaciones Específicas',
    agentInstructionsDesc: 'Personaliza al "Vendedor Experto". Define reglas como: pedido mínimo, zonas de envío, tono de voz o campañas activas.',
    agentInstructionsPlaceholder: 'Ej: "Ofrece un 10% de descuento si compran 2 unidades", "Somos expertos en gaming", "El envío es gratis a partir de 100€".',
    addInstructionsBtn: 'Añadir Regla de Negocio',
    
    // Contact Channels
    contactChannelsTitle: 'Canales de Contacto y Escalado',
    contactChannelsDesc: 'Define los correos para derivar casos complejos. Si la IA detecta una incidencia grave, dejará de vender y ofrecerá estos contactos.',
    emailSupportPlaceholder: 'Soporte / Devoluciones (ej: soporte@tienda.com)',
    emailSalesPlaceholder: 'Ventas Grandes / B2B (ej: ventas@tienda.com)',
    emailTechPlaceholder: 'Servicio Técnico (ej: sat@tienda.com)',

    // Knowledge Base Section
    knowledgeBaseTitle: 'Base de Conocimiento (Catálogos y Promos)',
    knowledgeBaseDesc: 'Sube tus PDFs, Excel o CSV. El agente usará estos archivos para recomendar productos, consultar stock y ver precios exactos.',
    uploadLabel: 'Subir Catálogo o Tarifas',
    uploadSubLabel: 'Formatos: PDF (Info), Excel/CSV (Precios y Stock)',
    
    orUpload: 'O subir archivo',
    clickToUpload: 'Click para subir documento',
    dataSources: 'Fuentes de Datos',
    noData: 'Sin configuración',
    noDataDesc: 'Sube un catálogo o añade una regla para empezar.',
    scrapingActive: 'Fuente Web',
    generateFunnel: 'Entrenar Motor de Ventas',
    
    // Analysis Overlay
    analyzingTitle: 'Procesando Estrategia de Ventas',
    phaseInit: 'Cargando personalidad de vendedor experto...',
    phaseProcessing: 'Leyendo catálogo de productos...',
    phaseAgents: 'Diseñando embudo de ventas...',
    phaseScraping: 'Optimizando respuestas...',
    phaseResponse: 'Finalizando configuración...',
    phaseDone: '¡Motor de ventas listo!',
    
    // Chat Preview
    previewTitle: 'Simulador de Ventas',
    livePreview: 'Prueba en vivo',
    brandingEditable: 'Identidad Visual',
    brandingHint: 'Click para cambiar color',
    agentNameLabel: 'Nombre del Agente',
    agentNamePlaceholder: 'Ej: Asistente Comercial',
    publishChanges: 'Publicar Cambios',
    strategyDetected: 'Estrategia Detectada',
    sourcesDetected: 'Fuentes',
    navDetected: 'Áreas',
    productsDetected: 'Productos Identificados',
    noProducts: 'No se detectaron productos.',
    inputPlaceholderChat: 'Escribe como un cliente...',
    
    // Analytics
    totalConversations: 'Conversaciones',
    conversionRate: 'Tasa de Cierre',
    attributedSales: 'Ventas Cerradas',
    satisfaction: 'Satisfacción',
    activityTitle: 'Actividad Reciente',
    topProductsTitle: 'Más Recomendados',
    viewFullReport: 'Ver Reporte',
    consultations: 'consultas',
    last7Days: '7 días',
    last30Days: '30 días',
    exportData: 'Exportar CSV',
    funnelTitle: 'Embudo de Ventas',
    funnelVisitors: 'Visitantes',
    funnelInteractions: 'Interesados',
    funnelLeads: 'Cualificados',
    funnelSales: 'Ventas',

    // Embed
    embedTitle: 'Integración Web',
    embedDesc: 'Copia el siguiente código para instalar el agente en tu sitio web.',
    platform: 'Plataforma',
    installStatus: 'Estado',
    verifyBtn: 'Verificar',
    scanning: 'Escaneando...',
    widgetDetected: 'Widget Activo',
    widgetDetectedDesc: 'La instalación es correcta.',
    notDetected: 'No Detectado',
    notDetectedDesc: 'No se encuentra el script.',
    copyCode: 'Copiar',
    copied: 'Copiado',
    htmlGuide: 'Instalación HTML',
    htmlStep1: 'Abre tu archivo <code>index.html</code>.',
    htmlStep2: 'Ve al final del documento.',
    htmlStep3: 'Pega el código antes de <code>&lt;/body&gt;</code>.',
    htmlStep4: 'Guarda los cambios.',
    
    wordpressGuide: 'Instalación WordPress',
    wpRecommended: 'Recomendado',
    wpStep1: 'Usa un plugin de "Header & Footer" y pega el código en el Footer.',
    
    shopifyGuide: 'Instalación Shopify',
    shopifyStep1: 'Ve a <strong>Tienda Online > Temas</strong>.',
    shopifyStep2: 'Edita el código en <code>theme.liquid</code> antes de <code>&lt;/body&gt;</code>.',

    // General
    buyNow: 'Comprar',
    viewDetail: 'Más información',
    addToCart: 'Añadir al carrito',
    link: 'Link',
  },
  en: {
    // Auth
    loginTitle: 'Sales AI Platform',
    tokenLabel: 'Access Token',
    tokenPlaceholder: 'Enter Access Token',
    loginButton: 'Login',
    verifying: 'Verifying...',
    secureText: 'End-to-end encrypted.',
    errorTokenRequired: 'Token required',
    errorTokenInactive: 'Inactive token.',
    
    // Header
    adminMode: 'Admin',
    serviceActive: 'Active',
    serviceInactive: 'Inactive',
    aiLearningActive: '● AI Learning',
    aiLearningSaving: '⟳ Saving...',
    
    // Tabs
    tabData: 'Sales Engine',
    tabChatbot: 'Chatbot',
    tabAnalytics: 'Performance',
    tabIntegrate: 'Integrate',
    
    // Context Builder
    configTitle: 'Sales Engine Configurator',
    configDesc: 'Define your expert sales strategy. The AI is trained to sell; add your specific rules and catalog here.',
    
    // Instructions Section
    agentInstructionsTitle: 'Specific Indications',
    agentInstructionsDesc: 'Customize the "Expert Salesperson". Define rules like: minimum order, shipping zones, tone of voice, or active campaigns.',
    agentInstructionsPlaceholder: 'Ex: "Offer 10% discount on 2 units", "We are gaming experts", "Free shipping over $100".',
    addInstructionsBtn: 'Add Business Rule',
    
    // Contact Channels
    contactChannelsTitle: 'Contact & Escalation Channels',
    contactChannelsDesc: 'Define emails for complex cases. If AI detects serious issues, it will stop selling and offer these contacts.',
    emailSupportPlaceholder: 'Support / Returns (e.g., support@store.com)',
    emailSalesPlaceholder: 'B2B / Wholesale (e.g., sales@store.com)',
    emailTechPlaceholder: 'Tech Service (e.g., sat@store.com)',

    // Knowledge Base Section
    knowledgeBaseTitle: 'Knowledge Base (Catalogs & Promos)',
    knowledgeBaseDesc: 'Upload your PDFs, Excel, or CSV. The agent will use these files to recommend products, check stock, and see exact prices.',
    uploadLabel: 'Upload Catalog or Pricing',
    uploadSubLabel: 'Formats: PDF (Info), Excel/CSV (Prices & Stock)',
    
    orUpload: 'Or upload file',
    clickToUpload: 'Click to upload',
    dataSources: 'Data Sources',
    noData: 'No configuration',
    noDataDesc: 'Upload a catalog or add a rule to start.',
    scrapingActive: 'Web Source',
    generateFunnel: 'Train Sales Engine',

    // Analysis Overlay
    analyzingTitle: 'Processing Sales Strategy',
    phaseInit: 'Loading expert salesperson profile...',
    phaseProcessing: 'Reading product catalog...',
    phaseAgents: 'Designing sales funnel...',
    phaseScraping: 'Optimizing responses...',
    phaseResponse: 'Finalizing setup...',
    phaseDone: 'Sales Engine Ready!',
    
    // Chat Preview
    previewTitle: 'Sales Simulator',
    livePreview: 'Live Test',
    brandingEditable: 'Visual Identity',
    brandingHint: 'Click to change color',
    agentNameLabel: 'Agent Name',
    agentNamePlaceholder: 'Ex: Sales Assistant',
    publishChanges: 'Publish',
    strategyDetected: 'Strategy Detected',
    sourcesDetected: 'Sources',
    navDetected: 'Areas',
    productsDetected: 'Products Identified',
    noProducts: 'No products detected.',
    inputPlaceholderChat: 'Type as a customer...',
    
    // Analytics
    totalConversations: 'Conversations',
    conversionRate: 'Close Rate',
    attributedSales: 'Sales Closed',
    satisfaction: 'Satisfaction',
    activityTitle: 'Recent Activity',
    topProductsTitle: 'Top Recommended',
    viewFullReport: 'Full Report',
    consultations: 'queries',
    last7Days: '7 days',
    last30Days: '30 days',
    exportData: 'Export CSV',
    funnelTitle: 'Sales Funnel',
    funnelVisitors: 'Visitors',
    funnelInteractions: 'Interested',
    funnelLeads: 'Qualified',
    funnelSales: 'Sales',

    // Embed
    embedTitle: 'Web Integration',
    embedDesc: 'Copy the code below to install on your website.',
    platform: 'Platform',
    installStatus: 'Status',
    verifyBtn: 'Verify',
    scanning: 'Scanning...',
    widgetDetected: 'Widget Active',
    widgetDetectedDesc: 'Installation correct.',
    notDetected: 'Not Detected',
    notDetectedDesc: 'Script not found.',
    copyCode: 'Copy',
    copied: 'Copied',
    htmlGuide: 'HTML Installation',
    htmlStep1: 'Open <code>index.html</code>.',
    htmlStep2: 'Go to the bottom.',
    htmlStep3: 'Paste code before <code>&lt;/body&gt;</code>.',
    htmlStep4: 'Save changes.',

    wordpressGuide: 'WordPress Installation',
    wpRecommended: 'Recommended',
    wpStep1: 'Use a "Header & Footer" plugin and paste in Footer.',

    shopifyGuide: 'Shopify Installation',
    shopifyStep1: 'Go to <strong>Online Store > Themes</strong>.',
    shopifyStep2: 'Edit code in <code>theme.liquid</code> before <code>&lt;/body&gt;</code>.',

    // General
    buyNow: 'Buy',
    viewDetail: 'More Info',
    addToCart: 'Add to Cart',
    link: 'Link',
  }
};
