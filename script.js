/* ════════════════════════════════════════════════════════════
   PORTFOLIO DATA — localStorage with defaults
   ════════════════════════════════════════════════════════════ */
const PORTFOLIO_DEFAULTS = {
  name: 'Karl Kaisser Sipe',
  role: 'AI Engineer & Full-Stack Developer',
  bio: 'I build AI-powered applications and full-stack web products that solve real problems. Focused on the intersection of machine learning and modern web development — turning complex systems into intuitive, fast experiences.',
  profilePic: null,
  skills: {
    frontend: ['html5','css3','javascript','typescript','react','nextjs','tailwindcss'],
    backend:  ['nodejs','express','python','fastapi','postgresql','docker','pytorch','tensorflow','scikitlearn','pandas','numpy'],
    tools:    ['git','github','vscode','langchain']
  },
  proficiency: [
    { label: 'HTML / CSS', pct: 92 },
    { label: 'Python',     pct: 85 },
    { label: 'JavaScript', pct: 80 },
    { label: 'React.js',   pct: 75 },
    { label: 'Node.js',    pct: 70 },
    { label: 'SQL',        pct: 65 },
  ],
  projects: [
    { id: '1', title: 'Neural Chat', badge: 'In Progress', desc: 'Conversational AI assistant with persistent memory and document Q&A, powered by LangChain, FastAPI, and React.', tags: ['LangChain','FastAPI','React','Python'], github: '#', demo: '', accentColor: 'rgba(0,184,217,0.18)' },
    { id: '2', title: 'TaskFlow', badge: '', desc: 'Full-stack project management app with real-time collaboration, authentication, and drag-and-drop task boards.', tags: ['React','Node.js','PostgreSQL','Docker'], github: '#', demo: '#', accentColor: 'rgba(120,60,220,0.18)' },
    { id: '3', title: 'SentimentLens', badge: '', desc: 'ML-powered REST API that classifies text sentiment and emotion from social media data using a fine-tuned model.', tags: ['Python','scikit-learn','FastAPI','NumPy'], github: '#', demo: '', accentColor: 'rgba(0,200,120,0.15)' },
    { id: '4', title: 'This Portfolio', badge: '', desc: 'Built from scratch with vanilla HTML, CSS, and JS — featuring a particle canvas, aurora animations, and horizontal scroll.', tags: ['HTML5','CSS3','JavaScript'], github: '#', demo: '', accentColor: 'rgba(255,150,30,0.15)' }
  ],
  certifications: [
    { id: 'c1', title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2025', url: '', image: null },
    { id: 'c2', title: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', date: '2024', url: '', image: null },
  ]
};

function getPortfolioData() {
  try {
    const saved = localStorage.getItem('portfolio_data');
    if (!saved) return JSON.parse(JSON.stringify(PORTFOLIO_DEFAULTS));
    return Object.assign({}, PORTFOLIO_DEFAULTS, JSON.parse(saved));
  } catch { return JSON.parse(JSON.stringify(PORTFOLIO_DEFAULTS)); }
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderPortfolio(data) {
  const nameEl = document.querySelector('.hero-name');
  if (nameEl) { nameEl.textContent = data.name; nameEl.dataset.text = data.name; }

  const bioEl = document.querySelector('.hero-bio');
  if (bioEl) bioEl.textContent = data.bio;

  const picEl = document.getElementById('hero-pfp');
  if (picEl) {
    if (data.profilePic) { picEl.src = data.profilePic; picEl.style.display = 'block'; }
    else { picEl.style.display = 'none'; }
  }

  // Skills grids
  ['frontend','backend','tools'].forEach(cat => {
    const grid = document.getElementById('grid-' + cat);
    if (!grid) return;
    const ids      = (data.skills && data.skills[cat]) ? data.skills[cat] : PORTFOLIO_DEFAULTS.skills[cat];
    const registry = (typeof SKILL_REGISTRY !== 'undefined' && SKILL_REGISTRY[cat]) ? SKILL_REGISTRY[cat] : [];
    grid.innerHTML = ids.map(id => {
      const s = registry.find(x => x.id === id);
      if (!s) return '';
      const cls     = 'tech-item tilt-card' + (s.invert ? ' invert' : '');
      const imgAttr = s.iconStyle ? ` style="${escHtml(s.iconStyle)}"` : '';
      const media   = s.icon
        ? `<img src="${escHtml(s.icon)}" alt="${escHtml(s.label)}"${imgAttr} />`
        : `<div class="skill-text-icon">${escHtml(s.label.slice(0,2).toUpperCase())}</div>`;
      return `<div class="${cls}">${media}<span>${escHtml(s.label)}</span></div>`;
    }).join('');
  });

  // Proficiency bars
  const barList = document.getElementById('bar-list');
  if (barList) {
    // Array.isArray (not a length check) so an intentionally-emptied list stays empty
    // instead of silently falling back to the seed placeholders.
    const bars = Array.isArray(data.proficiency) ? data.proficiency : PORTFOLIO_DEFAULTS.proficiency;
    barList.innerHTML = bars.map(b =>
      `<div class="bar-item">
        <div class="bar-label"><span>${escHtml(b.label)}</span><span class="bar-pct">${b.pct}%</span></div>
        <div class="bar-track"><div class="bar-fill" data-pct="${b.pct}"></div></div>
      </div>`
    ).join('');
    /* Re-trigger bar animation for freshly rendered fills */
    barList.querySelectorAll('.bar-fill').forEach(f => {
      f.style.width = '0%';
      setTimeout(() => { f.style.width = f.dataset.pct + '%'; }, 80);
    });
  }

  // Projects — fanned deck, click a card to swap it to the front
  const track = document.getElementById('projects-track');
  if (track) {
    const list = Array.isArray(data.projects) ? data.projects : PORTFOLIO_DEFAULTS.projects;
    const ghIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;
    const demoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>`;

    track.innerHTML = list.map((p, i) => {
      const badge    = p.badge ? `<span class="deck-card-badge">${escHtml(p.badge)}</span>` : '';
      const tags     = (p.tags || []).map(t => `<span class="deck-card-tag">${escHtml(t)}</span>`).join('');
      const gh       = p.github ? `<a href="${escHtml(p.github)}" target="_blank" rel="noopener" class="deck-card-link">${ghIcon}GitHub</a>` : '';
      const demo     = p.demo   ? `<a href="${escHtml(p.demo)}"   target="_blank" rel="noopener" class="deck-card-link deck-card-link--demo">${demoIcon}Live Demo</a>` : '';
      const hasImg   = !!p.image;
      const iconStyle = hasImg
        ? `background-image:url(${escHtml(p.image)});`
        : `background:linear-gradient(135deg,${p.accentColor||'rgba(0,184,217,0.18)'},rgba(0,0,0,0.4));`;
      const initials = escHtml(p.title.slice(0, 2).toUpperCase());
      return `<div class="deck-card" data-index="${i}">
        <div class="deck-card-pills">${badge}${tags}</div>
        <div class="deck-card-head">
          <div class="deck-card-icon" style="${iconStyle}">${hasImg ? '' : initials}</div>
          <p class="deck-card-title">${escHtml(p.title)}</p>
        </div>
        <p class="deck-card-desc">${escHtml(p.desc)}</p>
        <div class="deck-card-links">${gh}${demo}</div>
      </div>`;
    }).join('');

    layoutDeck(track, 0);
  }

  // Certifications
  const certGrid = document.getElementById('certifications-grid');
  if (certGrid) {
    const certs = Array.isArray(data.certifications) ? data.certifications : PORTFOLIO_DEFAULTS.certifications;
    if (!certs || !certs.length) {
      certGrid.innerHTML = '<p class="cert-empty">No certifications added yet.</p>';
    } else {
      const linkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
      certGrid.innerHTML = certs.map(c => {
        const hasImg = !!c.image;
        const iconStyle = hasImg ? `background-image:url(${escHtml(c.image)});` : '';
        const initials = escHtml((c.title || '?').slice(0, 2).toUpperCase());
        const link = c.url ? `<a href="${escHtml(c.url)}" target="_blank" rel="noopener" class="cert-card-link">${linkIcon}View Credential</a>` : '';
        return `<div class="cert-card">
          <div class="cert-card-head">
            <div class="cert-card-icon" style="${iconStyle}">${hasImg ? '' : initials}</div>
            <div class="cert-card-title-wrap">
              <p class="cert-card-title">${escHtml(c.title)}</p>
              <p class="cert-card-issuer">${escHtml(c.issuer || '')}</p>
            </div>
          </div>
          ${c.date ? `<span class="cert-card-date">${escHtml(c.date)}</span>` : ''}
          ${link}
        </div>`;
      }).join('');
    }
  }
}

/* Positions deck cards in a 3-card fan around `active`; click a card to swap it to the front. */
function layoutDeck(track, active) {
  const cards = Array.from(track.children);
  const n = cards.length;
  if (!n) return;
  track.dataset.active = active;

  // Wider gap on roomier viewports; narrower on phones so peeking cards stay on-screen
  const spread = window.innerWidth <= 480 ? '20%' : '34%';

  cards.forEach(card => {
    const i = Number(card.dataset.index);
    const r = (i - active + n) % n;
    // x is a % of the card's own width so the gap scales with card size across breakpoints
    let x = '0%', y = '0px', rot = 0, scale = 0.92, z = 10, op = 0, pe = 'none';
    if (r === 0)            { x = '0%';         y = '0px';  rot = 0;  scale = 1;    z = 50; op = 1;   pe = 'auto'; }
    else if (r === 1)       { x = spread;        y = '18px'; rot = 8;  scale = 0.93; z = 40; op = 0.9;  pe = 'auto'; }
    else if (r === n - 1)   { x = `-${spread}`;  y = '18px'; rot = -8; scale = 0.93; z = 40; op = 0.9;  pe = 'auto'; }
    card.style.transform = `translate(${x}, ${y}) rotate(${rot}deg) scale(${scale})`;
    card.style.zIndex = z;
    card.style.opacity = op;
    card.style.pointerEvents = pe;
  });
}

(function initDeckSwap() {
  const track = document.getElementById('projects-track');
  if (!track) return;
  track.addEventListener('click', e => {
    if (e.target.closest('.deck-card-link')) return; // let GitHub/Demo links navigate
    const card = e.target.closest('.deck-card');
    if (!card) return;
    const active = Number(track.dataset.active || 0);
    const clicked = Number(card.dataset.index);
    const n = track.children.length;
    const next = clicked === active ? (active + 1) % n : clicked;
    layoutDeck(track, next);
  });
})();

/* Phase 1 — render immediately from localStorage */
renderPortfolio(getPortfolioData());

/* Phase 2 — fetch the live data from the backend API; update + re-render if found.
   Silently does nothing when running from file:// locally or the API is unreachable. */
fetch('/api/data')
  .then(r => r.ok ? r.json() : null)
  .then(d => {
    if (!d || typeof d !== 'object' || !Array.isArray(d.projects)) return;
    localStorage.setItem('portfolio_data', JSON.stringify(d));
    renderPortfolio(d);
  })
  .catch(() => {});


/* ════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ════════════════════════════════════════════════════════════ */
(function () {
  const bar = document.createElement('div');
  bar.id = 'scroll-bar';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / max * 100) + '%';
  }, { passive: true });
})();


/* ════════════════════════════════════════════════════════════
   RIPPLE EFFECT ON BUTTONS
   ════════════════════════════════════════════════════════════ */
(function () {
  function ripple(e) {
    const el   = e.currentTarget;
    const r    = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const x    = e.clientX - r.left  - size / 2;
    const y    = e.clientY - r.top   - size / 2;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    el.classList.add('ripple-host');
    el.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }

  document.querySelectorAll('.btn, .tab-btn, .social-link, .contact-email').forEach(el => {
    el.addEventListener('click', ripple);
  });
})();


/* ════════════════════════════════════════════════════════════
   MAGNETIC CTA BUTTONS (desktop)
   ════════════════════════════════════════════════════════════ */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.hero-cta .btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const x  = (e.clientX - r.left - r.width  / 2) * 0.25;
      const y  = (e.clientY - r.top  - r.height / 2) * 0.3;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
      btn.style.transform  = '';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   HERO AURORA PARALLAX + SCROLL INDICATOR FADE
   ════════════════════════════════════════════════════════════ */
(function () {
  const auroras   = document.querySelectorAll('.aurora');
  const indicator = document.getElementById('scroll-indicator');
  const speeds    = [0.12, 0.18, 0.08];

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    auroras.forEach((a, i) => {
      a.style.transform = `translateY(${y * speeds[i]}px)`;
    });

    if (indicator) {
      indicator.style.opacity = Math.max(0, 0.35 - y / 200);
    }
  }, { passive: true });

  if (indicator) {
    indicator.addEventListener('click', () => {
      const skills = document.getElementById('skills');
      if (skills) skills.scrollIntoView({ behavior: 'smooth' });
    });
  }
})();


/* ════════════════════════════════════════════════════════════
   PARTICLE NETWORK
   ════════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');
  const hero   = document.getElementById('hero');

  const COUNT  = 65;
  const DIST   = 130;
  const REPEL  = 100;

  let W, H, particles, animId;
  const mouse = { x: null, y: null };

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  class Dot {
    constructor() {
      this.x  = Math.random() * (W || window.innerWidth);
      this.y  = Math.random() * (H || window.innerHeight);
      this.vx = (Math.random() - 0.5) * 0.28;
      this.vy = (Math.random() - 0.5) * 0.28;
      this.r  = Math.random() * 1.2 + 0.4;
      this.a  = Math.random() * 0.22 + 0.06;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (mouse.x !== null) {
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL && d > 0) {
          const f = (REPEL - d) / REPEL;
          this.x += (dx / d) * f * 2;
          this.y += (dy / d) * f * 2;
        }
      }
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }
    draw() {
      const light = document.documentElement.classList.contains('light');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = light ? `rgba(20,20,20,${this.a})` : `rgba(200,200,200,${this.a})`;
      ctx.fill();
    }
  }

  function drawLines() {
    const light = document.documentElement.classList.contains('light');
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const a = (1 - d / DIST) * 0.1;
          ctx.strokeStyle = light ? `rgba(40,40,40,${a})` : `rgba(180,180,180,${a})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, () => new Dot());
    cancelAnimationFrame(animId);
    loop();
  }

  window.addEventListener('resize', () => { resize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else { cancelAnimationFrame(animId); loop(); }
  });

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
  hero.addEventListener('touchmove',  e => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - r.left;
    mouse.y = e.touches[0].clientY - r.top;
  }, { passive: true });
  hero.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

  init();
})();


