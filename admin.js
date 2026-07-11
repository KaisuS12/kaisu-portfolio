/* ════════════════════════════════════════════════════════════
   ADMIN — Portfolio CMS
   Default PIN: 2026  (change ADMIN_PIN below to update it)
   ════════════════════════════════════════════════════════════ */

/* Surface any script error as a visible banner instead of silently
   leaving buttons unresponsive — makes future breakage diagnosable. */
window.addEventListener('error', e => {
  console.error('Admin panel error:', e.error || e.message);
  let banner = document.getElementById('admin-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'admin-error-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#3a0d0d;color:#ff9a9a;padding:10px 16px;font:12px/1.5 monospace;white-space:pre-wrap;border-bottom:1px solid #661515;';
    document.body.prepend(banner);
  }
  banner.textContent = 'Admin panel script error — ' + (e.message || 'unknown') +
    (e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : '') +
    ' — please screenshot this and report it.';
});

const STORAGE_KEY     = 'portfolio_data';
const PIN_KEY         = 'admin_pin';
const SESSION_KEY     = 'admin_unlocked';

const DEFAULT_SKILLS = {
  frontend: ['html5','css3','javascript','typescript','react','nextjs','tailwindcss'],
  backend:  ['nodejs','express','python','fastapi','postgresql','docker','pytorch','tensorflow','scikitlearn','pandas','numpy'],
  tools:    ['git','github','vscode','langchain']
};

const DEFAULT_PROFICIENCY = [
  { label: 'HTML / CSS', pct: 92 },
  { label: 'Python',     pct: 85 },
  { label: 'JavaScript', pct: 80 },
  { label: 'React.js',   pct: 75 },
  { label: 'Node.js',    pct: 70 },
  { label: 'SQL',        pct: 65 },
];

const ACCENT_COLORS = [
  { label: 'Cyan',   value: 'rgba(0,184,217,0.18)',   swatch: '#00b8d9' },
  { label: 'Purple', value: 'rgba(120,60,220,0.18)',  swatch: '#7c3cdc' },
  { label: 'Green',  value: 'rgba(0,200,120,0.15)',   swatch: '#00c878' },
  { label: 'Orange', value: 'rgba(255,150,30,0.15)',  swatch: '#ff961e' },
  { label: 'Pink',   value: 'rgba(220,60,130,0.18)',  swatch: '#dc3c82' },
  { label: 'Red',    value: 'rgba(220,60,60,0.18)',   swatch: '#dc3c3c' },
];

const DEFAULTS = {
  name: 'Karl Kaisser Sipe',
  role: 'AI Engineer & Full-Stack Developer',
  bio: 'I build AI-powered applications and full-stack web products that solve real problems. Focused on the intersection of machine learning and modern web development — turning complex systems into intuitive, fast experiences.',
  profilePic: null,
  projects: [
    { id: '1', title: 'Neural Chat',    badge: 'In Progress', desc: 'Conversational AI assistant with persistent memory and document Q&A, powered by LangChain, FastAPI, and React.',   tags: ['LangChain','FastAPI','React','Python'],        github: '#', demo: '',  accentColor: 'rgba(0,184,217,0.18)'  },
    { id: '2', title: 'TaskFlow',       badge: '',            desc: 'Full-stack project management app with real-time collaboration, authentication, and drag-and-drop task boards.',    tags: ['React','Node.js','PostgreSQL','Docker'],       github: '#', demo: '#', accentColor: 'rgba(120,60,220,0.18)' },
    { id: '3', title: 'SentimentLens', badge: '',            desc: 'ML-powered REST API that classifies text sentiment and emotion from social media data using a fine-tuned model.',  tags: ['Python','scikit-learn','FastAPI','NumPy'],     github: '#', demo: '',  accentColor: 'rgba(0,200,120,0.15)'  },
    { id: '4', title: 'This Portfolio', badge: '',            desc: 'Built from scratch with vanilla HTML, CSS, and JS — featuring a particle canvas, aurora animations, and horizontal scroll.', tags: ['HTML5','CSS3','JavaScript'], github: '#', demo: '',  accentColor: 'rgba(255,150,30,0.15)' },
  ]
};

