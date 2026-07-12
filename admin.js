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

const PIN_KEY         = 'admin_pin';
const SESSION_KEY     = 'admin_unlocked';
const SECRET_KEY      = 'admin_secret_hash'; // SHA-256 of the PIN, sent as the API write credential

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
  ],
  certifications: [
    { id: 'c1', title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2025', url: '', image: null },
    { id: 'c2', title: 'Deep Learning Specialization',     issuer: 'DeepLearning.AI',     date: '2024', url: '', image: null },
  ]
};

/* ── Data layer — talks to /api/data (Vercel Blob-backed) instead of localStorage ── */
async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = {};
  const opts = { method, headers };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (method !== 'GET') {
    const secret = sessionStorage.getItem(SECRET_KEY);
    if (secret) headers['Authorization'] = 'Bearer ' + secret;
  }

  // 20s timeout, with one silent retry on GET only (never on POST/writes —
  // retrying a write could double-submit) since this backend occasionally
  // has slow individual requests.
  async function attempt() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      return await fetch(path, { ...opts, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  let res;
  try {
    res = await attempt();
  } catch (e) {
    if (method === 'GET') {
      try { res = await attempt(); }
      catch (e2) { throw new Error('Network error — check your connection and try again'); }
    } else {
      throw new Error('Network error — check your connection and try again');
    }
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('Not authorized — try locking and unlocking again');
    if (res.status === 413) throw new Error('That’s too large to save (try a smaller image)');
    throw new Error('Save failed (server said ' + res.status + ')');
  }
  return res.json();
}

let cachedData    = null;
let inFlightLoad  = null;

/* IMPORTANT: on failure this THROWS — it must never silently return the
   hardcoded DEFAULTS as if they were real data. Doing that previously meant
   a transient network blip could make the whole app look "empty", and if
   the user then saved anything, those defaults would overwrite their real
   saved content. Every caller is responsible for handling the rejection
   (see initApp's error screen, and the try/catches below). */
async function loadData({ force = false } = {}) {
  if (cachedData && !force) return cachedData;
  if (inFlightLoad) return inFlightLoad;
  inFlightLoad = apiFetch('/api/data', { method: 'GET' })
    .then(d => { cachedData = d; return d; })
    .finally(() => { inFlightLoad = null; });
  return inFlightLoad;
}

async function saveData(data) {
  await apiFetch('/api/data', { method: 'POST', body: data }); // throws on failure
  cachedData = data; // only cache after a confirmed successful write
  return data;
}

/* Disables `btn` and swaps its label to "Saving…" for the duration of `fn`,
   shows a danger toast on failure, always restores the button afterward. */
async function withSaving(btn, fn) {
  const original = btn ? btn.textContent : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    await fn();
  } catch (err) {
    toast(err.message || 'Something went wrong', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original; }
  }
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
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

async function unlockApp() {
  sessionStorage.setItem(SESSION_KEY, '1');
  pinGate.classList.add('is-hidden');
  adminApp.classList.remove('is-hidden');
  await initApp();
}

async function checkPin() {
  if (pinBuffer === getPin()) {
    const hash = await sha256Hex(pinBuffer);
    sessionStorage.setItem(SECRET_KEY, hash);
    await unlockApp();
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
  sessionStorage.removeItem(SECRET_KEY);
  adminApp.classList.add('is-hidden');
  pinGate.classList.remove('is-hidden');
  pinBuffer = '';
  updateDots();
});

/* ════════════════════════════════════════════════════════════
   ADMIN APP
   ════════════════════════════════════════════════════════════ */
async function initApp() {
  try {
    const data = await loadData();
    populateProfile(data);
    renderProjects(data.projects);
    buildColorSwatches();
    renderCerts(data.certifications);
    await initSkills();
    disablePinChange();
  } catch (err) {
    showLoadError(err);
  }
}

/* Shown when the initial load fails — deliberately replaces the editable UI
   instead of falling back to placeholder content, so there's nothing here
   that could be mistakenly saved over your real data. */
function showLoadError(err) {
  const main = document.querySelector('.admin-main');
  main.innerHTML = `
    <section class="admin-card">
      <h2 class="card-title">Couldn't load your data</h2>
      <p class="settings-hint">${esc(err.message || 'Unknown error')}. Nothing has been changed or lost —
      this just means the page couldn't fetch your saved content, so nothing was loaded into the form.</p>
      <div class="card-footer">
        <button id="btn-retry-load" class="btn-primary">Retry</button>
      </div>
    </section>`;
  document.getElementById('btn-retry-load').addEventListener('click', () => location.reload());
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

document.getElementById('btn-save-profile').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  await withSaving(btn, async () => {
    const data = await loadData();
    data.name = document.getElementById('field-name').value.trim() || data.name;
    data.role = document.getElementById('field-role').value.trim() || data.role;
    data.bio  = document.getElementById('field-bio').value.trim()  || data.bio;

    if (pfpPreview.src && !pfpPreview.classList.contains('is-hidden')) {
      data.profilePic = pfpPreview.src;
    } else if (btnRemovePfp.style.display === 'none') {
      data.profilePic = null;
    }

    await saveData(data);
    toast('Profile saved');
  });
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
  if (btn.dataset.action === 'delete') deleteProject(id, btn);
});