/* ════════════════════════════════════════════════════════════
   NAVBAR — hide/show + hamburger
   ════════════════════════════════════════════════════════════ */
(function () {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobile    = document.querySelector('.nav-mobile');
  let last = 0, menuOpen = false;

  // Scroll hide/show
  window.addEventListener('scroll', () => {
    const cur = window.scrollY;
    if (cur <= 10)        navbar.classList.remove('hidden');
    else if (cur > last)  navbar.classList.add('hidden');
    else                  navbar.classList.remove('hidden');
    last = cur;

    // Close mobile menu on scroll
    if (menuOpen) closeMenu();
  }, { passive: true });

  // Hamburger toggle
  function openMenu() {
    menuOpen = true;
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobile.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuOpen = false;
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobile.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

  // Close on mobile link click
  document.querySelectorAll('.nav-link-m').forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (menuOpen && !navbar.contains(e.target)) closeMenu();
  });
})();


/* ════════════════════════════════════════════════════════════
   SMOOTH SCROLL + ACTIVE NAV LINKS
   ════════════════════════════════════════════════════════════ */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const dLinks   = document.querySelectorAll('.nav-link');
  const mLinks   = document.querySelectorAll('.nav-link-m');
  const sLinks   = document.querySelectorAll('.side-link');
  const allLinks = [...dLinks, ...mLinks, ...sLinks];

  function setActive(id) {
    allLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
    });
  }

  // Intersection observer for active state
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));

  // Smooth scroll
  allLinks.forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH  = document.getElementById('navbar').offsetHeight;
      const top   = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Hero CTA buttons
  document.querySelectorAll('.hero-cta .btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const href   = btn.getAttribute('href');
      const target = href && document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('navbar').offsetHeight;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   SKILLS TABS + STAGGERED POP-IN
   ════════════════════════════════════════════════════════════ */
(function () {
  const tabBtns  = document.querySelectorAll('.tab-btn');
  const panels   = document.querySelectorAll('.skills-panel');

  function stagger(panel) {
    panel.querySelectorAll('.tech-item').forEach((item, i) => {
      item.classList.remove('popping');
      void item.offsetWidth;
      item.style.animationDelay = `${i * 0.055}s`;
      item.classList.add('popping');
    });
  }

  stagger(document.querySelector('.skills-panel.active'));

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p  => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + btn.dataset.tab);
      panel.classList.add('active');
      stagger(panel);
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   3D TILT — desktop only
   ════════════════════════════════════════════════════════════ */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const x   = e.clientX - r.left, y = e.clientY - r.top;
      const rx  = ((y - r.height / 2) / (r.height / 2)) * -9;
      const ry  = ((x - r.width  / 2) / (r.width  / 2)) *  9;
      card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.3s ease';
      card.style.transform  = '';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   TYPING ANIMATION
   ════════════════════════════════════════════════════════════ */
(function () {
  const roles = [getPortfolioData().role];
  const el    = document.getElementById('typed-role');
  let ri = 0, ci = 0, del = false;

  function type() {
    const cur = roles[ri];
    if (!del) {
      el.textContent = cur.slice(0, ci + 1); ci++;
      if (ci === cur.length) { del = true; setTimeout(type, 2000); return; }
    } else {
      el.textContent = cur.slice(0, ci - 1); ci--;
      if (ci === 0) { del = false; ri = (ri + 1) % roles.length; }
    }
    setTimeout(type, del ? 55 : 95);
  }
  type();
})();


/* ════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════════════════════════ */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('revealed'),
          parseInt(e.target.dataset.delay || 0));
      } else {
        e.target.classList.remove('revealed');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
})();