/* ── Storage helpers ─────────────────────────────────────────── */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    return Object.assign({}, DEFAULTS, JSON.parse(raw));
  } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getPin() {
  return localStorage.getItem(PIN_KEY) || '2026';
}

/* ── Toast ───────────────────────────────────────────────────── */
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg, type = 'ok') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `toast toast--${type}`;
  toastTimer = setTimeout(() => { toastEl.className = 'toast is-hidden'; }, 2200);
}

/* ════════════════════════════════════════════════════════════
   PIN GATE
   ════════════════════════════════════════════════════════════ */
const pinGate  = document.getElementById('pin-gate');
const adminApp = document.getElementById('admin-app');
const pinDots  = document.querySelectorAll('.pin-dot');
const pinError = document.getElementById('pin-error');

let pinBuffer = '';

function updateDots() {
  pinDots.forEach((d, i) => d.classList.toggle('filled', i < pinBuffer.length));
}

function unlockApp() {
  sessionStorage.setItem(SESSION_KEY, '1');
  pinGate.classList.add('is-hidden');
  adminApp.classList.remove('is-hidden');
  initApp();
}

function checkPin() {
  if (pinBuffer === getPin()) {
    unlockApp();
  } else {
    pinError.textContent = 'Incorrect PIN';
    pinBuffer = '';
    updateDots();
    setTimeout(() => { pinError.textContent = ''; }, 1500);
  }
}

document.querySelectorAll('.pin-key').forEach(btn => {
  btn.addEventListener('click', () => {
    const k = btn.dataset.k;
    if (k === 'clear') { pinBuffer = ''; updateDots(); return; }
    if (k === 'del')   { pinBuffer = pinBuffer.slice(0, -1); updateDots(); return; }
    if (pinBuffer.length >= 4) return;
    pinBuffer += k;
    updateDots();
    if (pinBuffer.length === 4) setTimeout(checkPin, 120);
  });
});

document.addEventListener('keydown', e => {
  if (!pinGate.classList.contains('is-hidden')) {
    if (e.key >= '0' && e.key <= '9' && pinBuffer.length < 4) {
      pinBuffer += e.key;
      updateDots();
      if (pinBuffer.length === 4) setTimeout(checkPin, 120);
    } else if (e.key === 'Backspace') {
      pinBuffer = pinBuffer.slice(0, -1);
      updateDots();
    }
  }
});

/* Lock button */
document.getElementById('btn-lock').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  adminApp.classList.add('is-hidden');
  pinGate.classList.remove('is-hidden');
  pinBuffer = '';
  updateDots();
});

/* ════════════════════════════════════════════════════════════
   ADMIN APP
   ════════════════════════════════════════════════════════════ */
function initApp() {
  const data = load();
  populateProfile(data);
  renderProjects(data.projects);
  buildColorSwatches();
  initSkills();
}

/* ── Profile ─────────────────────────────────────────────────── */
const pfpPreview   = document.getElementById('pfp-preview');
const pfpPlaceholder = document.getElementById('pfp-placeholder');
const pfpInput     = document.getElementById('pfp-input');
const btnRemovePfp = document.getElementById('btn-remove-pfp');

function populateProfile(data) {
  document.getElementById('field-name').value = data.name || '';
  document.getElementById('field-role').value = data.role || '';
  document.getElementById('field-bio').value  = data.bio  || '';
  setPfpPreview(data.profilePic || null);
}

function setPfpPreview(src) {
  if (src) {
    pfpPreview.src = src;
    pfpPreview.classList.remove('is-hidden');
    pfpPlaceholder.style.display = 'none';
    btnRemovePfp.style.display = 'inline-flex';
  } else {
    pfpPreview.src = '';
    pfpPreview.classList.add('is-hidden');
    pfpPlaceholder.style.display = '';
    btnRemovePfp.style.display = 'none';
  }
}

pfpInput.addEventListener('change', () => {
  const file = pfpInput.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2 MB', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => setPfpPreview(e.target.result);
  reader.readAsDataURL(file);
});

btnRemovePfp.addEventListener('click', () => {
  pfpInput.value = '';
  setPfpPreview(null);
});

