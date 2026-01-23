
/***************
 * App State
 ***************/
const APP_KEY = 'lifeTrackerData_v1';
const DEFAULT_DATA = {
    movies: [
        // Sample entries to showcase the UI (you can remove them)
        { id: crypto.randomUUID(), name: "Inception", language: "English", platform: "Netflix", cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"], createdAt: Date.now() - 86400_000 },
        { id: crypto.randomUUID(), name: "3 Idiots", language: "Hindi", platform: "Prime Video", cast: ["Aamir Khan", "R. Madhavan", "Sharman Joshi", "Kareena Kapoor"], createdAt: Date.now() - 43200_000 },
    ],
    exercises: [],
    recipes: []
};

let state = loadState();
let currentView = 'home';
let dirHandle = null; // File System Access API directory handle when selected
const supportsFS = 'showDirectoryPicker' in window;

function loadState() {
    try {
        const raw = localStorage.getItem(APP_KEY);
        if (!raw) {
            localStorage.setItem(APP_KEY, JSON.stringify(DEFAULT_DATA));
            return structuredClone(DEFAULT_DATA);
        }
        const parsed = JSON.parse(raw);
        // Basic shape sanity:
        if (!parsed.movies) parsed.movies = [];
        if (!parsed.exercises) parsed.exercises = [];
        if (!parsed.recipes) parsed.recipes = [];
        return parsed;
    } catch (e) {
        console.warn('Failed to parse state; resetting.', e);
        localStorage.setItem(APP_KEY, JSON.stringify(DEFAULT_DATA));
        return structuredClone(DEFAULT_DATA);
    }
}
function saveState() {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
    renderMovies(); // Keep UI in sync
}

/***************
 * Simple Router
 ***************/
const views = {
    home: document.getElementById('view-home'),
    movies: document.getElementById('view-movies'),
    gym: document.getElementById('view-gym'),
    recipes: document.getElementById('view-recipes'),
};
const tabs = [...document.querySelectorAll('.tab')];
function showView(name) {
    currentView = name;
    Object.entries(views).forEach(([k, el]) => {
        el.classList.toggle('hidden', k !== name);
    });
    tabs.forEach(t => {
        const active = t.dataset.view === name;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    // focus management
    const firstHeading = views[name].querySelector('.title');
    if (firstHeading) firstHeading.setAttribute('tabindex', '-1'), firstHeading.focus();
    if (name === 'movies') initMovieFilters();
}

tabs.forEach(t => t.addEventListener('click', () => showView(t.dataset.view)));
document.querySelectorAll('[data-go]').forEach(card => {
    card.addEventListener('click', () => showView(card.dataset.go));
    card.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') showView(card.dataset.go) });
});

// Persist view via hash (optional)
window.addEventListener('hashchange', () => {
    const target = location.hash.replace('#', '');
    if (views[target]) showView(target);
});
if (location.hash && views[location.hash.replace('#', '')]) {
    showView(location.hash.replace('#', ''));
} else {
    showView('home');
}

/*****************
 * Movies Module
 *****************/
const movieCardsEl = document.getElementById('movie-cards');
const movieEmptyEl = document.getElementById('movie-empty');
const searchEl = document.getElementById('search-movie');
const filterPlatformEl = document.getElementById('filter-platform');

function renderMovies() {
    const { movies } = state;
    // Filters
    const q = (searchEl.value || '').toLowerCase().trim();
    const pf = (filterPlatformEl.value || '').toLowerCase().trim();

    const filtered = movies.filter(m => {
        const hay = [
            m.name, m.language, m.platform,
            ...(Array.isArray(m.cast) ? m.cast : [])
        ].filter(Boolean).join(' ').toLowerCase();
        const okQ = q ? hay.includes(q) : true;
        const okP = pf ? (m.platform || '').toLowerCase() === pf : true;
        return okQ && okP;
    });

    movieCardsEl.innerHTML = '';
    if (filtered.length === 0) {
        movieEmptyEl.classList.remove('hidden');
    } else {
        movieEmptyEl.classList.add('hidden');
        for (const m of filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))) {
            const card = document.createElement('div');
            card.className = 'card';
            const castChips = (m.cast || []).map(c => `<span class="chip" title="Cast">${escapeHTML(c)}</span>`).join('');
            card.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; justify-content:space-between">
              <h4>${escapeHTML(m.name || 'Untitled')}</h4>
              <span class="badge" title="Platform">${m.platform ? escapeHTML(m.platform) : '—'} · ${m.language ? escapeHTML(m.language) : '—'}</span>
            </div>
            <div class="muted" style="font-size:12px">Added on ${formatDate(m.createdAt)}</div>
            <div>${castChips || '<span class="muted">No cast listed</span>'}</div>
            <div class="card-actions">
              <button class="btn" data-act="edit" data-id="${m.id}">✎ Edit</button>
              <button class="btn danger" data-act="delete" data-id="${m.id}">🗑 Delete</button>
            </div>
          `;
            movieCardsEl.appendChild(card);
        }
    }

    // update platform filter options
    const platforms = Array.from(new Set(state.movies.map(m => (m.platform || '').trim()).filter(Boolean))).sort();
    const current = filterPlatformEl.value;
    filterPlatformEl.innerHTML = `<option value="">All platforms</option>` + platforms.map(p => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join('');
    filterPlatformEl.value = current; // retain selection if possible

    // bind actions
    movieCardsEl.querySelectorAll('[data-act="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const m = state.movies.find(x => x.id === id);
            if (!m) return;
            const ok = confirm(`Delete "${m.name}"?`);
            if (!ok) return;
            state.movies = state.movies.filter(x => x.id !== id);
            saveState();
        });
    });
    movieCardsEl.querySelectorAll('[data-act="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const m = state.movies.find(x => x.id === id);
            if (!m) return;
            openMovieModal(m); // prefill
        });
    });
}

function initMovieFilters() {
    renderMovies();
    searchEl.addEventListener('input', renderMovies, { once: true }); // attach only once
    filterPlatformEl.addEventListener('change', renderMovies, { once: true });
}

// Utilities
function escapeHTML(str) {
    return (str ?? '').toString().replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[s]));
}
function formatDate(ts) {
    if (!ts) return '—';
    try {
        const d = new Date(ts);
        return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—' }
}

/*****************
 * Add/Edit Movie
 *****************/
const modal = document.getElementById('modal-movie');
const movieForm = document.getElementById('movie-form');
const movieClose = document.getElementById('movie-close');
const movieCancel = document.getElementById('movie-cancel');
const mfName = document.getElementById('mf-name');
const mfLang = document.getElementById('mf-language');
const mfPlat = document.getElementById('mf-platform');
const mfCast = document.getElementById('mf-cast');

let editingId = null;

document.getElementById('btn-add-movie').addEventListener('click', () => openMovieModal());

function openMovieModal(movie = null) {
    editingId = movie?.id || null;
    movieForm.reset();
    mfName.value = movie?.name || '';
    mfLang.value = movie?.language || '';
    mfPlat.value = movie?.platform || '';
    mfCast.value = (movie?.cast || []).join(', ');
    if (typeof modal.showModal === 'function') { modal.showModal(); } else { alert('Modal not supported in this browser.'); }
}
function closeMovieModal() {
    if (modal.open) modal.close();
}
movieClose.addEventListener('click', closeMovieModal);
movieCancel.addEventListener('click', closeMovieModal);

movieForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = mfName.value.trim();
    if (!name) { alert('Movie name is required'); return; }
    const language = mfLang.value.trim();
    const platform = mfPlat.value.trim();
    const cast = mfCast.value.split(',').map(s => s.trim()).filter(Boolean);

    if (editingId) {
        // update
        const idx = state.movies.findIndex(m => m.id === editingId);
        if (idx >= 0) {
            state.movies[idx] = {
                ...state.movies[idx],
                name, language, platform, cast
            };
        }
    } else {
        state.movies.push({
            id: crypto.randomUUID(),
            name, language, platform, cast,
            createdAt: Date.now()
        });
    }
    saveState();
    closeMovieModal();
});

/*******************************
 * Import / Export (JSON file)
 *******************************/
const fileImport = document.getElementById('file-import');
document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'life-tracker-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
});
fileImport.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error('Invalid file.');
        // Merge strategy: replace everything for simplicity
        state = {
            movies: Array.isArray(data.movies) ? data.movies : [],
            exercises: Array.isArray(data.exercises) ? data.exercises : [],
            recipes: Array.isArray(data.recipes) ? data.recipes : [],
        };
        saveState();
        alert('Import successful.');
    } catch (err) {
        console.error(err);
        alert('Failed to import. Please select a valid JSON export.');
    } finally {
        e.target.value = '';
    }
});

/*****************************************
 * Optional: File System Access API path
 *****************************************/
const btnSelectFolder = document.getElementById('btn-select-folder');
const btnSaveFolder = document.getElementById('btn-save-folder');
const btnLoadFolder = document.getElementById('btn-load-folder');

if (supportsFS) {
    btnSelectFolder.classList.remove('hidden');
    btnSaveFolder.classList.remove('hidden');
    btnLoadFolder.classList.remove('hidden');

    btnSelectFolder.addEventListener('click', async () => {
        try {
            dirHandle = await window.showDirectoryPicker({ id: 'life-tracker-folder' });
            alert('Folder selected. You can now Save/Load JSON in that folder.');
        } catch (err) {
            if (err?.name !== 'AbortError') console.warn('Folder selection failed:', err);
        }
    });

    btnSaveFolder.addEventListener('click', async () => {
        if (!dirHandle) { alert('Please select a storage folder first.'); return; }
        try {
            const fileHandle = await getOrCreateFileHandle(dirHandle, 'movie-tracker.json');
            await writeFile(fileHandle, JSON.stringify({ movies: state.movies }, null, 2));
            alert('Saved to movie-tracker.json in the selected folder.');
        } catch (err) {
            console.error(err);
            alert('Failed to save to folder. Ensure permissions are granted.');
        }
    });

    btnLoadFolder.addEventListener('click', async () => {
        if (!dirHandle) { alert('Please select a storage folder first.'); return; }
        try {
            const fileHandle = await dirHandle.getFileHandle('movie-tracker.json', { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data || !Array.isArray(data.movies)) throw new Error('Invalid movie-tracker.json');
            state.movies = data.movies;
            saveState();
            alert('Loaded movies from movie-tracker.json');
        } catch (err) {
            console.error(err);
            alert('Failed to load. Ensure movie-tracker.json exists and is valid.');
        }
    });
}

async function getOrCreateFileHandle(dir, name) {
    try {
        return await dir.getFileHandle(name, { create: true });
    } catch (e) {
        // Some browsers require create:false to probe then create
        const handle = await dir.getFileHandle(name, { create: false }).catch(() => null);
        if (handle) return handle;
        return await dir.getFileHandle(name, { create: true });
    }
}
async function writeFile(fileHandle, contents) {
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
}

/**********************
 * Keyboard shortcuts
 **********************/
document.addEventListener('keydown', (e) => {
    if (e.key === 'n' && (e.ctrlKey || e.metaKey) && currentView === 'movies') {
        e.preventDefault(); openMovieModal();
    }
    if (e.key === 'Escape' && modal?.open) closeMovieModal();
});

// Initial render
renderMovies();