/* ════════════════════════════════════════════════════════════
   PAGE INTRO + TEXT SCRAMBLE
   ════════════════════════════════════════════════════════════ */
(function () {
  const overlay  = document.getElementById('intro-overlay');
  const logo     = document.querySelector('.intro-logo');
  const line     = document.querySelector('.intro-line');
  const nameEl   = document.querySelector('.hero-name');
  const realName = nameEl ? nameEl.textContent : '';
  const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // Lock body scroll during intro
  document.body.style.overflow = 'hidden';

  // Step 1: show logo
  setTimeout(() => { logo.classList.add('show'); }, 200);

  // Step 2: expand line
  setTimeout(() => { line.classList.add('expand'); }, 600);

  // Step 3: slide overlay out
  setTimeout(() => {
    overlay.classList.add('slide-out');
    document.body.style.overflow = '';

    // Step 4: scramble name
    if (nameEl) {
      let iter = 0;
      const total = realName.length * 6;
      const interval = setInterval(() => {
        nameEl.textContent = realName.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < Math.floor(iter / 6)) return ch;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        iter++;
        if (iter >= total) {
          clearInterval(interval);
          nameEl.textContent = realName;
        }
      }, 40);
    }
  }, 1800);

  // Remove overlay from DOM after transition
  overlay.addEventListener('transitionend', () => {
    if (overlay.classList.contains('slide-out')) overlay.remove();
  });
})();