document.getElementById('btn-save-profile').addEventListener('click', () => {
  const data = load();
  data.name = document.getElementById('field-name').value.trim() || data.name;
  data.role = document.getElementById('field-role').value.trim() || data.role;
  data.bio  = document.getElementById('field-bio').value.trim()  || data.bio;

  if (pfpPreview.src && !pfpPreview.classList.contains('is-hidden')) {
    data.profilePic = pfpPreview.src;
  } else if (btnRemovePfp.style.display === 'none') {
    data.profilePic = null;
  }

  save(data);
  toast('Profile saved');
});

/* ── Projects List ───────────────────────────────────────────── */
function renderProjects(projects) {
  const list = document.getElementById('projects-list');
  if (!projects || !projects.length) {
    list.innerHTML = '<p class="proj-empty">No projects yet. Click "+ Add Project" to get started.</p>';
    return;
  }
  list.innerHTML = projects.map((p, i) => {
    const num   = String(i + 1).padStart(2, '0');
    const badge = p.badge ? `<span class="proj-badge-chip">${esc(p.badge)}</span>` : '';
    const tags  = (p.tags || []).join(', ');
    return `<div class="proj-row" data-id="${p.id}">
      <span class="proj-num">${num}</span>
      <div class="proj-info">
        <div class="proj-name">${esc(p.title)}${badge}</div>
        <div class="proj-tags-preview">${esc(tags)}</div>
      </div>
      <div class="proj-actions">
        <button class="btn-ghost btn-small" data-action="edit" data-id="${p.id}">Edit</button>
        <button class="btn-danger btn-small" data-action="delete" data-id="${p.id}">Delete</button>
      </div>
    </div>`;
  }).join('');
}

/* Event delegation instead of inline onclick= — inline handlers can be
   silently blocked by ad-blockers / strict CSPs, leaving buttons dead. */
document.getElementById('projects-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit')   openEdit(id);
  if (btn.dataset.action === 'delete') deleteProject(id);
});

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  const data = load();
  data.projects = data.projects.filter(p => p.id !== id);
  save(data);
  renderProjects(data.projects);
  toast('Project deleted');
}

/* ── Modal ───────────────────────────────────────────────────── */
const modal        = document.getElementById('modal');
const modalTitle   = document.getElementById('modal-title');
let   editingId    = null;
let   selectedColor = ACCENT_COLORS[0].value;
let   modalImgSrc  = null;   // base64 or null

const projImgInput   = document.getElementById('proj-img-input');
const projImgPreview = document.getElementById('proj-img-preview');
const projImgPlaceholder = document.getElementById('proj-img-placeholder');
const btnRemoveProjImg   = document.getElementById('btn-remove-proj-img');

function setModalImg(src) {
  modalImgSrc = src || null;
  if (src) {
    projImgPreview.src = src;
    projImgPreview.classList.remove('is-hidden');
    projImgPlaceholder.style.display = 'none';
    btnRemoveProjImg.style.display = 'inline-flex';
  } else {
    projImgPreview.src = '';
    projImgPreview.classList.add('is-hidden');
    projImgPlaceholder.style.display = '';
    btnRemoveProjImg.style.display = 'none';
  }
}

