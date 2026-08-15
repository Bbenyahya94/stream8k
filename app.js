'use strict';

const whatsapp = '212678772627';

const products = [
  ['Dino IPTV', [10, 19, 29, 39], 1, 'Affordable worldwide IPTV with stable playback and fast activation.'],
  ['Lion OTT', [10, 19, 29, 39], 1, 'Family-focused entertainment with broad device compatibility.'],
  ['Crystal IPTV', [10, 19, 29, 39], 1, 'Anti-freeze delivery, broad channel coverage and straightforward setup.'],
  ['Nexon IPTV', [10, 19, 29, 39], 1, 'Fast European-focused IPTV with extensive on-demand options.'],
  ['Magnum OTT', [10, 19, 29, 39], 5, 'USA-focused premium OTT with up to five simultaneous connections.'],
  ['Mega OTT', [10, 19, 29, 39], 3, 'Versatile OTT with smooth live channels and up to three connections.'],
  ['Infinity IPTV', [20, 40, 55, 75], 2, 'Premium sports, movies and worldwide channels for up to two connections.'],
  ['Trex IPTV', [13, 25, 29.99, 49.99], 1, 'Popular premium IPTV with a large 4K and 8K-ready library.'],
  ['8K Strong', [13, 25, 29.99, 49.99], 1, 'High-resolution global IPTV for sports, films and live entertainment.'],
  ['Tivione IPTV', [13, 25, 29.99, 49.99], 1, 'TiviMate-compatible service designed for reliable family viewing.'],
  ['Ultra 8K', [12, 23, 33, 49], 1, 'Ultra-high-definition worldwide IPTV with 4K and 8K-ready options.'],
  ['Dream 24K', [12, 23, 33, 49], 1, 'Premium international IPTV with vivid quality and responsive support.']
];

const resellerPlans = [
  ['Dino IPTV', 120, 99],
  ['Trex IPTV', 120, 185],
  ['Nexon IPTV', 120, 79],
  ['Ultra 8K', 120, 190],
  ['8K Strong', 120, 190],
  ['Dream 24K', 120, 139],
  ['Lion OTT', 10, 79],
  ['Crystal IPTV', 10, 79],
  ['Magnum OTT', 10, 129],
  ['Mega OTT', 10, 99],
  ['Infinity IPTV', 10, 195],
  ['Tivione IPTV', 10, 190]
];

const logos = {
  '8K Strong': '8kstrong.webp',
  'Crystal IPTV': 'crystaliptv.webp',
  'Dino IPTV': 'dinoiptv.webp',
  'Dream 24K': 'dream24k.webp',
  'Infinity IPTV': 'infinityiptv.webp',
  'Lion OTT': 'lionott.webp',
  'Magnum OTT': 'magnumott.webp',
  'Mega OTT': 'megaott.webp',
  'Nexon IPTV': 'nexoniptv.webp',
  'Tivione IPTV': 'tivioneiptv.webp',
  'Trex IPTV': 'trexiptv.webp',
  'Ultra 8K': 'ultra8k.webp'
};

const selectedConnections = {};
const discountRates = {2: 0.05, 3: 0.10, 4: 0.15, 5: 0.20};
const discountLabels = {2: 5, 3: 10, 4: 15, 5: 20};
const periods = ['1 Month', '3 Months', '6 Months', '12 Months'];

function trackLead(productName, type) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', {
      item_name: productName,
      lead_type: type
    });
  }
}

