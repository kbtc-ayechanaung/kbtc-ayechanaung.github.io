// =====================================================
// KAUNG KAUNG — PORTFOLIO ENGINE
// =====================================================

const state = {
  activeCollection: 'all',
  visibleCount: 18,
  lightboxIndex: 0,
  currentImages: [],
  allImages: [],
};

// =================== INIT ===================
function init() {
  buildAllImages();
  renderFilters();
  renderGrid();
  setupNav();
  setupLightbox();
  setupScrollAnimations();
  animateCounters();
  setupCursorGlow();
  setupMarquee();
}

// =================== BUILD ALL IMAGES ===================
function buildAllImages() {
  state.allImages = [];
  for (const [key, col] of Object.entries(photoData.collections)) {
    for (const img of col.images) {
      state.allImages.push({ ...img, collection: key, collectionTitle: col.title });
    }
  }
}

// =================== FILTERS ===================
function renderFilters() {
  const bar = document.getElementById('filter-bar');
  for (const [key, col] of Object.entries(photoData.collections)) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn font-mono text-[11px] tracking-[0.05em] px-4 py-2 border border-kk-border text-kk-muted hover:border-kk-accent hover:text-kk-accent transition-all duration-300';
    btn.dataset.collection = key;
    btn.textContent = `${col.title} (${col.count})`;
    btn.id = `filter-${key}`;
    btn.addEventListener('click', () => setFilter(key));
    bar.appendChild(btn);
  }
  document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
}

function setFilter(collection) {
  state.activeCollection = collection;
  state.visibleCount = 18;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-collection="${collection}"]`).classList.add('active');
  renderGrid();
}

// =================== MASONRY GRID ===================
function getFilteredImages() {
  if (state.activeCollection === 'all') return state.allImages;
  return state.allImages.filter(img => img.collection === state.activeCollection);
}

function renderGrid() {
  const grid = document.getElementById('masonry-grid');
  const filtered = getFilteredImages();
  state.currentImages = filtered.slice(0, state.visibleCount);

  grid.innerHTML = '';
  state.currentImages.forEach((img, i) => {
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.style.animationDelay = `${(i % 12) * 0.04}s`;
    item.innerHTML = `
      <img src="${img.thumb}" alt="${img.collectionTitle} — street photography by Kaung Kaung" loading="lazy" />
      <div class="grid-item-overlay">
        <span class="grid-item-label">${img.collectionTitle}</span>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(i));
    grid.appendChild(item);
  });

  const wrap = document.getElementById('load-more-wrap');
  wrap.style.display = state.visibleCount >= filtered.length ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('load-more-btn').addEventListener('click', () => {
    state.visibleCount += 12;
    renderGrid();
  });
});

// =================== NAV ===================
function setupNav() {
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
  });

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

function updateActiveLink() {
  const sections = ['contact', 'about', 'work'];
  const scrollPos = window.scrollY + 200;
  for (const id of sections) {
    const section = document.getElementById(id);
    if (section && section.offsetTop <= scrollPos) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelector(`.nav-link[data-section="${id}"]`)?.classList.add('active');
      break;
    }
  }
}

// =================== LIGHTBOX ===================
function setupLightbox() {
  const lb = document.getElementById('lightbox');
  const close = document.getElementById('lightbox-close');
  const prev = document.getElementById('lightbox-prev');
  const next = document.getElementById('lightbox-next');

  close.addEventListener('click', closeLightbox);
  prev.addEventListener('click', () => navigateLightbox(-1));
  next.addEventListener('click', () => navigateLightbox(1));

  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // Touch swipe
  let touchStartX = 0;
  lb.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? -1 : 1);
  }, { passive: true });
}

function openLightbox(index) {
  state.lightboxIndex = index;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateLightboxImage();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(dir) {
  const len = state.currentImages.length;
  state.lightboxIndex = (state.lightboxIndex + dir + len) % len;
  updateLightboxImage();
}

function updateLightboxImage() {
  const img = state.currentImages[state.lightboxIndex];
  const lbImg = document.getElementById('lightbox-img');
  lbImg.style.opacity = '0';
  lbImg.style.transform = 'scale(0.95)';
  setTimeout(() => {
    lbImg.src = img.full;
    lbImg.alt = `${img.collectionTitle} — ${img.id}`;
    lbImg.onload = () => {
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'scale(1)';
    };
  }, 150);
  const info = document.getElementById('lightbox-info');
  info.querySelector('.lightbox-collection').textContent = img.collectionTitle;
  info.querySelector('.lightbox-counter').textContent = `${state.lightboxIndex + 1} / ${state.currentImages.length}`;
}

// =================== SCROLL ANIMATIONS ===================
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.obs-animate').forEach(el => observer.observe(el));
}

// =================== COUNTER ANIMATION ===================
function animateCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const duration = 1400;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current);
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

// =================== CURSOR GLOW ===================
function setupCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.innerWidth < 768) return;
  document.addEventListener('mousemove', (e) => {
    glow.style.transform = `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`;
  });
}

// =================== HERO MARQUEE ===================
function setupMarquee() {
  const container = document.getElementById('marquee-track');
  if (!container) return;
  // Pick featured images from various collections
  const picks = [];
  const keys = Object.keys(photoData.collections);
  keys.forEach(key => {
    const imgs = photoData.collections[key].images;
    picks.push(imgs[0], imgs[Math.min(2, imgs.length - 1)]);
  });
  // Build slides (double for seamless loop)
  const buildSlides = () => picks.map(img =>
    `<div class="flex-shrink-0 w-[280px] sm:w-[340px] h-[190px] sm:h-[230px] overflow-hidden mx-1.5 group cursor-pointer">
      <img src="${img.thumb}" alt="Street photography" class="w-full h-full object-cover grayscale-[40%] contrast-[1.1] brightness-[0.82] group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 transition-all duration-700 group-hover:scale-105" loading="lazy" />
    </div>`
  ).join('');
  container.innerHTML = buildSlides() + buildSlides();
}

// =================== START ===================
init();
