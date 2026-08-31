"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Marketing-landing i18n. English is the base language; the visitor can switch
 * to any of the world's most-spoken languages (plus Finnish) from the header.
 * The choice persists in localStorage. Arabic flips the page to RTL.
 */

export const LANGS = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "fi", label: "Suomi", dir: "ltr" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

const STORAGE_KEY = "sitagio-landing-lang";

const en = {
  meta: {
    title: "Sitagio — find businesses with no website, build them one with AI",
    description: "Sitagio finds local businesses with no website via Google Places and builds them ready-to-launch AI websites in their own language, all from one dashboard.",
  },
  nav: {
    features: "Features",
    how: "How it works",
    pricing: "Pricing",
    faq: "FAQ",
    signIn: "Sign in",
    getStarted: "Get started",
  },
  hero: {
    badge: "Live · lead finder + AI website builder",
    title1: "Find businesses with no website.",
    title2: "Build them one with AI.",
    sub: "Sitagio scans Google Places worldwide, enriches every lead with registry data, and turns the best ones into ready-to-launch websites — written in the business's own language.",
    ctaPrimary: "Get started",
    ctaSecondary: "See how it works",
    stats: ["leads per search", "lead to draft site", "site languages"],
  },
  preview: {
    query: "Barbershops · Tampere · 5 km",
    leadsFound: "12 leads found",
    business: "Business",
    registry: "Registry",
    noWebsite: "No website",
    buildSite: "Build site",
    draftedSuffix: "drafted in 42 s",
  },
  logos: { poweredBy: "Powered by" },
  features: {
    eyebrow: "Product",
    title: "From cold search to shipped website",
    subtitle: "The full workflow a freelancer or agency needs to find local businesses and win them as clients.",
    cards: [
      {
        t: "Chat-style lead finder",
        b: "Describe a niche and a location. Sitagio queries Google Places and returns a clean list with website status detected instantly.",
      },
      {
        t: "AI website builder",
        b: "Turn a lead into a mobile-ready site in seconds — in the business's own language. Preview live, edit inline, export.",
      },
      {
        t: "Registry cross-check",
        b: "Finnish leads are matched to the official YTJ registry — business ID, industry code, registration date.",
      },
      {
        t: "Built-in CRM",
        b: "Track lead status from new to won, invite your team, and keep every workspace isolated.",
      },
      {
        t: "One-click export",
        b: "Download any lead list as CSV for your outreach tool, or export a finished site as ready-to-host files.",
      },
    ],
    tryTitle: "Try it on your own town",
    tryCta: "Start a search",
  },
  how: {
    eyebrow: "How it works",
    title: "Three steps to a new client",
    subtitle: "No scraping, no spreadsheets — the whole pipeline lives in one dashboard.",
    steps: [
      {
        t: "Describe your target",
        b: "Type a niche and a town, set a radius. Sitagio queries Google Places behind the scenes.",
      },
      {
        t: "Get qualified leads",
        b: "See who has no website, enriched with registry data where available. Filter, tag, and export.",
      },
      {
        t: "Ship their website",
        b: "Generate a polished site in the local language from real business data. Preview, tweak, hand it over.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Simple, transparent plans",
    subtitle: "Pick a plan and start today from €20/month. Cancel whenever you like — payments handled by Stripe.",
    badge: "Most popular",
    period: "/month",
    note: "Prices in EUR, VAT where applicable.",
    tiers: [
      {
        name: "Standard",
        desc: "For freelancers and solo marketers.",
        cta: "Get started",
        features: [
          "50 lead searches / month",
          "15 AI websites / month",
          "Website message inbox",
          "1 seat",
          "Registry cross-check (FI)",
          "CSV export",
        ],
      },
      {
        name: "Pro",
        desc: "For agencies running at scale.",
        cta: "Get started",
        features: [
          "5,000 lead searches / month",
          "500 AI websites / month",
          "AI pitch emails with one-click buy",
          "5 team seats",
          "Priority AI generation",
          "Everything in Standard",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions, answered",
    side: "Anything else? Email support@sitovaiagency.com — we reply within 1 business day.",
    items: [
      {
        q: "Where does the lead data come from?",
        a: "Live from the Google Places API — anywhere in the world. Finnish leads are additionally cross-checked against the official YTJ / PRH business registry. Nothing is scraped.",
      },
      {
        q: "How does Sitagio know a business has no website?",
        a: "Google Places reports whether a business has a website listed. Sitagio flags the ones without one — and for Finnish companies also verifies they're active in the YTJ registry.",
      },
      {
        q: "Do I own the websites I generate?",
        a: "Yes. Every generated site can be exported as standard HTML/CSS files that you can host anywhere and sell to your client — no lock-in, no Sitagio branding.",
      },
      {
        q: "What language are the generated sites in?",
        a: "Sites are written in the business's own language, detected automatically from its location — with 10 languages to pick from (English, Finnish, Swedish, German, Spanish, Mandarin and more). Every text is editable.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. You can cancel from the billing page in one click; your plan stays active until the end of the current billing period.",
      },
      {
        q: "What happens when I hit my monthly limit?",
        a: "Searches and site generations pause until your next billing cycle, or you can upgrade to Pro instantly from the dashboard. Your existing leads and sites always stay accessible.",
      },
    ],
  },
  cta: {
    title: "Start finding no-website leads today",
    sub: "Spin up your workspace in under a minute. Your first week is on us.",
    button: "Get started",
    note: "From €20/month · Cancel anytime",
  },
  footer: {
    blurb: "Find local businesses without a website and build them one with AI — in their own language, from first search to shipped site.",
    product: "Product",
    getStarted: "Get started",
    createAccount: "Create account",
    signIn: "Sign in",
    rights: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    responseTime: "We reply within 1 business day.",
    backToTop: "Back to top",
  },
};

export type LandingDict = typeof en;

const fi: LandingDict = {
  meta: {
    title: "Sitagio — löydä yritykset ilman kotisivuja, rakenna sivut tekoälyllä",
    description: "Sitagio löytää Google Placesista paikalliset yritykset ilman kotisivuja ja rakentaa niille julkaisuvalmiit tekoälysivut niiden omalla kielellä — yhdestä näkymästä.",
  },
  nav: {
    features: "Ominaisuudet",
    how: "Miten se toimii",
    pricing: "Hinnat",
    faq: "UKK",
    signIn: "Kirjaudu",
    getStarted: "Aloita",
  },
  hero: {
    badge: "Live · liidihaku + AI-kotisivukone",
    title1: "Löydä yritykset ilman kotisivuja.",
    title2: "Rakenna niille sivut tekoälyllä.",
    sub: "Sitagio skannaa Google Placesin maailmanlaajuisesti, rikastaa jokaisen liidin rekisteridatalla ja muuttaa parhaat julkaisuvalmiiksi kotisivuiksi — kirjoitettuna yrityksen omalla kielellä.",
    ctaPrimary: "Aloita",
    ctaSecondary: "Katso miten se toimii",
    stats: ["liidiä per haku", "liidistä sivuluonnokseen", "sivukieltä"],
  },
  preview: {
    query: "Parturit · Tampere · 5 km",
    leadsFound: "12 liidiä löytyi",
    business: "Yritys",
    registry: "Rekisteri",
    noWebsite: "Ei kotisivuja",
    buildSite: "Rakenna sivut",
    draftedSuffix: "luonnosteltu 42 s:ssa",
  },
  logos: { poweredBy: "Taustalla" },
  features: {
    eyebrow: "Tuote",
    title: "Kylmästä hausta valmiiseen kotisivuun",
    subtitle: "Koko työnkulku, jonka freelancer tai toimisto tarvitsee löytääkseen paikalliset yritykset ja voittaakseen ne asiakkaiksi.",
    cards: [
      {
        t: "Chat-tyylinen liidihaku",
        b: "Kuvaile toimiala ja sijainti. Sitagio kysyy Google Placesia ja palauttaa siistin listan, jossa kotisivutilanne tunnistetaan heti.",
      },
      {
        t: "AI-kotisivukone",
        b: "Muuta liidi mobiilivalmiiksi sivustoksi sekunneissa — yrityksen omalla kielellä. Esikatsele livenä, muokkaa suoraan, vie ulos.",
      },
      {
        t: "Rekisteriristiintarkistus",
        b: "Suomalaiset liidit yhdistetään viralliseen YTJ-rekisteriin — Y-tunnus, toimialakoodi, rekisteröintipäivä.",
      },
      {
        t: "Sisäänrakennettu CRM",
        b: "Seuraa liidin tilaa uudesta voitettuun, kutsu tiimisi ja pidä jokainen työtila erillään.",
      },
      {
        t: "Yhden klikkauksen vienti",
        b: "Lataa mikä tahansa liidilista CSV:nä outreach-työkaluusi tai vie valmis sivusto hostattavina tiedostoina.",
      },
    ],
    tryTitle: "Kokeile omalla paikkakunnallasi",
    tryCta: "Aloita haku",
  },
  how: {
    eyebrow: "Miten se toimii",
    title: "Kolme askelta uuteen asiakkaaseen",
    subtitle: "Ei scrapingia, ei taulukoita — koko putki elää yhdessä dashboardissa.",
    steps: [
      {
        t: "Kuvaile kohteesi",
        b: "Kirjoita toimiala ja paikkakunta, aseta säde. Sitagio kysyy Google Placesia taustalla.",
      },
      {
        t: "Saat laadukkaat liidit",
        b: "Näet keneltä puuttuvat kotisivut, rikastettuna rekisteridatalla missä saatavilla. Suodata, tagaa ja vie.",
      },
      {
        t: "Toimita heidän sivunsa",
        b: "Generoi viimeistelty sivusto paikallisella kielellä oikeasta yritysdatasta. Esikatsele, hienosäädä, luovuta.",
      },
    ],
  },
  pricing: {
    eyebrow: "Hinnat",
    title: "Selkeät, läpinäkyvät paketit",
    subtitle: "Valitse paketti ja aloita tänään alkaen 20 €/kk. Peru milloin haluat — maksut hoitaa Stripe.",
    badge: "Suosituin",
    period: "/kk",
    note: "Hinnat euroissa, ALV soveltuvin osin.",
    tiers: [
      {
        name: "Standard",
        desc: "Freelancereille ja yksinyrittäjille.",
        cta: "Aloita",
        features: [
          "50 liidihakua / kk",
          "15 AI-kotisivua / kk",
          "Sivujen viesti-inbox",
          "1 käyttäjä",
          "Rekisteriristiintarkistus (FI)",
          "CSV-vienti",
        ],
      },
      {
        name: "Pro",
        desc: "Toimistoille, jotka toimivat skaalassa.",
        cta: "Aloita",
        features: [
          "5 000 liidihakua / kk",
          "500 AI-kotisivua / kk",
          "AI-myyntisähköpostit yhden klikkauksen ostolla",
          "5 tiimipaikkaa",
          "Prioriteetti-AI-generointi",
          "Kaikki Standardin ominaisuudet",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "UKK",
    title: "Kysymykset, vastattu",
    side: "Muuta kysyttävää? Lähetä sähköpostia osoitteeseen support@sitovaiagency.com — vastaamme yhden arkipäivän kuluessa.",
    items: [
      {
        q: "Mistä liididata tulee?",
        a: "Suoraan Google Places -rajapinnasta — mistä päin maailmaa tahansa. Suomalaiset liidit ristiintarkistetaan lisäksi virallisesta YTJ/PRH-rekisteristä. Mitään ei scrapeta.",
      },
      {
        q: "Mistä Sitagio tietää, ettei yrityksellä ole kotisivuja?",
        a: "Google Places kertoo, onko yritykselle listattu verkkosivu. Sitagio merkitsee ne, joilta se puuttuu — ja suomalaisilta yrityksiltä varmistetaan lisäksi, että ne ovat aktiivisia YTJ-rekisterissä.",
      },
      {
        q: "Omistanko generoimani sivustot?",
        a: "Kyllä. Jokainen generoitu sivusto voidaan viedä tavallisina HTML/CSS-tiedostoina, jotka voit hostata missä vain ja myydä asiakkaallesi — ei lukkiutumista, ei Sitagio-brändäystä.",
      },
      {
        q: "Millä kielellä generoidut sivut ovat?",
        a: "Sivut kirjoitetaan yrityksen omalla kielellä, joka tunnistetaan automaattisesti sijainnista — valittavana 10 kieltä (englanti, suomi, ruotsi, saksa, espanja, mandariini ja muita). Jokainen teksti on muokattavissa.",
      },
      {
        q: "Voinko perua milloin vain?",
        a: "Kyllä. Voit perua laskutussivulta yhdellä klikkauksella; pakettisi pysyy aktiivisena kuluvan laskutuskauden loppuun.",
      },
      {
        q: "Mitä tapahtuu, kun kuukausiraja tulee vastaan?",
        a: "Haut ja sivugeneroinnit pysähtyvät seuraavaan laskutusjaksoon asti, tai voit päivittää Prohon heti dashboardista. Olemassa olevat liidisi ja sivusi pysyvät aina saatavilla.",
      },
    ],
  },
  cta: {
    title: "Ala löytää kotisivuttomia liidejä tänään",
    sub: "Pystytä työtilasi alle minuutissa. Ensimmäinen viikko on meidän piikkiin.",
    button: "Aloita",
    note: "Alkaen 20 €/kk · Peru milloin vain",
  },
  footer: {
    blurb: "Löydä paikalliset yritykset ilman kotisivuja ja rakenna niille sivut tekoälyllä — heidän omalla kielellään, ensimmäisestä hausta valmiiseen sivustoon.",
    product: "Tuote",
    getStarted: "Aloita",
    createAccount: "Luo tili",
    signIn: "Kirjaudu",
    rights: "Kaikki oikeudet pidätetään.",
    privacy: "Tietosuoja",
    terms: "Käyttöehdot",
    responseTime: "Vastaamme yhden arkipäivän kuluessa.",
    backToTop: "Takaisin ylös",
  },
};

const es: LandingDict = {
  meta: {
    title: "Sitagio — encuentra negocios sin web y créales una con IA",
    description: "Sitagio encuentra negocios locales sin sitio web a través de Google Places y les crea webs con IA listas para publicar en su propio idioma, desde un único panel.",
  },
  nav: {
    features: "Funciones",
    how: "Cómo funciona",
    pricing: "Precios",
    faq: "FAQ",
    signIn: "Iniciar sesión",
    getStarted: "Empezar",
  },
  hero: {
    badge: "En vivo · buscador de leads + creador de webs con IA",
    title1: "Encuentra negocios sin sitio web.",
    title2: "Créales uno con IA.",
    sub: "Sitagio escanea Google Places en todo el mundo, enriquece cada lead con datos registrales y convierte los mejores en sitios web listos para lanzar — escritos en el idioma del propio negocio.",
    ctaPrimary: "Empezar",
    ctaSecondary: "Ver cómo funciona",
    stats: ["leads por búsqueda", "de lead a borrador de web", "idiomas de sitio"],
  },
  preview: {
    query: "Barberías · Tampere · 5 km",
    leadsFound: "12 leads encontrados",
    business: "Negocio",
    registry: "Registro",
    noWebsite: "Sin web",
    buildSite: "Crear web",
    draftedSuffix: "borrador en 42 s",
  },
  logos: { poweredBy: "Con tecnología de" },
  features: {
    eyebrow: "Producto",
    title: "De la búsqueda en frío a la web entregada",
    subtitle: "El flujo completo que un freelance o agencia necesita para encontrar negocios locales y ganarlos como clientes.",
    cards: [
      {
        t: "Buscador de leads tipo chat",
        b: "Describe un nicho y una ubicación. Sitagio consulta Google Places y devuelve una lista limpia con el estado del sitio web detectado al instante.",
      },
      {
        t: "Creador de webs con IA",
        b: "Convierte un lead en un sitio adaptado a móvil en segundos — en el idioma del negocio. Vista previa en vivo, edición inline, exportación.",
      },
      {
        t: "Verificación registral",
        b: "Los leads finlandeses se cruzan con el registro oficial YTJ — ID de empresa, código de sector, fecha de registro.",
      },
      {
        t: "CRM integrado",
        b: "Sigue el estado de cada lead de nuevo a ganado, invita a tu equipo y mantén cada espacio de trabajo aislado.",
      },
      {
        t: "Exportación en un clic",
        b: "Descarga cualquier lista de leads como CSV para tu herramienta de outreach, o exporta un sitio terminado como archivos listos para alojar.",
      },
    ],
    tryTitle: "Pruébalo en tu propia ciudad",
    tryCta: "Iniciar una búsqueda",
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "Tres pasos hacia un nuevo cliente",
    subtitle: "Sin scraping, sin hojas de cálculo — todo el proceso vive en un solo panel.",
    steps: [
      {
        t: "Describe tu objetivo",
        b: "Escribe un nicho y una ciudad, define un radio. Sitagio consulta Google Places entre bastidores.",
      },
      {
        t: "Recibe leads cualificados",
        b: "Ve quién no tiene web, con datos registrales donde estén disponibles. Filtra, etiqueta y exporta.",
      },
      {
        t: "Entrega su sitio web",
        b: "Genera una web pulida en el idioma local a partir de datos reales del negocio. Previsualiza, ajusta, entrégala.",
      },
    ],
  },
  pricing: {
    eyebrow: "Precios",
    title: "Planes simples y transparentes",
    subtitle: "Elige un plan y empieza hoy desde 20 €/mes. Cancela cuando quieras — pagos gestionados por Stripe.",
    badge: "Más popular",
    period: "/mes",
    note: "Precios en EUR, IVA donde aplique.",
    tiers: [
      {
        name: "Standard",
        desc: "Para freelances y marketers en solitario.",
        cta: "Empezar",
        features: [
          "50 búsquedas de leads / mes",
          "15 webs con IA / mes",
          "Bandeja de mensajes del sitio",
          "1 puesto",
          "Verificación registral (FI)",
          "Exportación CSV",
        ],
      },
      {
        name: "Pro",
        desc: "Para agencias que operan a escala.",
        cta: "Empezar",
        features: [
          "5.000 búsquedas de leads / mes",
          "500 webs con IA / mes",
          "Emails de venta con IA y compra en un clic",
          "5 puestos de equipo",
          "Generación IA prioritaria",
          "Todo lo de Standard",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Preguntas, respondidas",
    side: "¿Algo más? Escríbenos a support@sitovaiagency.com: respondemos en un día hábil.",
    items: [
      {
        q: "¿De dónde vienen los datos de leads?",
        a: "En vivo desde la API de Google Places — en cualquier parte del mundo. Los leads finlandeses se cruzan además con el registro mercantil oficial YTJ / PRH. No se scrapea nada.",
      },
      {
        q: "¿Cómo sabe Sitagio que un negocio no tiene web?",
        a: "Google Places indica si un negocio tiene sitio web listado. Sitagio marca los que no lo tienen — y en las empresas finlandesas verifica además que estén activas en el registro YTJ.",
      },
      {
        q: "¿Soy dueño de las webs que genero?",
        a: "Sí. Cada sitio generado puede exportarse como archivos HTML/CSS estándar que puedes alojar donde quieras y vender a tu cliente — sin ataduras, sin marca de Sitagio.",
      },
      {
        q: "¿En qué idioma están las webs generadas?",
        a: "Las webs se escriben en el idioma del propio negocio, detectado automáticamente por su ubicación — con 10 idiomas a elegir (inglés, finés, sueco, alemán, español, mandarín y más). Todo texto es editable.",
      },
      {
        q: "¿Puedo cancelar en cualquier momento?",
        a: "Sí. Puedes cancelar desde la página de facturación con un clic; tu plan sigue activo hasta el final del período de facturación actual.",
      },
      {
        q: "¿Qué pasa cuando alcanzo mi límite mensual?",
        a: "Las búsquedas y generaciones se pausan hasta tu próximo ciclo, o puedes pasarte a Pro al instante desde el panel. Tus leads y sitios existentes siguen siempre accesibles.",
      },
    ],
  },
  cta: {
    title: "Empieza hoy a encontrar leads sin web",
    sub: "Monta tu espacio de trabajo en menos de un minuto. La primera semana corre de nuestra cuenta.",
    button: "Empezar",
    note: "Desde 20 €/mes · Cancela cuando quieras",
  },
  footer: {
    blurb: "Encuentra negocios locales sin sitio web y créales uno con IA — en su propio idioma, desde la primera búsqueda hasta la web entregada.",
    product: "Producto",
    getStarted: "Empezar",
    createAccount: "Crear cuenta",
    signIn: "Iniciar sesión",
    rights: "Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
    responseTime: "Respondemos en un día hábil.",
    backToTop: "Volver arriba",
  },
};

const zh: LandingDict = {
  meta: {
    title: "Sitagio — 找到没有网站的商家，用 AI 为他们建站",
    description: "Sitagio 通过 Google Places 找出没有网站的本地商家，并用他们自己的语言生成可直接上线的 AI 网站，全部在一个后台完成。",
  },
  nav: {
    features: "功能",
    how: "工作原理",
    pricing: "价格",
    faq: "常见问题",
    signIn: "登录",
    getStarted: "开始使用",
  },
  hero: {
    badge: "已上线 · 客户挖掘 + AI 建站",
    title1: "找到没有网站的商家。",
    title2: "用 AI 为他们建一个。",
    sub: "Sitagio 在全球范围扫描 Google Places，用工商注册数据丰富每条线索，并把最优质的线索变成随时可上线的网站——用商家自己的语言撰写。",
    ctaPrimary: "开始使用",
    ctaSecondary: "看看它如何工作",
    stats: ["条线索/每次搜索", "从线索到网站草稿", "种网站语言"],
  },
  preview: {
    query: "理发店 · 坦佩雷 · 5 km",
    leadsFound: "找到 12 条线索",
    business: "商家",
    registry: "注册信息",
    noWebsite: "无网站",
    buildSite: "生成网站",
    draftedSuffix: "42 秒完成草稿",
  },
  logos: { poweredBy: "技术支持" },
  features: {
    eyebrow: "产品",
    title: "从陌生搜索到交付网站",
    subtitle: "自由职业者或代理机构寻找本地商家并赢得客户所需的完整工作流。",
    cards: [
      {
        t: "对话式线索搜索",
        b: "描述行业和地点。Sitagio 查询 Google Places，返回一份干净的列表，并即时检测网站状态。",
      },
      {
        t: "AI 建站工具",
        b: "几秒内把线索变成移动端就绪的网站——用商家自己的语言。实时预览、行内编辑、一键导出。",
      },
      {
        t: "工商注册核验",
        b: "芬兰线索与官方 YTJ 注册库匹配——企业 ID、行业代码、注册日期。",
      },
      {
        t: "内置 CRM",
        b: "跟踪线索状态从新建到成交，邀请团队成员，每个工作区相互隔离。",
      },
      {
        t: "一键导出",
        b: "把任意线索列表下载为 CSV 用于你的外联工具，或把完成的网站导出为可直接托管的文件。",
      },
    ],
    tryTitle: "在你自己的城市试试",
    tryCta: "开始搜索",
  },
  how: {
    eyebrow: "工作原理",
    title: "三步拿下新客户",
    subtitle: "不用爬虫、不用表格——整条流程都在一个仪表盘里。",
    steps: [
      {
        t: "描述你的目标",
        b: "输入行业和城市，设置半径。Sitagio 在后台查询 Google Places。",
      },
      {
        t: "获得优质线索",
        b: "看到谁没有网站，并在可用时附上注册数据。筛选、打标签、导出。",
      },
      {
        t: "交付他们的网站",
        b: "用真实的商家数据生成本地语言的精美网站。预览、微调、交付。",
      },
    ],
  },
  pricing: {
    eyebrow: "价格",
    title: "简单透明的方案",
    subtitle: "选择方案，今天就从 €20/月开始。随时取消——支付由 Stripe 处理。",
    badge: "最受欢迎",
    period: "/月",
    note: "价格以欧元计，含适用增值税。",
    tiers: [
      {
        name: "Standard",
        desc: "适合自由职业者和个人营销者。",
        cta: "开始使用",
        features: [
          "每月 50 次线索搜索",
          "每月 15 个 AI 网站",
          "网站留言收件箱",
          "1 个席位",
          "注册核验（芬兰）",
          "CSV 导出",
        ],
      },
      {
        name: "Pro",
        desc: "适合规模化运作的代理机构。",
        cta: "开始使用",
        features: [
          "每月 5,000 次线索搜索",
          "每月 500 个 AI 网站",
          "AI 销售邮件，一键购买",
          "5 个团队席位",
          "AI 生成优先",
          "含 Standard 全部功能",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "常见问题",
    title: "有问必答",
    side: "还有其他问题？请发邮件至 support@sitovaiagency.com，我们会在一个工作日内回复。",
    items: [
      {
        q: "线索数据从哪里来？",
        a: "实时来自 Google Places API——覆盖全球任何地方。芬兰线索还会与官方 YTJ / PRH 工商注册库交叉核验。没有任何爬取。",
      },
      {
        q: "Sitagio 怎么知道商家没有网站？",
        a: "Google Places 会报告商家是否列出了网站。Sitagio 标记没有网站的商家——对芬兰公司还会验证其在 YTJ 注册库中处于活跃状态。",
      },
      {
        q: "我生成的网站归我所有吗？",
        a: "是的。每个生成的网站都可以导出为标准 HTML/CSS 文件，你可以托管在任何地方并卖给客户——没有锁定，没有 Sitagio 品牌标识。",
      },
      {
        q: "生成的网站用什么语言？",
        a: "网站用商家自己的语言撰写，根据其位置自动检测——共有 10 种语言可选（英语、芬兰语、瑞典语、德语、西班牙语、普通话等）。所有文字均可编辑。",
      },
      {
        q: "可以随时取消吗？",
        a: "可以。在账单页面一键取消；你的方案在当前计费周期结束前保持有效。",
      },
      {
        q: "达到每月上限后会怎样？",
        a: "搜索和网站生成会暂停到下一个计费周期，或者你可以在仪表盘中立即升级到 Pro。你已有的线索和网站始终可以访问。",
      },
    ],
  },
  cta: {
    title: "今天就开始寻找无网站的商家",
    sub: "不到一分钟建好你的工作区。第一周我们请客。",
    button: "开始使用",
    note: "€20/月起 · 随时取消",
  },
  footer: {
    blurb: "找到没有网站的本地商家，用 AI 为他们建站——用他们自己的语言，从第一次搜索到网站交付。",
    product: "产品",
    getStarted: "开始使用",
    createAccount: "创建账户",
    signIn: "登录",
    rights: "保留所有权利。",
    privacy: "隐私",
    terms: "条款",
    responseTime: "我们会在一个工作日内回复。",
    backToTop: "回到顶部",
  },
};

const hi: LandingDict = {
  meta: {
    title: "Sitagio — बिना वेबसाइट वाले व्यवसाय ढूंढें, AI से साइट बनाएं",
    description: "Sitagio गूगल प्लेसेस से उन स्थानीय व्यवसायों को ढूंढता है जिनकी वेबसाइट नहीं है, और उनकी अपनी भाषा में लॉन्च-तैयार AI वेबसाइट बनाता है।",
  },
  nav: {
    features: "फ़ीचर्स",
    how: "यह कैसे काम करता है",
    pricing: "कीमतें",
    faq: "FAQ",
    signIn: "साइन इन",
    getStarted: "शुरू करें",
  },
  hero: {
    badge: "लाइव · लीड फ़ाइंडर + AI वेबसाइट बिल्डर",
    title1: "बिना वेबसाइट वाले व्यवसाय ढूंढें।",
    title2: "AI से उनकी वेबसाइट बनाएं।",
    sub: "Sitagio दुनिया भर में Google Places स्कैन करता है, हर लीड को रजिस्ट्री डेटा से समृद्ध करता है, और सबसे अच्छे लीड्स को लॉन्च-रेडी वेबसाइटों में बदलता है — व्यवसाय की अपनी भाषा में लिखी हुई।",
    ctaPrimary: "शुरू करें",
    ctaSecondary: "देखें यह कैसे काम करता है",
    stats: ["लीड प्रति खोज", "लीड से ड्राफ़्ट साइट तक", "साइट भाषाएं"],
  },
  preview: {
    query: "नाई की दुकानें · Tampere · 5 km",
    leadsFound: "12 लीड मिले",
    business: "व्यवसाय",
    registry: "रजिस्ट्री",
    noWebsite: "वेबसाइट नहीं",
    buildSite: "साइट बनाएं",
    draftedSuffix: "42 सेकंड में ड्राफ़्ट",
  },
  logos: { poweredBy: "संचालित" },
  features: {
    eyebrow: "प्रोडक्ट",
    title: "कोल्ड सर्च से डिलीवर की गई वेबसाइट तक",
    subtitle: "स्थानीय व्यवसाय ढूंढने और उन्हें क्लाइंट बनाने के लिए फ्रीलांसर या एजेंसी को चाहिए पूरा वर्कफ़्लो।",
    cards: [
      {
        t: "चैट-स्टाइल लीड फ़ाइंडर",
        b: "एक निच और लोकेशन बताएं। Sitagio Google Places से पूछता है और वेबसाइट स्टेटस तुरंत पहचान कर साफ़ सूची देता है।",
      },
      {
        t: "AI वेबसाइट बिल्डर",
        b: "किसी लीड को सेकंडों में मोबाइल-रेडी साइट में बदलें — व्यवसाय की अपनी भाषा में। लाइव प्रीव्यू, इनलाइन एडिट, एक्सपोर्ट।",
      },
      {
        t: "रजिस्ट्री क्रॉस-चेक",
        b: "फ़िनिश लीड्स को आधिकारिक YTJ रजिस्ट्री से मिलाया जाता है — बिज़नेस ID, इंडस्ट्री कोड, रजिस्ट्रेशन तारीख़।",
      },
      {
        t: "बिल्ट-इन CRM",
        b: "लीड की स्थिति नए से जीते हुए तक ट्रैक करें, टीम को आमंत्रित करें, और हर वर्कस्पेस अलग रखें।",
      },
      {
        t: "एक-क्लिक एक्सपोर्ट",
        b: "किसी भी लीड सूची को अपने आउटरीच टूल के लिए CSV में डाउनलोड करें, या तैयार साइट को होस्ट-रेडी फ़ाइलों के रूप में एक्सपोर्ट करें।",
      },
    ],
    tryTitle: "अपने शहर में आज़माएं",
    tryCta: "खोज शुरू करें",
  },
  how: {
    eyebrow: "यह कैसे काम करता है",
    title: "नए क्लाइंट तक तीन स्टेप",
    subtitle: "कोई स्क्रैपिंग नहीं, कोई स्प्रेडशीट नहीं — पूरी पाइपलाइन एक डैशबोर्ड में।",
    steps: [
      {
        t: "अपना लक्ष्य बताएं",
        b: "निच और शहर लिखें, रेडियस सेट करें। Sitagio पर्दे के पीछे Google Places से पूछता है।",
      },
      {
        t: "क्वालिफ़ाइड लीड पाएं",
        b: "देखें किसके पास वेबसाइट नहीं है, जहां उपलब्ध हो वहां रजिस्ट्री डेटा के साथ। फ़िल्टर करें, टैग करें, एक्सपोर्ट करें।",
      },
      {
        t: "उनकी वेबसाइट डिलीवर करें",
        b: "असली बिज़नेस डेटा से स्थानीय भाषा में पॉलिश्ड साइट जनरेट करें। प्रीव्यू करें, ट्यून करें, सौंप दें।",
      },
    ],
  },
  pricing: {
    eyebrow: "कीमतें",
    title: "सरल, पारदर्शी प्लान",
    subtitle: "प्लान चुनें और आज ही €20/माह से शुरू करें। जब चाहें रद्द करें — भुगतान Stripe संभालता है।",
    badge: "सबसे लोकप्रिय",
    period: "/माह",
    note: "कीमतें EUR में, जहां लागू हो वहां VAT।",
    tiers: [
      {
        name: "Standard",
        desc: "फ्रीलांसरों और सोलो मार्केटर्स के लिए।",
        cta: "शुरू करें",
        features: [
          "50 लीड खोजें / माह",
          "15 AI वेबसाइटें / माह",
          "वेबसाइट मैसेज इनबॉक्स",
          "1 सीट",
          "रजिस्ट्री क्रॉस-चेक (FI)",
          "CSV एक्सपोर्ट",
        ],
      },
      {
        name: "Pro",
        desc: "बड़े पैमाने पर चलने वाली एजेंसियों के लिए।",
        cta: "शुरू करें",
        features: [
          "5,000 लीड खोजें / माह",
          "500 AI वेबसाइटें / माह",
          "एक-क्लिक खरीद वाले AI पिच ईमेल",
          "5 टीम सीटें",
          "प्राथमिकता AI जनरेशन",
          "Standard की सब कुछ",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "सवाल, जवाब के साथ",
    side: "कुछ और? support@sitovaiagency.com पर ईमेल करें — हम एक कार्यदिवस के भीतर जवाब देते हैं।",
    items: [
      {
        q: "लीड डेटा कहां से आता है?",
        a: "Google Places API से लाइव — दुनिया में कहीं भी। फ़िनिश लीड्स को आधिकारिक YTJ / PRH बिज़नेस रजिस्ट्री से भी क्रॉस-चेक किया जाता है। कुछ भी स्क्रैप नहीं होता।",
      },
      {
        q: "Sitagio को कैसे पता चलता है कि व्यवसाय की वेबसाइट नहीं है?",
        a: "Google Places बताता है कि व्यवसाय की वेबसाइट सूचीबद्ध है या नहीं। Sitagio बिना वेबसाइट वालों को फ़्लैग करता है — और फ़िनिश कंपनियों के लिए YTJ रजिस्ट्री में सक्रिय होने की पुष्टि भी करता है।",
      },
      {
        q: "क्या जनरेट की गई वेबसाइटें मेरी होती हैं?",
        a: "हां। हर जनरेट की गई साइट स्टैंडर्ड HTML/CSS फ़ाइलों के रूप में एक्सपोर्ट हो सकती है, जिन्हें आप कहीं भी होस्ट कर सकते हैं और क्लाइंट को बेच सकते हैं — कोई लॉक-इन नहीं, कोई Sitagio ब्रांडिंग नहीं।",
      },
      {
        q: "जनरेट की गई साइटें किस भाषा में होती हैं?",
        a: "साइटें व्यवसाय की अपनी भाषा में लिखी जाती हैं, जो लोकेशन से अपने-आप पहचानी जाती है — चुनने के लिए 10 भाषाएं (अंग्रेज़ी, फ़िनिश, स्वीडिश, जर्मन, स्पैनिश, मंदारिन और अधिक)। हर टेक्स्ट संपादन-योग्य है।",
      },
      {
        q: "क्या मैं कभी भी रद्द कर सकता/सकती हूं?",
        a: "हां। बिलिंग पेज से एक क्लिक में रद्द करें; आपका प्लान मौजूदा बिलिंग अवधि के अंत तक सक्रिय रहता है।",
      },
      {
        q: "मासिक सीमा पूरी होने पर क्या होता है?",
        a: "खोजें और साइट जनरेशन अगले बिलिंग चक्र तक रुक जाते हैं, या आप डैशबोर्ड से तुरंत Pro में अपग्रेड कर सकते हैं। आपके मौजूदा लीड और साइटें हमेशा उपलब्ध रहती हैं।",
      },
    ],
  },
  cta: {
    title: "आज ही बिना-वेबसाइट लीड ढूंढना शुरू करें",
    sub: "एक मिनट से कम में अपना वर्कस्पेस तैयार करें। पहला हफ़्ता हमारी ओर से।",
    button: "शुरू करें",
    note: "€20/माह से · कभी भी रद्द करें",
  },
  footer: {
    blurb: "बिना वेबसाइट वाले स्थानीय व्यवसाय ढूंढें और AI से उनकी वेबसाइट बनाएं — उनकी अपनी भाषा में, पहली खोज से डिलीवर की गई साइट तक।",
    product: "प्रोडक्ट",
    getStarted: "शुरू करें",
    createAccount: "खाता बनाएं",
    signIn: "साइन इन",
    rights: "सर्वाधिकार सुरक्षित।",
    privacy: "गोपनीयता",
    terms: "शर्तें",
    responseTime: "हम एक कार्यदिवस के भीतर जवाब देते हैं।",
    backToTop: "ऊपर जाएँ",
  },
};

const fr: LandingDict = {
  meta: {
    title: "Sitagio — trouvez les entreprises sans site et créez-le avec l'IA",
    description: "Sitagio repère via Google Places les entreprises locales sans site web et leur crée des sites IA prêts à publier, dans leur propre langue, depuis un seul tableau de bord.",
  },
  nav: {
    features: "Fonctionnalités",
    how: "Comment ça marche",
    pricing: "Tarifs",
    faq: "FAQ",
    signIn: "Connexion",
    getStarted: "Commencer",
  },
  hero: {
    badge: "En ligne · chasseur de leads + créateur de sites IA",
    title1: "Trouvez les entreprises sans site web.",
    title2: "Créez-leur-en un avec l'IA.",
    sub: "Sitagio scanne Google Places dans le monde entier, enrichit chaque lead avec des données de registre et transforme les meilleurs en sites web prêts à lancer — rédigés dans la langue de l'entreprise.",
    ctaPrimary: "Commencer",
    ctaSecondary: "Voir comment ça marche",
    stats: ["leads par recherche", "du lead au brouillon de site", "langues de site"],
  },
  preview: {
    query: "Barbiers · Tampere · 5 km",
    leadsFound: "12 leads trouvés",
    business: "Entreprise",
    registry: "Registre",
    noWebsite: "Pas de site",
    buildSite: "Créer le site",
    draftedSuffix: "brouillon en 42 s",
  },
  logos: { poweredBy: "Propulsé par" },
  features: {
    eyebrow: "Produit",
    title: "De la recherche à froid au site livré",
    subtitle: "Le workflow complet dont un freelance ou une agence a besoin pour trouver des entreprises locales et en faire des clients.",
    cards: [
      {
        t: "Recherche de leads façon chat",
        b: "Décrivez un créneau et un lieu. Sitagio interroge Google Places et renvoie une liste propre avec le statut du site web détecté instantanément.",
      },
      {
        t: "Créateur de sites IA",
        b: "Transformez un lead en site adapté au mobile en quelques secondes — dans la langue de l'entreprise. Aperçu en direct, édition inline, export.",
      },
      {
        t: "Vérification au registre",
        b: "Les leads finlandais sont croisés avec le registre officiel YTJ — identifiant d'entreprise, code d'activité, date d'immatriculation.",
      },
      {
        t: "CRM intégré",
        b: "Suivez le statut des leads de nouveau à gagné, invitez votre équipe et gardez chaque espace de travail isolé.",
      },
      {
        t: "Export en un clic",
        b: "Téléchargez toute liste de leads en CSV pour votre outil d'outreach, ou exportez un site fini en fichiers prêts à héberger.",
      },
    ],
    tryTitle: "Essayez-le dans votre ville",
    tryCta: "Lancer une recherche",
  },
  how: {
    eyebrow: "Comment ça marche",
    title: "Trois étapes vers un nouveau client",
    subtitle: "Pas de scraping, pas de tableurs — tout le pipeline vit dans un seul tableau de bord.",
    steps: [
      {
        t: "Décrivez votre cible",
        b: "Tapez un créneau et une ville, définissez un rayon. Sitagio interroge Google Places en coulisses.",
      },
      {
        t: "Recevez des leads qualifiés",
        b: "Voyez qui n'a pas de site, enrichi de données de registre quand elles existent. Filtrez, taguez, exportez.",
      },
      {
        t: "Livrez leur site web",
        b: "Générez un site soigné dans la langue locale à partir de vraies données d'entreprise. Prévisualisez, ajustez, livrez.",
      },
    ],
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Des offres simples et transparentes",
    subtitle: "Choisissez une offre et commencez aujourd'hui dès 20 €/mois. Annulez quand vous voulez — paiements gérés par Stripe.",
    badge: "Le plus populaire",
    period: "/mois",
    note: "Prix en EUR, TVA le cas échéant.",
    tiers: [
      {
        name: "Standard",
        desc: "Pour les freelances et marketeurs solo.",
        cta: "Commencer",
        features: [
          "50 recherches de leads / mois",
          "15 sites IA / mois",
          "Boîte de réception des messages du site",
          "1 siège",
          "Vérification au registre (FI)",
          "Export CSV",
        ],
      },
      {
        name: "Pro",
        desc: "Pour les agences qui tournent à l'échelle.",
        cta: "Commencer",
        features: [
          "5 000 recherches de leads / mois",
          "500 sites IA / mois",
          "Emails de prospection IA avec achat en un clic",
          "5 sièges d'équipe",
          "Génération IA prioritaire",
          "Tout Standard inclus",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Vos questions, nos réponses",
    side: "Autre chose ? Écrivez à support@sitovaiagency.com — nous répondons sous un jour ouvré.",
    items: [
      {
        q: "D'où viennent les données de leads ?",
        a: "En direct de l'API Google Places — partout dans le monde. Les leads finlandais sont en plus croisés avec le registre officiel YTJ / PRH. Rien n'est scrapé.",
      },
      {
        q: "Comment Sitagio sait-il qu'une entreprise n'a pas de site ?",
        a: "Google Places indique si une entreprise a un site web répertorié. Sitagio signale celles qui n'en ont pas — et vérifie en plus, pour les entreprises finlandaises, qu'elles sont actives au registre YTJ.",
      },
      {
        q: "Suis-je propriétaire des sites que je génère ?",
        a: "Oui. Chaque site généré peut être exporté en fichiers HTML/CSS standard que vous pouvez héberger n'importe où et vendre à votre client — sans verrouillage, sans marque Sitagio.",
      },
      {
        q: "Dans quelle langue sont les sites générés ?",
        a: "Les sites sont rédigés dans la langue de l'entreprise, détectée automatiquement à partir de sa localisation — avec 10 langues au choix (anglais, finnois, suédois, allemand, espagnol, mandarin et plus). Chaque texte est modifiable.",
      },
      {
        q: "Puis-je annuler à tout moment ?",
        a: "Oui. Vous pouvez annuler depuis la page de facturation en un clic ; votre offre reste active jusqu'à la fin de la période de facturation en cours.",
      },
      {
        q: "Que se passe-t-il quand j'atteins ma limite mensuelle ?",
        a: "Les recherches et générations de sites sont en pause jusqu'au cycle suivant, ou vous pouvez passer à Pro instantanément depuis le tableau de bord. Vos leads et sites existants restent toujours accessibles.",
      },
    ],
  },
  cta: {
    title: "Commencez dès aujourd'hui à trouver des leads sans site",
    sub: "Créez votre espace de travail en moins d'une minute. La première semaine est pour nous.",
    button: "Commencer",
    note: "Dès 20 €/mois · Annulation à tout moment",
  },
  footer: {
    blurb: "Trouvez les entreprises locales sans site web et créez-leur-en un avec l'IA — dans leur langue, de la première recherche au site livré.",
    product: "Produit",
    getStarted: "Commencer",
    createAccount: "Créer un compte",
    signIn: "Connexion",
    rights: "Tous droits réservés.",
    privacy: "Confidentialité",
    terms: "Conditions",
    responseTime: "Nous répondons sous un jour ouvré.",
    backToTop: "Retour en haut",
  },
};

const ar: LandingDict = {
  meta: {
    title: "Sitagio — اعثر على الأنشطة بلا موقع وابنِ لها موقعًا بالذكاء الاصطناعي",
    description: "يعثر Sitagio عبر Google Places على الأنشطة التجارية المحلية التي لا تملك موقعًا، ويبني لها مواقع جاهزة للنشر بالذكاء الاصطناعي وبلغتها، من لوحة واحدة.",
  },
  nav: {
    features: "المميزات",
    how: "كيف يعمل",
    pricing: "الأسعار",
    faq: "الأسئلة الشائعة",
    signIn: "تسجيل الدخول",
    getStarted: "ابدأ الآن",
  },
  hero: {
    badge: "مباشر · باحث عملاء + منشئ مواقع بالذكاء الاصطناعي",
    title1: "اعثر على الأنشطة التجارية بلا موقع إلكتروني.",
    title2: "وابنِ لها موقعًا بالذكاء الاصطناعي.",
    sub: "يمسح Sitagio خرائط Google Places حول العالم، ويثري كل عميل محتمل ببيانات السجلات، ويحوّل الأفضل منها إلى مواقع جاهزة للإطلاق — مكتوبة بلغة النشاط التجاري نفسه.",
    ctaPrimary: "ابدأ الآن",
    ctaSecondary: "شاهد كيف يعمل",
    stats: ["عميل محتمل لكل بحث", "من العميل إلى مسودة الموقع", "لغات للمواقع"],
  },
  preview: {
    query: "صالونات حلاقة · تامبيري · 5 كم",
    leadsFound: "تم العثور على 12 عميلًا",
    business: "النشاط",
    registry: "السجل",
    noWebsite: "بلا موقع",
    buildSite: "أنشئ الموقع",
    draftedSuffix: "مسودة خلال 42 ثانية",
  },
  logos: { poweredBy: "مدعوم من" },
  features: {
    eyebrow: "المنتج",
    title: "من البحث البارد إلى موقع مُسلَّم",
    subtitle: "سير العمل الكامل الذي يحتاجه المستقل أو الوكالة للعثور على الأنشطة المحلية وكسبها كعملاء.",
    cards: [
      {
        t: "باحث عملاء بأسلوب المحادثة",
        b: "صف مجالًا وموقعًا. يستعلم Sitagio من Google Places ويعيد قائمة نظيفة مع كشف حالة الموقع فورًا.",
      },
      {
        t: "منشئ مواقع بالذكاء الاصطناعي",
        b: "حوّل عميلًا محتملًا إلى موقع جاهز للجوال في ثوانٍ — بلغة النشاط نفسه. معاينة مباشرة، تحرير مباشر، تصدير.",
      },
      {
        t: "تدقيق بالسجل الرسمي",
        b: "تُطابق العملاء الفنلنديون مع سجل YTJ الرسمي — رقم الشركة، رمز القطاع، تاريخ التسجيل.",
      },
      {
        t: "إدارة علاقات مدمجة",
        b: "تتبّع حالة العميل من جديد إلى مكسوب، وادعُ فريقك، وأبقِ كل مساحة عمل معزولة.",
      },
      {
        t: "تصدير بنقرة واحدة",
        b: "نزّل أي قائمة عملاء بصيغة CSV لأداة التواصل لديك، أو صدّر موقعًا مكتملًا كملفات جاهزة للاستضافة.",
      },
    ],
    tryTitle: "جرّبه في مدينتك",
    tryCta: "ابدأ بحثًا",
  },
  how: {
    eyebrow: "كيف يعمل",
    title: "ثلاث خطوات نحو عميل جديد",
    subtitle: "لا كشط بيانات ولا جداول — خط الإنتاج كله يعيش في لوحة تحكم واحدة.",
    steps: [
      {
        t: "صف هدفك",
        b: "اكتب مجالًا ومدينة وحدد نصف القطر. يستعلم Sitagio من Google Places في الخلفية.",
      },
      {
        t: "احصل على عملاء مؤهلين",
        b: "اعرف من لا يملك موقعًا، مع بيانات السجل حيثما توفرت. رشّح ووسم وصدّر.",
      },
      {
        t: "سلّم موقعهم",
        b: "أنشئ موقعًا متقنًا باللغة المحلية من بيانات النشاط الحقيقية. عاين وعدّل وسلّم.",
      },
    ],
  },
  pricing: {
    eyebrow: "الأسعار",
    title: "خطط بسيطة وشفافة",
    subtitle: "اختر خطة وابدأ اليوم من 20 € شهريًا. ألغِ متى شئت — المدفوعات عبر Stripe.",
    badge: "الأكثر شيوعًا",
    period: "/شهر",
    note: "الأسعار باليورو، وضريبة القيمة المضافة حيثما تنطبق.",
    tiers: [
      {
        name: "Standard",
        desc: "للمستقلين والمسوّقين الأفراد.",
        cta: "ابدأ الآن",
        features: [
          "50 بحث عملاء / شهر",
          "15 موقعًا بالذكاء الاصطناعي / شهر",
          "صندوق رسائل الموقع",
          "مقعد واحد",
          "تدقيق بالسجل (فنلندا)",
          "تصدير CSV",
        ],
      },
      {
        name: "Pro",
        desc: "للوكالات العاملة على نطاق واسع.",
        cta: "ابدأ الآن",
        features: [
          "5,000 بحث عملاء / شهر",
          "500 موقع بالذكاء الاصطناعي / شهر",
          "رسائل عرض بالذكاء الاصطناعي مع شراء بنقرة",
          "5 مقاعد للفريق",
          "أولوية في التوليد",
          "كل ما في Standard",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "الأسئلة الشائعة",
    title: "أسئلة وأجوبة",
    side: "شيء آخر؟ راسلنا على support@sitovaiagency.com — نرد خلال يوم عمل واحد.",
    items: [
      {
        q: "من أين تأتي بيانات العملاء؟",
        a: "مباشرة من واجهة Google Places — في أي مكان في العالم. ويُدقَّق العملاء الفنلنديون إضافيًا مع سجل YTJ / PRH الرسمي. لا شيء يُكشط.",
      },
      {
        q: "كيف يعرف Sitagio أن النشاط بلا موقع؟",
        a: "تُبلغ Google Places عمّا إذا كان للنشاط موقع مُدرج. يعلّم Sitagio الأنشطة التي بلا موقع — وللشركات الفنلندية يتحقق أيضًا من نشاطها في سجل YTJ.",
      },
      {
        q: "هل أملك المواقع التي أنشئها؟",
        a: "نعم. كل موقع مُنشأ يمكن تصديره كملفات HTML/CSS قياسية تستضيفها أينما شئت وتبيعها لعميلك — بلا قيود وبلا علامة Sitagio.",
      },
      {
        q: "بأي لغة تُكتب المواقع المُنشأة؟",
        a: "تُكتب المواقع بلغة النشاط نفسه، وتُكتشف تلقائيًا من موقعه — مع 10 لغات للاختيار (الإنجليزية، الفنلندية، السويدية، الألمانية، الإسبانية، الماندرين وغيرها). كل نص قابل للتعديل.",
      },
      {
        q: "هل يمكنني الإلغاء في أي وقت؟",
        a: "نعم. يمكنك الإلغاء من صفحة الفوترة بنقرة واحدة؛ وتبقى خطتك فعالة حتى نهاية فترة الفوترة الحالية.",
      },
      {
        q: "ماذا يحدث عند بلوغ الحد الشهري؟",
        a: "تتوقف عمليات البحث وإنشاء المواقع حتى دورة الفوترة التالية، أو يمكنك الترقية إلى Pro فورًا من لوحة التحكم. يظل عملاؤك ومواقعك الحالية متاحة دائمًا.",
      },
    ],
  },
  cta: {
    title: "ابدأ اليوم بالعثور على عملاء بلا مواقع",
    sub: "جهّز مساحة عملك في أقل من دقيقة. أسبوعك الأول علينا.",
    button: "ابدأ الآن",
    note: "من 20 € شهريًا · إلغاء في أي وقت",
  },
  footer: {
    blurb: "اعثر على الأنشطة المحلية بلا موقع إلكتروني وابنِ لها واحدًا بالذكاء الاصطناعي — بلغتها، من أول بحث إلى موقع مُسلَّم.",
    product: "المنتج",
    getStarted: "ابدأ الآن",
    createAccount: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    rights: "جميع الحقوق محفوظة.",
    privacy: "الخصوصية",
    terms: "الشروط",
    responseTime: "نرد خلال يوم عمل واحد.",
    backToTop: "العودة إلى الأعلى",
  },
};

const pt: LandingDict = {
  meta: {
    title: "Sitagio — encontre negócios sem site e crie um com IA",
    description: "O Sitagio encontra negócios locais sem site através do Google Places e cria-lhes sites com IA prontos a publicar, no idioma deles, a partir de um único painel.",
  },
  nav: {
    features: "Recursos",
    how: "Como funciona",
    pricing: "Preços",
    faq: "FAQ",
    signIn: "Entrar",
    getStarted: "Começar",
  },
  hero: {
    badge: "No ar · localizador de leads + criador de sites com IA",
    title1: "Encontre negócios sem site.",
    title2: "Crie um para eles com IA.",
    sub: "O Sitagio varre o Google Places no mundo todo, enriquece cada lead com dados de registro e transforma os melhores em sites prontos para lançar — escritos no idioma do próprio negócio.",
    ctaPrimary: "Começar",
    ctaSecondary: "Ver como funciona",
    stats: ["leads por busca", "do lead ao rascunho do site", "idiomas de site"],
  },
  preview: {
    query: "Barbearias · Tampere · 5 km",
    leadsFound: "12 leads encontrados",
    business: "Negócio",
    registry: "Registro",
    noWebsite: "Sem site",
    buildSite: "Criar site",
    draftedSuffix: "rascunho em 42 s",
  },
  logos: { poweredBy: "Com tecnologia de" },
  features: {
    eyebrow: "Produto",
    title: "Da busca fria ao site entregue",
    subtitle: "O fluxo completo que um freelancer ou agência precisa para encontrar negócios locais e conquistá-los como clientes.",
    cards: [
      {
        t: "Busca de leads estilo chat",
        b: "Descreva um nicho e um local. O Sitagio consulta o Google Places e devolve uma lista limpa com o status do site detectado na hora.",
      },
      {
        t: "Criador de sites com IA",
        b: "Transforme um lead em um site pronto para celular em segundos — no idioma do negócio. Pré-visualize ao vivo, edite inline, exporte.",
      },
      {
        t: "Checagem no registro",
        b: "Leads finlandeses são cruzados com o registro oficial YTJ — ID da empresa, código do setor, data de registro.",
      },
      {
        t: "CRM embutido",
        b: "Acompanhe o status do lead de novo a fechado, convide sua equipe e mantenha cada workspace isolado.",
      },
      {
        t: "Exportação em um clique",
        b: "Baixe qualquer lista de leads em CSV para sua ferramenta de outreach, ou exporte um site pronto como arquivos prontos para hospedar.",
      },
    ],
    tryTitle: "Experimente na sua cidade",
    tryCta: "Iniciar uma busca",
  },
  how: {
    eyebrow: "Como funciona",
    title: "Três passos até um novo cliente",
    subtitle: "Sem scraping, sem planilhas — o pipeline inteiro vive em um só painel.",
    steps: [
      {
        t: "Descreva seu alvo",
        b: "Digite um nicho e uma cidade, defina um raio. O Sitagio consulta o Google Places nos bastidores.",
      },
      {
        t: "Receba leads qualificados",
        b: "Veja quem não tem site, com dados de registro quando disponíveis. Filtre, marque e exporte.",
      },
      {
        t: "Entregue o site deles",
        b: "Gere um site caprichado no idioma local a partir de dados reais do negócio. Pré-visualize, ajuste, entregue.",
      },
    ],
  },
  pricing: {
    eyebrow: "Preços",
    title: "Planos simples e transparentes",
    subtitle: "Escolha um plano e comece hoje a partir de €20/mês. Cancele quando quiser — pagamentos via Stripe.",
    badge: "Mais popular",
    period: "/mês",
    note: "Preços em EUR, IVA quando aplicável.",
    tiers: [
      {
        name: "Standard",
        desc: "Para freelancers e marketers solo.",
        cta: "Começar",
        features: [
          "50 buscas de leads / mês",
          "15 sites com IA / mês",
          "Caixa de mensagens do site",
          "1 assento",
          "Checagem no registro (FI)",
          "Exportação CSV",
        ],
      },
      {
        name: "Pro",
        desc: "Para agências operando em escala.",
        cta: "Começar",
        features: [
          "5.000 buscas de leads / mês",
          "500 sites com IA / mês",
          "E-mails de venda com IA e compra em um clique",
          "5 assentos de equipe",
          "Geração com IA prioritária",
          "Tudo do Standard",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Perguntas, respondidas",
    side: "Algo mais? Escreva para support@sitovaiagency.com — respondemos em um dia útil.",
    items: [
      {
        q: "De onde vêm os dados de leads?",
        a: "Ao vivo da API do Google Places — em qualquer lugar do mundo. Leads finlandeses ainda são cruzados com o registro oficial YTJ / PRH. Nada é raspado.",
      },
      {
        q: "Como o Sitagio sabe que um negócio não tem site?",
        a: "O Google Places informa se o negócio tem site listado. O Sitagio marca os que não têm — e, para empresas finlandesas, ainda verifica se estão ativas no registro YTJ.",
      },
      {
        q: "Os sites que eu gero são meus?",
        a: "Sim. Todo site gerado pode ser exportado como arquivos HTML/CSS padrão, que você hospeda onde quiser e vende ao seu cliente — sem lock-in, sem marca Sitagio.",
      },
      {
        q: "Em que idioma ficam os sites gerados?",
        a: "Os sites são escritos no idioma do próprio negócio, detectado automaticamente pela localização — com 10 idiomas à escolha (inglês, finlandês, sueco, alemão, espanhol, mandarim e mais). Todo texto é editável.",
      },
      {
        q: "Posso cancelar a qualquer momento?",
        a: "Sim. Você cancela na página de cobrança com um clique; seu plano segue ativo até o fim do período de cobrança atual.",
      },
      {
        q: "O que acontece quando atinjo meu limite mensal?",
        a: "Buscas e gerações pausam até o próximo ciclo, ou você pode fazer upgrade para o Pro na hora pelo painel. Seus leads e sites existentes continuam sempre acessíveis.",
      },
    ],
  },
  cta: {
    title: "Comece hoje a encontrar leads sem site",
    sub: "Monte seu workspace em menos de um minuto. A primeira semana é por nossa conta.",
    button: "Começar",
    note: "A partir de €20/mês · Cancele quando quiser",
  },
  footer: {
    blurb: "Encontre negócios locais sem site e crie um para eles com IA — no idioma deles, da primeira busca ao site entregue.",
    product: "Produto",
    getStarted: "Começar",
    createAccount: "Criar conta",
    signIn: "Entrar",
    rights: "Todos os direitos reservados.",
    privacy: "Privacidade",
    terms: "Termos",
    responseTime: "Respondemos em um dia útil.",
    backToTop: "Voltar ao topo",
  },
};

const ru: LandingDict = {
  meta: {
    title: "Sitagio — находите бизнесы без сайта и создавайте им сайт с ИИ",
    description: "Sitagio находит через Google Places локальные компании без сайта и создаёт им готовые к запуску сайты на ИИ на их языке — всё из одной панели.",
  },
  nav: {
    features: "Возможности",
    how: "Как это работает",
    pricing: "Цены",
    faq: "FAQ",
    signIn: "Войти",
    getStarted: "Начать",
  },
  hero: {
    badge: "Работает · поиск лидов + ИИ-конструктор сайтов",
    title1: "Находите бизнесы без сайта.",
    title2: "Создавайте им сайт с ИИ.",
    sub: "Sitagio сканирует Google Places по всему миру, обогащает каждый лид данными реестра и превращает лучшие в готовые к запуску сайты — написанные на языке самого бизнеса.",
    ctaPrimary: "Начать",
    ctaSecondary: "Посмотреть, как это работает",
    stats: ["лидов за поиск", "от лида до черновика сайта", "языков сайтов"],
  },
  preview: {
    query: "Барбершопы · Тампере · 5 км",
    leadsFound: "Найдено 12 лидов",
    business: "Бизнес",
    registry: "Реестр",
    noWebsite: "Нет сайта",
    buildSite: "Создать сайт",
    draftedSuffix: "черновик за 42 с",
  },
  logos: { poweredBy: "Работает на" },
  features: {
    eyebrow: "Продукт",
    title: "От холодного поиска до готового сайта",
    subtitle: "Полный рабочий процесс, который нужен фрилансеру или агентству, чтобы находить местные бизнесы и превращать их в клиентов.",
    cards: [
      {
        t: "Поиск лидов в формате чата",
        b: "Опишите нишу и локацию. Sitagio запрашивает Google Places и возвращает чистый список с мгновенно определённым статусом сайта.",
      },
      {
        t: "ИИ-конструктор сайтов",
        b: "Превратите лид в адаптивный сайт за секунды — на языке бизнеса. Предпросмотр вживую, правка на месте, экспорт.",
      },
      {
        t: "Сверка с реестром",
        b: "Финские лиды сверяются с официальным реестром YTJ — ИНН, код отрасли, дата регистрации.",
      },
      {
        t: "Встроенный CRM",
        b: "Отслеживайте статус лида от нового до выигранного, приглашайте команду и держите каждое рабочее пространство изолированным.",
      },
      {
        t: "Экспорт в один клик",
        b: "Скачайте любой список лидов в CSV для вашего инструмента аутрича или экспортируйте готовый сайт файлами, готовыми к хостингу.",
      },
    ],
    tryTitle: "Попробуйте на своём городе",
    tryCta: "Начать поиск",
  },
  how: {
    eyebrow: "Как это работает",
    title: "Три шага до нового клиента",
    subtitle: "Без скрейпинга и таблиц — весь конвейер живёт в одном дашборде.",
    steps: [
      {
        t: "Опишите цель",
        b: "Введите нишу и город, задайте радиус. Sitagio запрашивает Google Places за кулисами.",
      },
      {
        t: "Получите качественные лиды",
        b: "Смотрите, у кого нет сайта, с данными реестра, где они доступны. Фильтруйте, помечайте, экспортируйте.",
      },
      {
        t: "Сдайте им сайт",
        b: "Сгенерируйте аккуратный сайт на местном языке из настоящих данных бизнеса. Просмотрите, доработайте, передайте.",
      },
    ],
  },
  pricing: {
    eyebrow: "Цены",
    title: "Простые и прозрачные тарифы",
    subtitle: "Выберите тариф и начните сегодня от €20/мес. Отменяйте когда угодно — платежи обрабатывает Stripe.",
    badge: "Самый популярный",
    period: "/мес",
    note: "Цены в евро, НДС где применимо.",
    tiers: [
      {
        name: "Standard",
        desc: "Для фрилансеров и соло-маркетологов.",
        cta: "Начать",
        features: [
          "50 поисков лидов / мес",
          "15 ИИ-сайтов / мес",
          "Входящие сообщения с сайта",
          "1 место",
          "Сверка с реестром (FI)",
          "Экспорт CSV",
        ],
      },
      {
        name: "Pro",
        desc: "Для агентств, работающих в масштабе.",
        cta: "Начать",
        features: [
          "5 000 поисков лидов / мес",
          "500 ИИ-сайтов / мес",
          "ИИ-письма с покупкой в один клик",
          "5 мест в команде",
          "Приоритетная генерация",
          "Всё из Standard",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Вопросы и ответы",
    side: "Остались вопросы? Напишите на support@sitovaiagency.com — отвечаем в течение одного рабочего дня.",
    items: [
      {
        q: "Откуда берутся данные о лидах?",
        a: "Напрямую из API Google Places — в любой точке мира. Финские лиды дополнительно сверяются с официальным бизнес-реестром YTJ / PRH. Ничего не скрейпится.",
      },
      {
        q: "Как Sitagio понимает, что у бизнеса нет сайта?",
        a: "Google Places сообщает, указан ли у бизнеса сайт. Sitagio помечает тех, у кого его нет — а у финских компаний дополнительно проверяет активность в реестре YTJ.",
      },
      {
        q: "Принадлежат ли мне сгенерированные сайты?",
        a: "Да. Каждый сгенерированный сайт можно экспортировать как стандартные HTML/CSS-файлы, разместить где угодно и продать клиенту — без привязки и без брендинга Sitagio.",
      },
      {
        q: "На каком языке создаются сайты?",
        a: "Сайты пишутся на языке самого бизнеса, определяемом автоматически по его локации — на выбор 10 языков (английский, финский, шведский, немецкий, испанский, китайский и другие). Любой текст можно править.",
      },
      {
        q: "Можно ли отменить подписку в любой момент?",
        a: "Да. Отмена — в один клик на странице оплаты; тариф действует до конца текущего расчётного периода.",
      },
      {
        q: "Что будет при достижении месячного лимита?",
        a: "Поиски и генерации приостанавливаются до следующего цикла, либо можно мгновенно перейти на Pro из дашборда. Ваши лиды и сайты всегда остаются доступными.",
      },
    ],
  },
  cta: {
    title: "Начните находить лиды без сайта уже сегодня",
    sub: "Разверните рабочее пространство меньше чем за минуту. Первая неделя — за наш счёт.",
    button: "Начать",
    note: "От €20/мес · Отмена в любой момент",
  },
  footer: {
    blurb: "Находите местные бизнесы без сайта и создавайте им сайт с ИИ — на их языке, от первого поиска до готового сайта.",
    product: "Продукт",
    getStarted: "Начать",
    createAccount: "Создать аккаунт",
    signIn: "Войти",
    rights: "Все права защищены.",
    privacy: "Конфиденциальность",
    terms: "Условия",
    responseTime: "Отвечаем в течение одного рабочего дня.",
    backToTop: "Наверх",
  },
};

const de: LandingDict = {
  meta: {
    title: "Sitagio — Unternehmen ohne Website finden und ihnen eine mit KI bauen",
    description: "Sitagio findet über Google Places lokale Unternehmen ohne Website und baut ihnen startklare KI-Websites in ihrer eigenen Sprache, alles aus einem Dashboard.",
  },
  nav: {
    features: "Funktionen",
    how: "So funktioniert's",
    pricing: "Preise",
    faq: "FAQ",
    signIn: "Anmelden",
    getStarted: "Loslegen",
  },
  hero: {
    badge: "Live · Lead-Finder + KI-Website-Builder",
    title1: "Finde Unternehmen ohne Website.",
    title2: "Bau ihnen eine mit KI.",
    sub: "Sitagio scannt Google Places weltweit, reichert jeden Lead mit Registerdaten an und verwandelt die besten in startklare Websites — geschrieben in der Sprache des Unternehmens.",
    ctaPrimary: "Loslegen",
    ctaSecondary: "So funktioniert's",
    stats: ["Leads pro Suche", "vom Lead zum Website-Entwurf", "Website-Sprachen"],
  },
  preview: {
    query: "Barbershops · Tampere · 5 km",
    leadsFound: "12 Leads gefunden",
    business: "Unternehmen",
    registry: "Register",
    noWebsite: "Keine Website",
    buildSite: "Website bauen",
    draftedSuffix: "Entwurf in 42 s",
  },
  logos: { poweredBy: "Powered by" },
  features: {
    eyebrow: "Produkt",
    title: "Von der Kaltsuche zur fertigen Website",
    subtitle: "Der komplette Workflow, den Freelancer oder Agenturen brauchen, um lokale Unternehmen zu finden und als Kunden zu gewinnen.",
    cards: [
      {
        t: "Lead-Finder im Chat-Stil",
        b: "Beschreibe Nische und Ort. Sitagio fragt Google Places ab und liefert eine saubere Liste mit sofort erkanntem Website-Status.",
      },
      {
        t: "KI-Website-Builder",
        b: "Verwandle einen Lead in Sekunden in eine mobile-taugliche Website — in der Sprache des Unternehmens. Live-Vorschau, Inline-Bearbeitung, Export.",
      },
      {
        t: "Register-Abgleich",
        b: "Finnische Leads werden mit dem offiziellen YTJ-Register abgeglichen — Firmen-ID, Branchencode, Registrierungsdatum.",
      },
      {
        t: "Eingebautes CRM",
        b: "Verfolge den Lead-Status von neu bis gewonnen, lade dein Team ein und halte jeden Workspace getrennt.",
      },
      {
        t: "Ein-Klick-Export",
        b: "Lade jede Lead-Liste als CSV für dein Outreach-Tool herunter oder exportiere eine fertige Website als hosting-fertige Dateien.",
      },
    ],
    tryTitle: "Probier's in deiner eigenen Stadt",
    tryCta: "Suche starten",
  },
  how: {
    eyebrow: "So funktioniert's",
    title: "Drei Schritte zum neuen Kunden",
    subtitle: "Kein Scraping, keine Tabellen — die ganze Pipeline lebt in einem Dashboard.",
    steps: [
      {
        t: "Beschreibe dein Ziel",
        b: "Nische und Stadt eintippen, Radius festlegen. Sitagio fragt im Hintergrund Google Places ab.",
      },
      {
        t: "Erhalte qualifizierte Leads",
        b: "Sieh, wer keine Website hat, angereichert mit Registerdaten, wo verfügbar. Filtern, taggen, exportieren.",
      },
      {
        t: "Liefere ihre Website",
        b: "Generiere eine polierte Website in der Landessprache aus echten Unternehmensdaten. Vorschau, Feinschliff, Übergabe.",
      },
    ],
  },
  pricing: {
    eyebrow: "Preise",
    title: "Einfache, transparente Tarife",
    subtitle: "Wähle einen Tarif und starte heute ab 20 €/Monat. Jederzeit kündbar — Zahlungen über Stripe.",
    badge: "Am beliebtesten",
    period: "/Monat",
    note: "Preise in EUR, ggf. zzgl. MwSt.",
    tiers: [
      {
        name: "Standard",
        desc: "Für Freelancer und Solo-Marketer.",
        cta: "Loslegen",
        features: [
          "50 Lead-Suchen / Monat",
          "15 KI-Websites / Monat",
          "Website-Nachrichten-Inbox",
          "1 Platz",
          "Register-Abgleich (FI)",
          "CSV-Export",
        ],
      },
      {
        name: "Pro",
        desc: "Für Agenturen im großen Maßstab.",
        cta: "Loslegen",
        features: [
          "5.000 Lead-Suchen / Monat",
          "500 KI-Websites / Monat",
          "KI-Pitch-Mails mit Ein-Klick-Kauf",
          "5 Team-Plätze",
          "Priorisierte KI-Generierung",
          "Alles aus Standard",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Fragen, beantwortet",
    side: "Noch etwas? Schreib an support@sitovaiagency.com — wir antworten innerhalb eines Werktags.",
    items: [
      {
        q: "Woher kommen die Lead-Daten?",
        a: "Live aus der Google-Places-API — überall auf der Welt. Finnische Leads werden zusätzlich mit dem offiziellen YTJ/PRH-Handelsregister abgeglichen. Nichts wird gescrapt.",
      },
      {
        q: "Woher weiß Sitagio, dass ein Unternehmen keine Website hat?",
        a: "Google Places meldet, ob eine Website hinterlegt ist. Sitagio markiert die ohne — und prüft bei finnischen Firmen zusätzlich, ob sie im YTJ-Register aktiv sind.",
      },
      {
        q: "Gehören mir die generierten Websites?",
        a: "Ja. Jede generierte Website lässt sich als Standard-HTML/CSS-Dateien exportieren, die du überall hosten und an deinen Kunden verkaufen kannst — kein Lock-in, kein Sitagio-Branding.",
      },
      {
        q: "In welcher Sprache sind die generierten Websites?",
        a: "Die Websites werden in der Sprache des Unternehmens geschrieben, automatisch anhand des Standorts erkannt — mit 10 Sprachen zur Auswahl (Englisch, Finnisch, Schwedisch, Deutsch, Spanisch, Mandarin u. a.). Jeder Text ist editierbar.",
      },
      {
        q: "Kann ich jederzeit kündigen?",
        a: "Ja. Du kündigst mit einem Klick auf der Abrechnungsseite; dein Tarif bleibt bis zum Ende des laufenden Abrechnungszeitraums aktiv.",
      },
      {
        q: "Was passiert, wenn ich mein Monatslimit erreiche?",
        a: "Suchen und Website-Generierungen pausieren bis zum nächsten Zyklus, oder du upgradest sofort im Dashboard auf Pro. Deine bestehenden Leads und Websites bleiben immer zugänglich.",
      },
    ],
  },
  cta: {
    title: "Finde noch heute Leads ohne Website",
    sub: "Richte deinen Workspace in unter einer Minute ein. Die erste Woche geht auf uns.",
    button: "Loslegen",
    note: "Ab 20 €/Monat · Jederzeit kündbar",
  },
  footer: {
    blurb: "Finde lokale Unternehmen ohne Website und bau ihnen eine mit KI — in ihrer Sprache, von der ersten Suche bis zur fertigen Website.",
    product: "Produkt",
    getStarted: "Loslegen",
    createAccount: "Konto erstellen",
    signIn: "Anmelden",
    rights: "Alle Rechte vorbehalten.",
    privacy: "Datenschutz",
    terms: "AGB",
    responseTime: "Wir antworten innerhalb eines Werktags.",
    backToTop: "Nach oben",
  },
};

const ja: LandingDict = {
  meta: {
    title: "Sitagio — ウェブサイトのないビジネスを見つけ、AI でサイトを作る",
    description: "Sitagio は Google Places からウェブサイトを持たない地域のビジネスを見つけ、その言語のまま公開できる AI サイトを一つの管理画面から作成します。",
  },
  nav: {
    features: "機能",
    how: "仕組み",
    pricing: "料金",
    faq: "FAQ",
    signIn: "ログイン",
    getStarted: "始める",
  },
  hero: {
    badge: "稼働中 · リード検索 + AIサイトビルダー",
    title1: "ウェブサイトのないビジネスを見つける。",
    title2: "AIでサイトを作ってあげる。",
    sub: "Sitagioは世界中のGoogle Placesをスキャンし、各リードを登記データで補強し、有望なものを公開準備済みのウェブサイトに変えます — そのビジネス自身の言語で書かれたサイトです。",
    ctaPrimary: "始める",
    ctaSecondary: "仕組みを見る",
    stats: ["件のリード/検索", "リードからサイト草案まで", "のサイト言語"],
  },
  preview: {
    query: "理髪店 · タンペレ · 5 km",
    leadsFound: "12件のリード",
    business: "ビジネス",
    registry: "登記",
    noWebsite: "サイトなし",
    buildSite: "サイト作成",
    draftedSuffix: "42秒で草案完成",
  },
  logos: { poweredBy: "Powered by" },
  features: {
    eyebrow: "プロダクト",
    title: "コールドサーチから納品サイトまで",
    subtitle: "フリーランサーや代理店が地元ビジネスを見つけ、クライアントとして獲得するための完全なワークフロー。",
    cards: [
      {
        t: "チャット式リード検索",
        b: "業種と場所を書くだけ。SitagioがGoogle Placesに問い合わせ、サイト有無を即座に判定したクリーンなリストを返します。",
      },
      {
        t: "AIサイトビルダー",
        b: "リードを数秒でモバイル対応サイトに — そのビジネスの言語で。ライブプレビュー、インライン編集、エクスポート。",
      },
      {
        t: "登記との照合",
        b: "フィンランドのリードは公式YTJ登記簿と照合 — 事業者ID、業種コード、登記日。",
      },
      {
        t: "内蔵CRM",
        b: "リードの状態を新規から成約まで追跡し、チームを招待し、各ワークスペースを分離して管理。",
      },
      {
        t: "ワンクリックでエクスポート",
        b: "リードリストをCSVでダウンロードしてアウトリーチツールへ。完成サイトはホスティング可能なファイルとして書き出せます。",
      },
    ],
    tryTitle: "あなたの街で試してみる",
    tryCta: "検索を始める",
  },
  how: {
    eyebrow: "仕組み",
    title: "新規クライアントまで3ステップ",
    subtitle: "スクレイピングもスプレッドシートも不要 — パイプライン全体が1つのダッシュボードに。",
    steps: [
      {
        t: "ターゲットを記述",
        b: "業種と街を入力し、半径を設定。Sitagioが裏でGoogle Placesに問い合わせます。",
      },
      {
        t: "有望リードを取得",
        b: "サイトを持たないビジネスを、登記データ付きで確認。フィルタ、タグ付け、エクスポート。",
      },
      {
        t: "サイトを納品",
        b: "実際のビジネスデータから現地語の洗練されたサイトを生成。プレビューして微調整し、引き渡し。",
      },
    ],
  },
  pricing: {
    eyebrow: "料金",
    title: "シンプルで透明な料金",
    subtitle: "プランを選んで今日から月額€20で開始。いつでも解約可能 — 決済はStripeが処理。",
    badge: "一番人気",
    period: "/月",
    note: "価格はユーロ表示、該当する場合はVATを含む。",
    tiers: [
      {
        name: "Standard",
        desc: "フリーランサーや個人マーケター向け。",
        cta: "始める",
        features: [
          "リード検索 月50回",
          "AIサイト 月15件",
          "サイトのメッセージ受信箱",
          "1シート",
          "登記照合（フィンランド）",
          "CSVエクスポート",
        ],
      },
      {
        name: "Pro",
        desc: "スケールする代理店向け。",
        cta: "始める",
        features: [
          "リード検索 月5,000回",
          "AIサイト 月500件",
          "ワンクリック購入付きAI営業メール",
          "チーム5シート",
          "AI生成の優先処理",
          "Standardの全機能",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "よくある質問",
    side: "他にご質問は？ support@sitovaiagency.com までメールでお寄せください。1営業日以内に返信します。",
    items: [
      {
        q: "リードデータはどこから来ますか？",
        a: "Google Places APIからライブで取得 — 世界中どこでも。フィンランドのリードはさらに公式YTJ / PRH事業者登記簿と照合されます。スクレイピングは一切していません。",
      },
      {
        q: "サイトがないことをどう判定していますか？",
        a: "Google Placesはビジネスにサイトが登録されているかを報告します。Sitagioはサイトのないビジネスをフラグし、フィンランド企業についてはYTJ登記簿で活動中であることも確認します。",
      },
      {
        q: "生成したサイトの所有権は私にありますか？",
        a: "はい。生成されたサイトはすべて標準のHTML/CSSファイルとしてエクスポートでき、どこでもホスティングしてクライアントに販売できます — ロックインなし、Sitagioのブランド表示なし。",
      },
      {
        q: "生成されるサイトは何語ですか？",
        a: "サイトはビジネス自身の言語で書かれ、所在地から自動検出されます — 10言語から選択可能（英語、フィンランド語、スウェーデン語、ドイツ語、スペイン語、中国語など）。すべてのテキストは編集できます。",
      },
      {
        q: "いつでも解約できますか？",
        a: "はい。請求ページからワンクリックで解約できます。プランは現在の請求期間の終了まで有効です。",
      },
      {
        q: "月間上限に達するとどうなりますか？",
        a: "検索とサイト生成は次の請求サイクルまで一時停止するか、ダッシュボードから即座にProへアップグレードできます。既存のリードとサイトには常にアクセスできます。",
      },
    ],
  },
  cta: {
    title: "今日からサイトを持たないリードを見つけよう",
    sub: "1分以内にワークスペースを立ち上げ。最初の1週間は無料です。",
    button: "始める",
    note: "月額€20から · いつでも解約可能",
  },
  footer: {
    blurb: "ウェブサイトのない地元ビジネスを見つけ、AIでサイトを作る — 相手の言語で、最初の検索から納品まで。",
    product: "プロダクト",
    getStarted: "始める",
    createAccount: "アカウント作成",
    signIn: "ログイン",
    rights: "All rights reserved.",
    privacy: "プライバシー",
    terms: "利用規約",
    responseTime: "1営業日以内に返信します。",
    backToTop: "トップへ戻る",
  },
};

const DICTS: Record<LangCode, LandingDict> = { en, zh, hi, es, fr, ar, pt, ru, de, ja, fi };

type LangContextValue = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: LandingDict;
  dir: "ltr" | "rtl";
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: en,
  dir: "ltr",
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.some((l) => l.code === saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of the saved language on mount
      setLangState(saved as LangCode);
      return;
    }
    // First visit: auto-detect from the browser's preferred languages.
    const preferred = navigator.languages ?? [navigator.language];
    for (const tag of preferred) {
      const base = tag.toLowerCase().split("-")[0];
      const hit = LANGS.find((l) => l.code === base);
      if (hit) {
        setLangState(hit.code);
        return;
      }
    }
  }, []);

  // Switching language replaces every string on the page at once. Swapping it
  // instantly reads as a glitch, so we fade out, swap, and fade back in. Total
  // round trip ~240ms — a rare action, so it can afford a beat. Opacity only
  // (plus a hair of blur to mask the double-exposure); nothing moves, so this
  // stays honest under reduced motion.
  const [swapping, setSwapping] = useState(false);

  const setLang = (code: LangCode) => {
    if (code === lang) return;
    const commit = () => {
      setLangState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {}
    };
    if (typeof window === "undefined" || !window.matchMedia) return commit();
    setSwapping(true);
    window.setTimeout(() => {
      commit();
      setSwapping(false);
    }, 120);
  };

  const dir = (LANGS.find((l) => l.code === lang)?.dir ?? "ltr") as "ltr" | "rtl";

  // Mirror the active language onto <html> itself. The provider marks up its
  // own subtree, but the document element sits above it, so a Finnish visitor
  // was served Finnish body copy under lang="en" — which is what screen readers
  // and search engines actually read.
  //
  // Deliberately NOT touching <title> or the meta description here. Next
  // re-renders the head after this effect, which restores the title and leaves
  // a SECOND, conflicting description tag behind. Localising those correctly
  // needs locale-prefixed routes with their own metadata export (the way the
  // Vandio landing ships a server-rendered /fi), not imperative DOM edits.
  // The translated strings for that work already exist: every dictionary
  // carries a `meta: { title, description }` block, unused until then.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICTS[lang], dir }}>
      <div
        dir={dir}
        lang={lang}
        style={{
          opacity: swapping ? 0 : 1,
          filter: swapping ? "blur(2px)" : "blur(0px)",
          transition:
            "opacity 120ms var(--ease-out, ease-out), filter 120ms var(--ease-out, ease-out)",
        }}
      >
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLanding() {
  return useContext(LangContext);
}

export function LanguagePicker({ className }: { className?: string }) {
  const { lang, setLang } = useLanding();
  return (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/15 bg-white/[0.04] px-2 py-1.5 text-sm text-zinc-300 backdrop-blur transition hover:border-white/25 hover:text-white ${className ?? ""}`}
      title="Language"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
      <select
        aria-label="Language"
        value={lang}
        onChange={(e) => setLang(e.target.value as LangCode)}
        className="cursor-pointer bg-transparent text-sm outline-none"
        style={{ color: "inherit" }}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code} className="bg-[#0b0c12] text-zinc-200">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
