/*************
 * LOAD DATA
 *************/
const QUEST_KEY = 'QuestForLife_Data';
const DEFAULT_QFL_DATA = {
    movies: [],
    exercises: [],
    recipes: []
};

let questForLifeData = loadState();
let currentView = 'home';

function loadState() {
    try {
        const storedQFLDataString = localStorage.getItem(QUEST_KEY);
        if (!storedQFLDataString) {
            localStorage.setItem(QUEST_KEY, JSON.stringify(DEFAULT_QFL_DATA));
            return structuredClone(DEFAULT_QFL_DATA);
        }
        const storedQFLData = JSON.parse(storedQFLDataString);
        // Basic shape sanity:
        if (!storedQFLData.movies) storedQFLData.movies = [];
        if (!storedQFLData.exercises) storedQFLData.exercises = [];
        if (!storedQFLData.recipes) storedQFLData.recipes = [];
        return storedQFLData;
    } catch (e) {
        console.warn('Data fetch from local storage: ', e);
        localStorage.setItem(QUEST_KEY, JSON.stringify(DEFAULT_QFL_DATA));
        return structuredClone(DEFAULT_QFL_DATA);
    }
}

function saveState() {
    localStorage.setItem(QUEST_KEY, JSON.stringify(questForLifeData));
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

    const select = document.getElementById('section-select');
    if (select && select.value !== name) {
        select.value = name;
    }
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

const sectionSelect = document.getElementById('section-select');
if (sectionSelect) {
    sectionSelect.addEventListener('change', (e) => {
        showView(e.target.value);
        // Optional: sync the hash if you’re using it as a permalink
        // location.hash = e.target.value;
    });
}

/*****************
 * Movies Module
 *****************/
const movieCardsEl = document.getElementById('movie-cards');
const movieEmptyEl = document.getElementById('movie-empty');
const searchEl = document.getElementById('search-movie');
const filterByEl = document.getElementById('filter-by');
const filterValueEl = document.getElementById('filter-value');
const filterValueLabel = document.getElementById('filter-value-label');

function getFacetValues(field) {
    const values = new Map(); // key -> display value
    const { movies = [] } = questForLifeData || {};
    if (!Array.isArray(movies) || !field) return [];

    for (const m of movies) {
        if (field === 'cast') {
            const arr = Array.isArray(m.cast) ? m.cast : [];
            for (const c of arr) {
                const k = toKey(c);
                if (k && !values.has(k)) values.set(k, c.trim());
            }
        } else {
            const raw = (m[field] || '').toString().trim();
            const k = toKey(raw);
            if (k && !values.has(k)) values.set(k, raw);
        }
    }
    return Array.from(values.values()).sort((a, b) => a.localeCompare(b));
}

function populateFilterValueOptions() {
    const field = filterByEl.value;
    const prev = filterValueEl.value;

    const pretty = field ? field[0].toUpperCase() + field.slice(1) : 'Value';
    filterValueLabel.textContent = `Filter: ${pretty}`;

    if (!field) {
        filterValueEl.innerHTML = `<option value="">All</option>`;
        filterValueEl.disabled = true;
        filterValueEl.value = '';
        return;
    }

    const values = getFacetValues(field);
    const options = [`<option value="">All ${escapeHTML(pretty.toLowerCase())}s</option>`]
        .concat(values.map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`))
        .join('');

    filterValueEl.innerHTML = options;
    filterValueEl.disabled = false;
    const hasPrev = values.some(v => toKey(v) === toKey(prev)) || prev === '';
    filterValueEl.value = hasPrev ? prev : '';
}

function renderMovies() {
    const { movies = [] } = questForLifeData || {};
    const q = toKey(searchEl.value);
    const field = filterByEl.value;
    const value = filterValueEl.value;

    const filtered = movies.filter(m => {
        const hay = [
            m.name, m.language, m.platform,
            ...(Array.isArray(m.cast) ? m.cast : [])
        ].filter(Boolean).join(' ').toLowerCase();

        const okQ = q ? hay.includes(q) : true;

        let okFacet = true;
        if (field && value) {
            const valKey = toKey(value);
            if (field === 'cast') {
                const castArr = Array.isArray(m.cast) ? m.cast : [];
                okFacet = castArr.some(c => toKey(c) === valKey);
            } else {
                okFacet = toKey(m[field]) === valKey;
            }
        }

        return okQ && okFacet;
    });

    movieCardsEl.innerHTML = '';
    if (filtered.length === 0) {
        movieEmptyEl.classList.remove('hidden');
    } else {
        movieEmptyEl.classList.add('hidden');
        for (const m of filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))) {
            const card = document.createElement('div');
            card.className = 'card';
            const castChips = (m.cast || [])
                .map(c => `<span class="chip" title="Cast">${escapeHTML(c)}</span>`)
                .join('');
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; justify-content:space-between">
                <h4>${escapeHTML(m.name || 'Untitled')}</h4>
                <span class="badge" title="Platform">
                    ${m.platform ? escapeHTML(m.platform) : '—'} · ${m.language ? escapeHTML(m.language) : '—'}
                </span>
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

    const before = filterValueEl.value;
    populateFilterValueOptions();
    if (before && Array.from(filterValueEl.options).some(o => toKey(o.value) === toKey(before))) {
        filterValueEl.value = before;
    }

    movieCardsEl.querySelectorAll('[data-act="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const m = questForLifeData.movies.find(x => x.id === id);
            if (!m) return;
            const ok = confirm(`Delete "${m.name}"?`);
            if (!ok) return;
            questForLifeData.movies = questForLifeData.movies.filter(x => x.id !== id);
            saveState();
            renderMovies();
        });
    });
    movieCardsEl.querySelectorAll('[data-act="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const m = questForLifeData.movies.find(x => x.id === id);
            if (!m) return;
            openMovieModal(m);
        });
    });
}

function initMovieFilters() {
    populateFilterValueOptions(); // start disabled
    renderMovies();

    searchEl.addEventListener('input', renderMovies);

    filterByEl.addEventListener('change', () => {
        populateFilterValueOptions();
        renderMovies();
    });

    filterValueEl.addEventListener('change', renderMovies);
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

const toKey = v => (v ?? '').toString().trim().toLowerCase();

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
        const idx = questForLifeData.movies.findIndex(m => m.id === editingId);
        if (idx >= 0) {
            questForLifeData.movies[idx] = {
                ...questForLifeData.movies[idx],
                name, language, platform, cast
            };
        }
    } else {
        questForLifeData.movies.push({
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
const btnSaveFolder = document.getElementById('btn-export');
const btnLoadFolder = document.getElementById('btn-import');
btnSaveFolder.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(questForLifeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quest-for-life-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
});
btnLoadFolder.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error('Invalid file.');
        // Merge strategy: replace everything for simplicity
        questForLifeData = {
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