projImgInput.addEventListener('change', () => {
  const file = projImgInput.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast('Image must be under 3 MB', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => setModalImg(e.target.result);
  reader.readAsDataURL(file);
});

btnRemoveProjImg.addEventListener('click', () => {
  projImgInput.value = '';
  setModalImg(null);
});

function buildColorSwatches() {
  const wrap = document.getElementById('color-swatches');
  wrap.innerHTML = ACCENT_COLORS.map(c =>
    `<div class="color-swatch ${selectedColor === c.value ? 'selected' : ''}"
          style="background:${c.swatch};"
          data-value="${c.value}"
          title="${c.label}"></div>`
  ).join('');

  wrap.querySelectorAll('.color-swatch').forEach(s => {
    s.addEventListener('click', () => {
      selectedColor = s.dataset.value;
      wrap.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
      s.classList.add('selected');
    });
  });
}

function openAdd() {
  editingId = null;
  modalTitle.textContent = 'Add Project';
  document.getElementById('m-title').value  = '';
  document.getElementById('m-badge').value  = '';
  document.getElementById('m-desc').value   = '';
  document.getElementById('m-tags').value   = '';
  document.getElementById('m-github').value = '';
  document.getElementById('m-demo').value   = '';
  projImgInput.value = '';
  setModalImg(null);
  selectedColor = ACCENT_COLORS[0].value;
  buildColorSwatches();
  modal.classList.remove('is-hidden');
  document.getElementById('m-title').focus();
}

function openEdit(id) {
  const data = load();
  const p    = data.projects.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  modalTitle.textContent = 'Edit Project';
  document.getElementById('m-title').value  = p.title  || '';
  document.getElementById('m-badge').value  = p.badge  || '';
  document.getElementById('m-desc').value   = p.desc   || '';
  document.getElementById('m-tags').value   = (p.tags || []).join(', ');
  document.getElementById('m-github').value = p.github || '';
  document.getElementById('m-demo').value   = p.demo   || '';
  projImgInput.value = '';
  setModalImg(p.image || null);
  selectedColor = p.accentColor || ACCENT_COLORS[0].value;
  buildColorSwatches();
  modal.classList.remove('is-hidden');
  document.getElementById('m-title').focus();
}

function closeModal() {
  modal.classList.add('is-hidden');
  editingId = null;
  setModalImg(null);
}

document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.getElementById('modal-save').addEventListener('click', () => {
  const title = document.getElementById('m-title').value.trim();
  if (!title) { toast('Title is required', 'danger'); return; }

  const project = {
    id:          editingId || String(Date.now()),
    title,
    badge:       document.getElementById('m-badge').value.trim(),
    desc:        document.getElementById('m-desc').value.trim(),
    tags:        document.getElementById('m-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    github:      document.getElementById('m-github').value.trim(),
    demo:        document.getElementById('m-demo').value.trim(),
    accentColor: selectedColor,
    image:       modalImgSrc,
  };

  const wasEditing = !!editingId;
  const data = load();
  if (editingId) {
    const idx = data.projects.findIndex(p => p.id === editingId);
    if (idx !== -1) data.projects[idx] = project;
  } else {
    data.projects.push(project);
  }

  save(data);
  renderProjects(data.projects);
  closeModal();
  toast(wasEditing ? 'Project updated' : 'Project added');
});

document.getElementById('btn-add-project').addEventListener('click', openAdd);

/* Escape key closes modal */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('is-hidden')) closeModal();
});

/* ── Skills ──────────────────────────────────────────────────── */
let activeSkillCat  = 'frontend';
let selectedSkills  = { frontend: [], backend: [], tools: [] };

function initSkills() {
  const data = load();
  selectedSkills = {
    frontend: data.skills && data.skills.frontend ? [...data.skills.frontend] : [...DEFAULT_SKILLS.frontend],
    backend:  data.skills && data.skills.backend  ? [...data.skills.backend]  : [...DEFAULT_SKILLS.backend],
    tools:    data.skills && data.skills.tools    ? [...data.skills.tools]    : [...DEFAULT_SKILLS.tools],
  };

  document.querySelectorAll('.skill-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSkillCat = btn.dataset.cat;
      document.querySelectorAll('.skill-tab').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('skill-search').value = '';
      renderSkillChips();
    });
  });

  document.getElementById('skill-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.skill-chip').forEach(c =>
      c.classList.toggle('chip-hidden', q.length > 0 && !c.dataset.label.includes(q))
    );
  });

  document.getElementById('btn-save-skills').addEventListener('click', () => {
    const data = load();
    data.skills = {
      frontend: [...selectedSkills.frontend],
      backend:  [...selectedSkills.backend],
      tools:    [...selectedSkills.tools],
    };
    save(data);
    toast('Skills saved');
  });

  renderSkillChips();
  initProficiency();
}