/* ════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ════════════════════════════════════════════════════════════ */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
  });

  // Ring follows with lag
  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  // Hover state on interactive elements
  document.querySelectorAll('a, button, .tech-item, .deck-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();


/* ════════════════════════════════════════════════════════════
   HERO MOUSE SPOTLIGHT
   ════════════════════════════════════════════════════════════ */
(function () {
  const spotlight = document.getElementById('hero-spotlight');
  const hero      = document.getElementById('hero');
  if (!spotlight || !hero) return;

  hero.addEventListener('mousemove', e => {
    const r  = hero.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
    const my = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
    spotlight.style.setProperty('--mx', mx + '%');
    spotlight.style.setProperty('--my', my + '%');
  });
})();


/* ════════════════════════════════════════════════════════════
   NAV SLIDING INDICATOR
   ════════════════════════════════════════════════════════════ */
(function () {
  const navLinksEl = document.querySelector('.nav-links');
  if (!navLinksEl) return;

  const indicator = document.createElement('div');
  indicator.className = 'nav-indicator';
  navLinksEl.appendChild(indicator);

  const links = navLinksEl.querySelectorAll('.nav-link');
  const navRect = () => navLinksEl.getBoundingClientRect();

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const lr = link.getBoundingClientRect();
      const nr = navRect();
      indicator.style.left    = (lr.left - nr.left) + 'px';
      indicator.style.width   = lr.width + 'px';
      indicator.style.opacity = '1';
    });
  });

  navLinksEl.addEventListener('mouseleave', () => {
    indicator.style.opacity = '0';
  });
})();