function order(productName, type, details) {
  trackLead(productName, type);
  const message = `Hello, I want ${productName} ${type}: ${details}. Please send payment and activation details.`;
  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function connectionPrice(basePrice, connectionCount) {
  const discount = discountRates[connectionCount] || 0;
  return basePrice * connectionCount * (1 - discount);
}

function productLogo(name, context) {
  return `<img class="product-logo" src="/${logos[name]}" width="68" height="68" loading="lazy" decoding="async" alt="${name} ${context} logo" onerror="this.onerror=null;this.src='/logo.webp'">`;
}

function productCard(product) {
  const [name, prices, maximumConnections, description] = product;
  const connectionCount = selectedConnections[name] || 1;
  const connectionPicker = maximumConnections > 1
    ? `<div class="connection-picker" aria-label="Choose ${name} connections">${Array.from({length: maximumConnections}, (_, index) => index + 1).map((count) => `<button type="button" class="${count === connectionCount ? 'active' : ''}" data-product="${name}" data-count="${count}" aria-pressed="${count === connectionCount}">${count}${count > 1 ? ` · -${discountLabels[count]}%` : ''}</button>`).join('')}</div>`
    : '';
  const planButtons = prices.map((basePrice, index) => {
    const total = connectionPrice(basePrice, connectionCount);
    const details = `${periods[index]}, ${connectionCount} connection(s), €${total.toFixed(2)}`;
    return `<button type="button" data-order="${name}|subscription|${details}"><small>${periods[index]} · ${connectionCount} conn.</small><b>€${total.toFixed(2)}</b></button>`;
  }).join('');

  return `<article>${`<div class="product-head">${productLogo(name, 'subscription')}<div><h3>${name}</h3><small>Premium subscription</small></div></div>`}<p>${description}</p>${connectionPicker}<div class="prices">${planButtons}</div><div class="catalog-foot"><span>Up to ${maximumConnections} connection${maximumConnections > 1 ? 's' : ''}</span><button type="button" data-order="${name}|free trial|test account">Free trial →</button></div></article>`;
}

function renderSubscriptions() {
  const container = document.querySelector('#subscriptionsGrid');
  if (container) {
    container.innerHTML = products.map(productCard).join('');
  }
}

function renderResellers() {
  const container = document.querySelector('#resellersGrid');
  if (!container) {
    return;
  }

  container.innerHTML = resellerPlans.map(([name, credits, starterPrice]) => `<article><div class="product-head">${productLogo(name, 'reseller panel')}<div><h3>${name} Reseller</h3><small>Professional reseller panel</small></div></div><p>Wholesale credits, trial creation, customer lines and professional account-management tools.</p><div class="prices"><button type="button" data-order="${name}|reseller panel|${credits} credits, €${starterPrice}"><small>Starter · ${credits} credits</small><b>€${starterPrice}</b></button><button type="button" data-order="${name}|reseller panel|custom credit package"><small>Larger packages</small><b>Contact Sales</b></button></div><div class="catalog-foot"><span>Dashboard + trials</span><button type="button" data-order="${name}|reseller inquiry|custom package">Ask sales →</button></div></article>`).join('');
}

function renderDirectory() {
  const container = document.querySelector('#directoryGrid');
  if (!container) {
    return;
  }

  container.innerHTML = products.map(([name, , , description]) => `<article><h3>${name}</h3><p>${description}</p><a href="/subscription">Subscription plans →</a><br><a href="/reseller">Reseller credits →</a></article>`).join('');
}

const frequentlyAskedQuestions = [
  ['What is 8KStream?', '8KStream is the website and comparison brand, not the name of an IPTV server.'],
  ['Can I request a free trial?', 'Free-trial availability depends on the selected product and current server policy.'],
  ['Which devices are supported?', 'Popular options include Smart TV, Firestick, Android, Apple devices, computers, TV boxes and compatible MAG devices.'],
  ['How do multi-connections work?', 'They allow the selected number of simultaneous streams under one package. Discounts are calculated automatically for eligible products.'],
  ['How fast is activation?', 'Activation is normally processed after payment and order details are confirmed.'],
  ['Do you offer reseller panels?', 'Yes. Starter reseller prices and larger contact-sales packages are listed on the reseller page.']
];

function renderFaq() {
  const container = document.querySelector('#faqList');
  if (!container) {
    return;
  }

  container.innerHTML = frequentlyAskedQuestions.map(([question, answer]) => `<article><button type="button" aria-expanded="false">${question}<span aria-hidden="true">＋</span></button><div>${answer}</div></article>`).join('');
}

const translations = {
  en: ['Premium IPTV subscriptions.', 'Professional reseller panels.', 'Join viewers and resellers worldwide with premium subscriptions, professional reseller tools, flexible connections and support around the clock.', 'Engineered for effortless viewing', 'Choose your IPTV subscription', 'Start and scale your IPTV business', 'Questions, answered'],
  ar: ['اشتراكات IPTV مميزة.', 'لوحات موزعين احترافية.', 'انضم إلى المشاهدين والموزعين حول العالم مع اشتراكات مميزة واتصالات مرنة ودعم متواصل.', 'مصمم لمشاهدة سهلة', 'اختر اشتراك IPTV المناسب', 'ابدأ وطور مشروع IPTV الخاص بك', 'الأسئلة الشائعة'],
  es: ['Suscripciones IPTV premium.', 'Paneles profesionales para revendedores.', 'Planes premium, herramientas de reventa, conexiones flexibles y soporte continuo.', 'Diseñado para una experiencia sencilla', 'Elige tu suscripción IPTV', 'Inicia y amplía tu negocio IPTV', 'Preguntas frecuentes'],
  de: ['Premium IPTV-Abonnements.', 'Professionelle Reseller-Panels.', 'Premium-Abonnements, flexible Verbindungen, Reseller-Werkzeuge und laufender Support.', 'Für müheloses Streaming entwickelt', 'Wähle dein IPTV-Abonnement', 'Starte und skaliere dein IPTV-Geschäft', 'Häufige Fragen'],
  zh: ['高级 IPTV 订阅。', '专业经销商面板。', '提供高级订阅、灵活连接、经销商工具和全天候支持。', '专为轻松观看而设计', '选择您的 IPTV 订阅', '启动并扩展您的 IPTV 业务', '常见问题']
};

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setLanguage(language) {
  const text = translations[language] || translations.en;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';

  const heroHeading = document.querySelector('.hero h1');
  if (heroHeading) {
    heroHeading.innerHTML = `${text[0]}<br><span>${text[1]}</span>`;
  }
  setText('.hero .lead', text[2]);
  setText('#features h2', text[3]);
  setText('#subscriptions h2', text[4]);
  setText('#reseller-panels h2', text[5]);
  setText('#faq h2', text[6]);

  try {
    localStorage.setItem('language', language);
  } catch {}
}

document.addEventListener('click', (event) => {
  const connectionButton = event.target.closest('[data-product]');
  if (connectionButton) {
    selectedConnections[connectionButton.dataset.product] = Number(connectionButton.dataset.count);
    renderSubscriptions();
    return;
  }

  const orderButton = event.target.closest('[data-order]');
  if (orderButton) {
    const [productName, type, details] = orderButton.dataset.order.split('|');
    order(productName, type, details);
    return;
  }

  const faqButton = event.target.closest('.faq button');
  if (faqButton) {
    const article = faqButton.parentElement;
    const isOpen = article.classList.toggle('open');
    faqButton.setAttribute('aria-expanded', String(isOpen));
    return;
  }

  const mobileLink = event.target.closest('#mobileNav a');
  if (mobileLink) {
    const mobileNavigation = document.querySelector('#mobileNav');
    const menuButton = document.querySelector('#menuButton');
    mobileNavigation?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }
});

const menuButton = document.querySelector('#menuButton');
const mobileNavigation = document.querySelector('#mobileNav');
if (menuButton && mobileNavigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = mobileNavigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

const languageSelector = document.querySelector('#language');
if (languageSelector) {
  let savedLanguage = 'en';
  try {
    savedLanguage = localStorage.getItem('language') || 'en';
  } catch {
    savedLanguage = 'en';
  }
  languageSelector.value = translations[savedLanguage] ? savedLanguage : 'en';
  setLanguage(languageSelector.value);
  languageSelector.addEventListener('change', (event) => setLanguage(event.target.value));
}

document.querySelectorAll('#year').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

renderSubscriptions();
renderResellers();
renderDirectory();
renderFaq();