function renderSkillChips() {
  const container = document.getElementById('skill-chips');
  const countEl   = document.getElementById('skill-count');
  const registry  = (typeof SKILL_REGISTRY !== 'undefined' && SKILL_REGISTRY[activeSkillCat]) ? SKILL_REGISTRY[activeSkillCat] : [];
  const selected  = selectedSkills[activeSkillCat];

  container.innerHTML = registry.map(s => {
    const isSel  = selected.includes(s.id);
    const imgTag = s.icon
      ? `<img src="${s.icon}" alt="${esc(s.label)}" ${s.invert ? 'style="filter:invert(1) brightness(0.85)"' : ''} />`
      : `<div class="skill-icon-text">${esc(s.label.slice(0,2).toUpperCase())}</div>`;
    return `<div class="skill-chip ${isSel ? 'selected' : ''}" data-id="${s.id}" data-label="${s.label.toLowerCase()}" title="${esc(s.label)}">
      ${imgTag}
      <span>${esc(s.label)}</span>
    </div>`;
  }).join('');

  countEl.textContent = `${selected.length} selected`;

  container.querySelectorAll('.skill-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id  = chip.dataset.id;
      const sel = selectedSkills[activeSkillCat];
      const idx = sel.indexOf(id);
      if (idx !== -1) {
        sel.splice(idx, 1);
        chip.classList.remove('selected');
      } else {
        sel.push(id);
        chip.classList.add('selected');
      }
      document.getElementById('skill-count').textContent = `${sel.length} selected`;
    });
  });
}

/* ── Proficiency Bars ────────────────────────────────────────── */
function initProficiency() {
  renderProficiency();
  document.getElementById('btn-add-bar').addEventListener('click', () => {
    const data = load();
    if (!data.proficiency) data.proficiency = JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
    data.proficiency.push({ label: 'New Skill', pct: 50 });
    save(data);
    renderProficiency();
  });
}

function renderProficiency() {
  const data = load();
  const bars = (data.proficiency && data.proficiency.length) ? data.proficiency : JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
  const list = document.getElementById('prof-list');
  list.innerHTML = bars.length ? bars.map((b, i) =>
    `<div class="prof-row">
      <input type="text" class="admin-input" value="${esc(b.label)}" data-i="${i}" />
      <input type="number" class="admin-input prof-pct" value="${b.pct}" min="0" max="100" data-i="${i}" />
      <button class="btn-ghost btn-small" data-action="save-bar" data-i="${i}">Save</button>
      <button class="btn-danger btn-small" data-action="delete-bar" data-i="${i}">✕</button>
    </div>`
  ).join('') : '<p class="proj-empty">No bars yet.</p>';
}

/* Event delegation instead of inline onclick= (see projects-list handler above) */
document.getElementById('prof-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  if (btn.dataset.action === 'save-bar')   saveBar(i, btn);
  if (btn.dataset.action === 'delete-bar') deleteBar(i);
});

function saveBar(i, btn) {
  const row   = btn.closest('.prof-row');
  const label = row.querySelectorAll('input')[0].value.trim();
  const pct   = Math.min(100, Math.max(0, parseInt(row.querySelectorAll('input')[1].value) || 0));
  const data  = load();
  if (!data.proficiency) data.proficiency = JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
  data.proficiency[i] = { label: label || 'Skill', pct };
  save(data);
  toast('Bar saved');
}

function deleteBar(i) {
  const data = load();
  if (!data.proficiency) data.proficiency = JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
  data.proficiency.splice(i, 1);
  save(data);
  renderProficiency();
  toast('Bar removed');
}

/* ── Export for Vercel ───────────────────────────────────────── */
document.getElementById('btn-export').addEventListener('click', () => {
  const data = load();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('data.json downloaded — replace the file in your project, then git push');
});

/* ── PIN Change ──────────────────────────────────────────────── */
document.getElementById('btn-change-pin').addEventListener('click', () => {
  const newPin = document.getElementById('new-pin').value.trim();
  if (!/^\d{4}$/.test(newPin)) { toast('PIN must be exactly 4 digits', 'danger'); return; }
  localStorage.setItem(PIN_KEY, newPin);
  document.getElementById('new-pin').value = '';
  toast('PIN changed');
});

/* ── Utility ─────────────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Auto-unlock if already authenticated this session — must run last, after
   every const/listener above it (pfpPreview, modal, etc.) has initialized,
   since unlockApp() -> initApp() touches all of them. */
if (sessionStorage.getItem(SESSION_KEY)) unlockApp();