async function deleteProject(id, btn) {
  if (!confirm('Delete this project?')) return;
  await withSaving(btn, async () => {
    const data = await loadData();
    data.projects = data.projects.filter(p => p.id !== id);
    await saveData(data);
    renderProjects(data.projects);
    toast('Project deleted');
  });
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

async function openEdit(id) {
  let data;
  try { data = await loadData(); }
  catch (err) { toast(err.message || 'Could not load project', 'danger'); return; }
  const p = data.projects.find(x => x.id === id);
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

document.getElementById('modal-save').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
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

  await withSaving(btn, async () => {
    const data = await loadData();
    if (editingId) {
      const idx = data.projects.findIndex(p => p.id === editingId);
      if (idx !== -1) data.projects[idx] = project;
    } else {
      data.projects.push(project);
    }
    await saveData(data);
    renderProjects(data.projects);
    closeModal();
    toast(wasEditing ? 'Project updated' : 'Project added');
  });
});

document.getElementById('btn-add-project').addEventListener('click', openAdd);

/* ── Certifications List ─────────────────────────────────────── */
function renderCerts(certs) {
  const list = document.getElementById('certs-list');
  if (!certs || !certs.length) {
    list.innerHTML = '<p class="proj-empty">No certifications yet. Click "+ Add Certification" to get started.</p>';
    return;
  }
  list.innerHTML = certs.map((c, i) => {
    const num  = String(i + 1).padStart(2, '0');
    const meta = [c.issuer, c.date].filter(Boolean).join(' · ');
    return `<div class="proj-row" data-id="${c.id}">
      <span class="proj-num">${num}</span>
      <div class="proj-info">
        <div class="proj-name">${esc(c.title)}</div>
        <div class="proj-tags-preview">${esc(meta)}</div>
      </div>
      <div class="proj-actions">
        <button class="btn-ghost btn-small" data-action="edit" data-id="${c.id}">Edit</button>
        <button class="btn-danger btn-small" data-action="delete" data-id="${c.id}">Delete</button>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('certs-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit')   openCertEdit(id);
  if (btn.dataset.action === 'delete') deleteCert(id, btn);
});

async function deleteCert(id, btn) {
  if (!confirm('Delete this certification?')) return;
  await withSaving(btn, async () => {
    const data = await loadData();
    data.certifications = (data.certifications || []).filter(c => c.id !== id);
    await saveData(data);
    renderCerts(data.certifications);
    toast('Certification deleted');
  });
}

/* ── Certification Modal ─────────────────────────────────────── */
const certModal      = document.getElementById('cert-modal');
const certModalTitle = document.getElementById('cert-modal-title');
let   editingCertId  = null;
let   certImgSrc     = null;

const certImgInput       = document.getElementById('cert-img-input');
const certImgPreview     = document.getElementById('cert-img-preview');
const certImgPlaceholder = document.getElementById('cert-img-placeholder');
const btnRemoveCertImg   = document.getElementById('btn-remove-cert-img');

function setCertImg(src) {
  certImgSrc = src || null;
  if (src) {
    certImgPreview.src = src;
    certImgPreview.classList.remove('is-hidden');
    certImgPlaceholder.style.display = 'none';
    btnRemoveCertImg.style.display = 'inline-flex';
  } else {
    certImgPreview.src = '';
    certImgPreview.classList.add('is-hidden');
    certImgPlaceholder.style.display = '';
    btnRemoveCertImg.style.display = 'none';
  }
}

certImgInput.addEventListener('change', () => {
  const file = certImgInput.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast('Image must be under 3 MB', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => setCertImg(e.target.result);
  reader.readAsDataURL(file);
});

btnRemoveCertImg.addEventListener('click', () => {
  certImgInput.value = '';
  setCertImg(null);
});

function openCertAdd() {
  editingCertId = null;
  certModalTitle.textContent = 'Add Certification';
  document.getElementById('cm-title').value  = '';
  document.getElementById('cm-issuer').value = '';
  document.getElementById('cm-date').value   = '';
  document.getElementById('cm-url').value    = '';
  certImgInput.value = '';
  setCertImg(null);
  certModal.classList.remove('is-hidden');
  document.getElementById('cm-title').focus();
}

async function openCertEdit(id) {
  let data;
  try { data = await loadData(); }
  catch (err) { toast(err.message || 'Could not load certification', 'danger'); return; }
  const c = (data.certifications || []).find(x => x.id === id);
  if (!c) return;
  editingCertId = id;
  certModalTitle.textContent = 'Edit Certification';
  document.getElementById('cm-title').value  = c.title  || '';
  document.getElementById('cm-issuer').value = c.issuer || '';
  document.getElementById('cm-date').value   = c.date   || '';
  document.getElementById('cm-url').value    = c.url    || '';
  certImgInput.value = '';
  setCertImg(c.image || null);
  certModal.classList.remove('is-hidden');
  document.getElementById('cm-title').focus();
}

function closeCertModal() {
  certModal.classList.add('is-hidden');
  editingCertId = null;
  setCertImg(null);
}

document.getElementById('cert-modal-cancel').addEventListener('click', closeCertModal);
certModal.addEventListener('click', e => { if (e.target === certModal) closeCertModal(); });

document.getElementById('cert-modal-save').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const title = document.getElementById('cm-title').value.trim();
  if (!title) { toast('Title is required', 'danger'); return; }

  const cert = {
    id:     editingCertId || String(Date.now()),
    title,
    issuer: document.getElementById('cm-issuer').value.trim(),
    date:   document.getElementById('cm-date').value.trim(),
    url:    document.getElementById('cm-url').value.trim(),
    image:  certImgSrc,
  };

  const wasEditing = !!editingCertId;

  await withSaving(btn, async () => {
    const data = await loadData();
    if (!data.certifications) data.certifications = [];
    if (editingCertId) {
      const idx = data.certifications.findIndex(c => c.id === editingCertId);
      if (idx !== -1) data.certifications[idx] = cert;
    } else {
      data.certifications.push(cert);
    }
    await saveData(data);
    renderCerts(data.certifications);
    closeCertModal();
    toast(wasEditing ? 'Certification updated' : 'Certification added');
  });
});

document.getElementById('btn-add-cert').addEventListener('click', openCertAdd);

/* Escape key closes whichever modal is open */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!modal.classList.contains('is-hidden')) closeModal();
  if (!certModal.classList.contains('is-hidden')) closeCertModal();
});

/* ── Skills ──────────────────────────────────────────────────── */
let activeSkillCat  = 'frontend';
let selectedSkills  = { frontend: [], backend: [], tools: [] };

async function initSkills() {
  const data = await loadData();
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

  document.getElementById('btn-save-skills').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    await withSaving(btn, async () => {
      const data = await loadData();
      data.skills = {
        frontend: [...selectedSkills.frontend],
        backend:  [...selectedSkills.backend],
        tools:    [...selectedSkills.tools],
      };
      await saveData(data);
      toast('Skills saved');
    });
  });

  renderSkillChips();
  await initProficiency();
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
async function initProficiency() {
  await renderProficiency();
  document.getElementById('btn-add-bar').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    await withSaving(btn, async () => {
      const data = await loadData();
      if (!data.proficiency) data.proficiency = JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
      data.proficiency.push({ label: 'New Skill', pct: 50 });
      await saveData(data);
      await renderProficiency();
    });
  });
}

async function renderProficiency() {
  const data = await loadData();
  const bars = Array.isArray(data.proficiency) ? data.proficiency : JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
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
  if (btn.dataset.action === 'delete-bar') deleteBar(i, btn);
});

async function saveBar(i, btn) {
  const row   = btn.closest('.prof-row');
  const label = row.querySelectorAll('input')[0].value.trim();
  const pct   = Math.min(100, Math.max(0, parseInt(row.querySelectorAll('input')[1].value) || 0));
  await withSaving(btn, async () => {
    const data = await loadData();
    if (!data.proficiency) data.proficiency = JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
    data.proficiency[i] = { label: label || 'Skill', pct };
    await saveData(data);
    toast('Bar saved');
  });
}

async function deleteBar(i, btn) {
  await withSaving(btn, async () => {
    const data = await loadData();
    if (!data.proficiency) data.proficiency = JSON.parse(JSON.stringify(DEFAULT_PROFICIENCY));
    data.proficiency.splice(i, 1);
    await saveData(data);
    await renderProficiency();
    toast('Bar removed');
  });
}

/* ── Backup download ─────────────────────────────────────────── */
document.getElementById('btn-export').addEventListener('click', async () => {
  let data;
  try { data = await loadData(); }
  catch (err) { toast(err.message || 'Could not load data to export', 'danger'); return; }
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
  toast('Backup downloaded — your live site already has this data, this is just a local copy');
});

/* ── PIN change — disabled: the real write credential is a server-side
   env var (ADMIN_PIN_HASH) now, so a client-side PIN change here would
   silently desync and start failing every save. Rotate it by updating
   that env var and redeploying instead. ───────────────────────────── */
function disablePinChange() {
  const btn   = document.getElementById('btn-change-pin');
  const input = document.getElementById('new-pin');
  const hint  = btn.closest('.settings-row').querySelector('.settings-hint');
  btn.disabled = true;
  input.disabled = true;
  input.placeholder = 'Managed on the server';
  hint.textContent = 'The PIN is now enforced by the server, not just this page — ask your developer to rotate it if needed.';
}

/* ── Utility ─────────────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Auto-unlock if already authenticated this session — must run last, after
   every const/listener above it (pfpPreview, modal, etc.) has initialized,
   since unlockApp() -> initApp() touches all of them. */
if (sessionStorage.getItem(SESSION_KEY)) {
  unlockApp().catch(err => console.error('Auto-unlock failed:', err));
}