/* ════════════════════════════════════════════════════════════
   SECTION COUNTER
   ════════════════════════════════════════════════════════════ */
(function () {
  const counter = document.getElementById('section-counter');
  const current = document.getElementById('counter-current');
  const sections = document.querySelectorAll('section[id]');
  if (!counter || !current) return;

  const total = sections.length;
  document.getElementById('counter-total').textContent = String(total).padStart(2, '0');

  function update() {
    const mid = window.scrollY + window.innerHeight / 2;
    let active = 0;
    sections.forEach((s, i) => {
      if (mid >= s.offsetTop) active = i;
    });
    current.textContent = String(active + 1).padStart(2, '0');
    counter.classList.toggle('visible', window.scrollY > 100);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ════════════════════════════════════════════════════════════
   PROFICIENCY BAR FILL
   ════════════════════════════════════════════════════════════ */
(function () {
  const fills = document.querySelectorAll('.bar-fill');
  if (!fills.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.pct + '%';
      } else {
        e.target.style.width = '0%';
      }
    });
  }, { threshold: 0.3 });

  fills.forEach(f => obs.observe(f));
})();




/* ════════════════════════════════════════════════════════════
   CONTACT EMAIL GLITCH ON HOVER
   ════════════════════════════════════════════════════════════ */
(function () {
  const email = document.querySelector('.contact-email');
  if (!email) return;

  email.setAttribute('data-text', email.textContent);

  email.addEventListener('mouseenter', () => {
    email.classList.add('glitching');
    setTimeout(() => email.classList.remove('glitching'), 300);
  });
})();


