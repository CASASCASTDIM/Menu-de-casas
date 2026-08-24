// ===== CASTDIM — MENÚ DE CASAS — script.js =====

const DESARROLLOS = [
  { key: 'terram',    label: 'Terram',    live: true },
  { key: 'sotavento', label: 'Sotavento', live: true },
  { key: 'lanka',     label: 'Lanka',     live: true },
  { key: 'ankara',    label: 'Ankara',    live: true },
  { key: 'torre-tolosa-2', label: 'Torre Tolosa II', live: false, comingSoon: true },
];

const API_BASE = 'api/casas.php';
const cacheByDev = {};

document.addEventListener('DOMContentLoaded', () => {

  /* --- Preloader --- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('preloader--hidden'), 350);
  });
  setTimeout(() => preloader && preloader.classList.add('preloader--hidden'), 1800);

  /* --- Header on scroll --- */
  const header = document.getElementById('header');
  const scrollTopBtn = document.getElementById('scrollTop');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    scrollTopBtn.classList.toggle('is-visible', y > 500);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --- Mobile nav toggle --- */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  navToggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
    navToggle.classList.toggle('is-active');
  });

  /* --- Build nav + tabs from DESARROLLOS --- */
  const devNavList = document.getElementById('devNavList');
  const devTabs = document.getElementById('devTabs');

  DESARROLLOS.forEach(dev => {
    const navLi = document.createElement('li');
    const navLink = document.createElement('a');
    navLink.className = 'nav__link';
    navLink.textContent = dev.label;
    if (dev.external) {
      navLink.href = dev.external;
    } else {
      navLink.href = '#catalogo';
      navLink.addEventListener('click', () => selectDev(dev.key));
    }
    navLi.appendChild(navLink);
    devNavList.appendChild(navLi);

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'dev-tab';
    tabBtn.dataset.dev = dev.key;
    tabBtn.textContent = dev.label;
    if (dev.comingSoon) {
      const badge = document.createElement('span');
      badge.className = 'dev-tab__badge';
      badge.textContent = 'Próximamente';
      tabBtn.appendChild(badge);
    }
    if (dev.external) {
      const badge = document.createElement('span');
      badge.className = 'dev-tab__badge dev-tab__badge--link';
      badge.textContent = 'Sitio propio ↗';
      tabBtn.appendChild(badge);
      tabBtn.addEventListener('click', () => { window.location.href = dev.external; });
    } else {
      tabBtn.addEventListener('click', () => selectDev(dev.key));
    }
    devTabs.appendChild(tabBtn);
  });

  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.classList.remove('is-active');
    });
  });

  document.querySelectorAll('[data-dev-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
      selectDev(link.dataset.devLink);
    });
  });

  /* --- Catalog rendering --- */
  const grid = document.getElementById('housesGrid');
  const stateBox = document.getElementById('catalogState');

  function setState(message, kind) {
    if (!message) {
      stateBox.hidden = true;
      stateBox.textContent = '';
      return;
    }
    stateBox.hidden = false;
    stateBox.textContent = message;
    stateBox.className = 'catalog__state' + (kind ? ` catalog__state--${kind}` : '');
  }

  function currency(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
  }

  function renderHouses(desarrolloLabel, casas) {
    grid.innerHTML = '';

    if (!casas || casas.length === 0) {
      setState(`No hay casas disponibles en ${desarrolloLabel} en este momento.`, 'empty');
      return;
    }

    setState(null);

    casas.forEach(casa => {
      const card = document.createElement('article');
      card.className = 'house-card';

      const precioTxt = currency(casa.precio);
      const ubicacion = [casa.manzana ? `Manzana ${casa.manzana}` : '', casa.lote ? `Lote ${casa.lote}` : '']
        .filter(Boolean).join(' · ');

      card.innerHTML = `
        <div class="house-card__visual">
          <span class="house-card__tag">Disponible</span>
          <h3 class="house-card__model">${escapeHtml(casa.modelo || 'Modelo')}</h3>
        </div>
        <div class="house-card__body">
          <p class="house-card__loc">${escapeHtml(ubicacion || casa.clave || '')}</p>
          <div class="house-card__price">${precioTxt ? escapeHtml(precioTxt) : 'Precio a consultar'}</div>
          <ul class="house-card__specs">
            ${casa.m2Excedentes ? `<li><span>m² excedentes</span><strong>${escapeHtml(String(casa.m2Excedentes))}</strong></li>` : ''}
            ${casa.avanceObra ? `<li><span>Avance de obra</span><strong>${escapeHtml(casa.avanceObra)}</strong></li>` : ''}
            ${casa.entrega ? `<li><span>Entrega</span><strong>${escapeHtml(casa.entrega)}</strong></li>` : ''}
          </ul>
          <a class="house-card__link" href="#contacto" data-house="${escapeHtml(casa.clave || '')}" data-model="${escapeHtml(casa.modelo || '')}" data-dev="${escapeHtml(desarrolloLabel)}">Me interesa →</a>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.house-card__link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = encodeURIComponent(
          `Hola, me interesa la casa ${link.dataset.house} (${link.dataset.model}) en ${link.dataset.dev}.`
        );
        window.open(`https://wa.me/5214440000000?text=${msg}`, '_blank', 'noopener');
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function selectDev(key) {
    const dev = DESARROLLOS.find(d => d.key === key);
    if (!dev || dev.external) return;

    document.querySelectorAll('.dev-tab').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.dev === key);
    });

    if (dev.comingSoon) {
      grid.innerHTML = '';
      setState(`${dev.label} llegará pronto. ¡Vuelve a consultarlo en unos días!`, 'soon');
      return;
    }

    if (cacheByDev[key]) {
      renderHouses(dev.label, cacheByDev[key]);
      return;
    }

    grid.innerHTML = '';
    setState('Cargando disponibilidad…', 'loading');

    try {
      const res = await fetch(`${API_BASE}?desarrollo=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      cacheByDev[key] = data.casas || [];
      renderHouses(dev.label, cacheByDev[key]);
    } catch (err) {
      setState('No pudimos cargar el inventario. Intenta de nuevo en unos minutos.', 'error');
    }
  }

  const firstLive = DESARROLLOS.find(d => d.live);
  if (firstLive) selectDev(firstLive.key);

  /* --- WhatsApp buttons --- */
  const phone = '5214440000000'; // <-- reemplaza con el número real
  const whatsappBtn = document.getElementById('whatsappBtn');
  if (whatsappBtn) {
    const msg = encodeURIComponent('Hola, me interesa conocer más sobre las casas disponibles de CastDim.');
    whatsappBtn.setAttribute('href', `https://wa.me/${phone}?text=${msg}`);
    whatsappBtn.setAttribute('target', '_blank');
    whatsappBtn.setAttribute('rel', 'noopener');
  }
  const whatsappCta = document.getElementById('whatsappCta');
  if (whatsappCta) {
    const msg = encodeURIComponent('Hola, me interesa conocer más sobre las casas disponibles de CastDim.');
    whatsappCta.setAttribute('href', `https://wa.me/${phone}?text=${msg}`);
    whatsappCta.setAttribute('target', '_blank');
    whatsappCta.setAttribute('rel', 'noopener');
  }

  /* --- Footer year --- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
