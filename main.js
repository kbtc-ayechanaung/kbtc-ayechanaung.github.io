// =====================================================
// KAUNG KAUNG — PORTFOLIO ENGINE v2
// =====================================================

const state = {
  activeCollection: 'all',
  visibleCount: 18,
  lightboxIndex: 0,
  currentImages: [],
  allImages: [],
  isDark: true,
  slideDirection: 0, // -1 = prev, 1 = next
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
  setupThemeToggle();
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
    btn.className = 'filter-btn font-mono text-[11px] tracking-[0.05em] px-4 py-2 border transition-all duration-300';
    btn.dataset.collection = key;
    btn.textContent = `${col.title} (${col.count})`;
    btn.id = `filter-${key}`;
    btn.addEventListener('click', () => setFilter(key));
    bar.appendChild(btn);
  }
  document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
  updateFilterStyles();
}

function setFilter(collection) {
  state.activeCollection = collection;
  state.visibleCount = 18;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-collection="${collection}"]`).classList.add('active');
  renderGrid();
}

function updateFilterStyles() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--muted)';
  });
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

// =================== LIGHTBOX (UPGRADED) ===================
function setupLightbox() {
  const lb = document.getElementById('lightbox');
  const close = document.getElementById('lightbox-close');
  const prevArea = document.getElementById('lb-prev-area');
  const nextArea = document.getElementById('lb-next-area');

  close.addEventListener('click', closeLightbox);
  prevArea.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
  nextArea.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

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
  state.slideDirection = 0;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateLightboxImage(true);
}

function closeLightbox() {
  const lbImg = document.getElementById('lightbox-img');
  lbImg.style.opacity = '0';
  lbImg.style.transform = 'scale(0.9) rotate(-1deg)';
  setTimeout(() => {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  }, 250);
}

function navigateLightbox(dir) {
  const len = state.currentImages.length;
  state.slideDirection = dir;
  state.lightboxIndex = (state.lightboxIndex + dir + len) % len;
  updateLightboxImage(false);
}

function updateLightboxImage(isOpen) {
  const img = state.currentImages[state.lightboxIndex];
  const lbImg = document.getElementById('lightbox-img');
  const dir = state.slideDirection;

  // Slide out current image
  if (!isOpen) {
    lbImg.style.transition = 'opacity 0.2s ease, transform 0.25s ease';
    lbImg.style.opacity = '0';
    lbImg.style.transform = `translateX(${dir * -60}px) scale(0.96)`;
  } else {
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.9) rotate(-1deg)';
  }

  setTimeout(() => {
    // Prepare slide-in position
    if (!isOpen) {
      lbImg.style.transition = 'none';
      lbImg.style.transform = `translateX(${dir * 80}px) scale(0.96)`;
    }

    lbImg.src = img.full;
    lbImg.alt = `${img.collectionTitle} — ${img.id}`;
    lbImg.onload = () => {
      requestAnimationFrame(() => {
        lbImg.style.transition = 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        lbImg.style.opacity = '1';
        lbImg.style.transform = 'translateX(0) scale(1) rotate(0deg)';
      });
    };
  }, isOpen ? 50 : 200);

  // Update info
  const info = document.getElementById('lightbox-info');
  info.querySelector('.lightbox-collection').textContent = img.collectionTitle;
  info.querySelector('.lightbox-counter').textContent = `${state.lightboxIndex + 1} / ${state.currentImages.length}`;

  // Update filmstrip dots
  updateFilmstrip();
}

function updateFilmstrip() {
  const strip = document.getElementById('lb-filmstrip');
  if (!strip) return;
  const total = state.currentImages.length;
  const current = state.lightboxIndex;

  // Show max 15 dots around current
  const maxDots = Math.min(total, 15);
  let start = Math.max(0, current - 7);
  let end = Math.min(total, start + maxDots);
  if (end - start < maxDots) start = Math.max(0, end - maxDots);

  strip.innerHTML = '';
  for (let i = start; i < end; i++) {
    const dot = document.createElement('span');
    dot.className = 'lb-filmstrip-dot' + (i === current ? ' active' : '');
    strip.appendChild(dot);
  }
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
  const picks = [];
  const keys = Object.keys(photoData.collections);
  keys.forEach(key => {
    const imgs = photoData.collections[key].images;
    picks.push(imgs[0], imgs[Math.min(2, imgs.length - 1)]);
  });
  const buildSlides = () => picks.map(img =>
    `<div class="flex-shrink-0 w-[260px] sm:w-[320px] h-[175px] sm:h-[215px] overflow-hidden mx-1.5 group cursor-pointer rounded-sm">
      <img src="${img.thumb}" alt="Street photography" class="w-full h-full object-cover grayscale-[40%] contrast-[1.1] brightness-[0.82] group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 transition-all duration-700 group-hover:scale-105" loading="lazy" />
    </div>`
  ).join('');
  container.innerHTML = buildSlides() + buildSlides();
}

// =================== DARK/LIGHT THEME ===================
function setupThemeToggle() {
  const saved = localStorage.getItem('kk-theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light');
    state.isDark = false;
  }
  updateToggleIcons();

  document.getElementById('theme-toggle-desktop')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  // Enable smooth transition
  document.documentElement.classList.add('theme-transition');
  state.isDark = !state.isDark;
  document.documentElement.classList.toggle('light', !state.isDark);
  localStorage.setItem('kk-theme', state.isDark ? 'dark' : 'light');
  updateToggleIcons();

  // Update cursor glow
  const glow = document.getElementById('cursor-glow');
  if (glow) {
    const rgb = state.isDark ? '167, 139, 250' : '180, 83, 9';
    glow.style.background = `radial-gradient(circle, rgba(${rgb}, 0.07) 0%, transparent 70%)`;
  }

  // Remove transition class after animation completes
  setTimeout(() => document.documentElement.classList.remove('theme-transition'), 500);
}

function updateToggleIcons() {
  const icon = state.isDark ? '🌙' : '☀️';
  document.querySelectorAll('.theme-toggle-knob').forEach(k => k.textContent = icon);
}

// =================== START ===================
init();