/* ════════════════════════════════════════════════════════════
   THEME SWITCH (light / dark / system)
   ════════════════════════════════════════════════════════════ */
(function () {
  const KEY  = 'theme';
  const root = document.documentElement;
  const mq   = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  const opts = document.querySelectorAll('[data-theme-opt]');
  let animT;

  function getPref() {
    try {
      const v = localStorage.getItem(KEY);
      return (v === 'light' || v === 'dark' || v === 'system') ? v : 'dark';
    } catch (e) { return 'dark'; }
  }

  function isLight(p) { return p === 'light' || (p === 'system' && !!mq && mq.matches); }

  function syncButtons(p) {
    opts.forEach(el => el.classList.toggle('is-active', el.dataset.themeOpt === p));
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setThemeClass(p) {
    root.classList.toggle('light', isLight(p));
    root.dataset.themePref = p;
    syncButtons(p);
  }

  /* `origin` is the {x,y} viewport point the circle expands from (the button
     that was clicked) — falls back to the crossfade transition on browsers
     without the View Transitions API, or when reduced motion is requested. */
  function apply(p, animate, origin) {
    const canCircleReveal = animate && !reducedMotion() && typeof document.startViewTransition === 'function';

    if (canCircleReveal) {
      if (origin) {
        root.style.setProperty('--vt-x', origin.x + 'px');
        root.style.setProperty('--vt-y', origin.y + 'px');
      }
      const radius = Math.hypot(window.innerWidth, window.innerHeight);
      root.style.setProperty('--vt-radius', radius + 'px');
      document.startViewTransition(() => setThemeClass(p));
      return;
    }

    if (animate) {
      root.classList.add('theme-anim');
      clearTimeout(animT);
      animT = setTimeout(() => root.classList.remove('theme-anim'), 500);
    }
    setThemeClass(p);
  }

  apply(getPref(), false);

  opts.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.themeOpt;
      try { localStorage.setItem(KEY, p); } catch (e) {}
      const r = btn.getBoundingClientRect();
      apply(p, true, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  });

  if (mq) {
    mq.addEventListener('change', () => {
      if (getPref() === 'system') apply('system', true);
    });
  }
})();
