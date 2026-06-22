/*************
 * LOAD DATA
 *************/
const QUEST_KEY = 'QuestForLife_Data';
const DEFAULT_QFL_DATA = {
    movies: [],
    watchedMovies: [],
    movieLogs: [],
    exercises: [],
    recipes: [],
    releasePulse: null
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
        if (!storedQFLData.watchedMovies) storedQFLData.watchedMovies = [];
        if (!storedQFLData.movieLogs) storedQFLData.movieLogs = [];
        if (!storedQFLData.exercises) storedQFLData.exercises = [];
        if (!storedQFLData.recipes) storedQFLData.recipes = [];
        return storedQFLData;
    } catch (e) {
        console.warn('Data fetch from local storage: ', e);
        localStorage.setItem(QUEST_KEY, JSON.stringify(DEFAULT_QFL_DATA));
        return structuredClone(DEFAULT_QFL_DATA);
    }
}

function saveState(tab = "unwatched") {
    localStorage.setItem(QUEST_KEY, JSON.stringify(questForLifeData));
    tab === "unwatched" ? renderMovies() : renderWatchedMovies(); // Keep UI in sync
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
const movieLogContainerEl = document.getElementById('movie-log-container');
const movieEmptyEl = document.getElementById('movie-empty');
const movieWatchedEmptyEl = document.getElementById('movie-watched-empty');
const movieLogEmptyEl = document.getElementById('movie-log-empty');
const movieControlEl = document.getElementById('movie-control');
const movieFilterEl = document.getElementById('movie-filter');
const searchEl = document.getElementById('search-movie');
const filterByEl = document.getElementById('filter-by');
const filterValueEl = document.getElementById('filter-value');
const moviesViewEl = document.getElementById('movies-view');
const watchedCheckboxEl = document.getElementById('watched-view');
const logCheckboxEl = document.getElementById('log-view');
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
            card.className = 'col-12 col-md-6 col-lg-4';
            const castChips = (m.cast || [])
                .map(c => `<span class="badge rounded-pill text-bg-info me-1">${escapeHTML(c)}</span>`)
                .join('');
            card.innerHTML = `
                <div class="card shadow-sm h-100">
                    <div class="card-body d-flex flex-column gap-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">${escapeHTML(m.name || 'Untitled')}</h5>
                            <span class="badge rounded-pill text-bg-dark">
                                ${m.platform ? escapeHTML(m.platform) : '—'} · ${m.language ? escapeHTML(m.language) : '—'}
                            </span>
                        </div>
                        <div class="text-muted small">Added on ${formatDate(m.createdAt)}</div>
                        <div>${castChips || '<span class="muted">No cast listed</span>'}</div>
                        <div class="mt-auto d-flex justify-content-end gap-2">
                            <button class="btn btn-secondary" data-act="movie-edit" data-id="${m.id}">✎ Edit</button>
                            <button class="btn btn-success" data-act="movie-mark-watched" data-id="${m.id}" title="Mark as watched">✓ Watched</button>
                        </div>
                    </div>
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

    movieCardsEl.querySelectorAll('[data-act="movie-mark-watched"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const watchedMovie = questForLifeData.movies.find(x => x.id === id);
            if (!watchedMovie) return;
            const ok = confirm(`Mark "${watchedMovie.name}" as watched?`);
            if (!ok) return;
            questForLifeData.movies = questForLifeData.movies.filter(x => x.id !== id);
            watchedMovie.watchedAt = Date.now();
            questForLifeData.watchedMovies.push(watchedMovie);
            const movieLog = structuredClone(watchedMovie);
            movieLog.logType = "Watch";
            movieLog.logTime = Date.now();
            movieLog.moviesCount = questForLifeData.movies.length;
            questForLifeData.movieLogs.unshift(movieLog);
            saveState();
        });
    });
    movieCardsEl.querySelectorAll('[data-act="movie-edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const m = questForLifeData.movies.find(x => x.id === id);
            if (!m) return;
            openMovieModal(m);
        });
    });

    movieControlEl.classList.remove('hidden');
    movieWatchedEmptyEl.classList.add('hidden');
    movieLogEmptyEl.classList.add('hidden');
    movieFilterEl.classList.remove("hidden");
    movieCardsEl.classList.remove('hidden');
    movieLogContainerEl.classList.add('hidden');
    movieCount(filtered);
    renderReleasePulse();
}

function renderWatchedMovies() {
    const { watchedMovies = [] } = questForLifeData || {};

    movieCardsEl.innerHTML = '';
    if (watchedMovies.length === 0) {
        movieWatchedEmptyEl.classList.remove('hidden');
    } else {
        movieWatchedEmptyEl.classList.add('hidden');
        for (const m of watchedMovies.sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0))) {
            const card = document.createElement('div');
            card.className = 'col-12 col-md-6 col-lg-4';
            const castChips = (m.cast || [])
            .map(c => `<span class="badge rounded-pill text-bg-info me-1">${escapeHTML(c)}</span>`)
            .join('');
            card.innerHTML = `
                <div class="card shadow-sm h-100">
                    <div class="card-body d-flex flex-column gap-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">${escapeHTML(m.name || 'Untitled')}</h5>
                        <span class="badge rounded-pill text-bg-dark">
                            ${m.platform ? escapeHTML(m.platform) : '—'} · ${m.language ? escapeHTML(m.language) : '—'}
                        </span>
                    </div>
                    <div class="text-muted small">Watched on ${formatDate(m.watchedAt)}</div>
                    <div>${castChips || '<span class="text-muted small">No cast listed</span>'}</div>
                    <div class="mt-auto d-flex justify-content-end gap-2">
                        <button class="btn btn-primary" data-act="movie-mark-unwatched" data-id="${m.id}" title="Move back to To Watch">
                            ↻ Unwatch
                        </button>
                        <button class="btn btn-danger" data-act="movie-delete" data-id="${m.id}" title="Delete permanently">
                            ✕ Delete
                        </button>
                    </div>
                    </div>
                </div>
            `;
            movieCardsEl.appendChild(card);
        }
    }

    movieCardsEl.querySelectorAll('[data-act="movie-mark-unwatched"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const movie = questForLifeData.watchedMovies.find(x => x.id === id);
            if (!movie) return;
            const ok = confirm(`You blinked the whole time, didn't you. Add "${movie.name}" back to watchlist?`);
            if (!ok) return;
            questForLifeData.watchedMovies = questForLifeData.watchedMovies.filter(x => x.id !== id);
            questForLifeData.movies.push(movie);
            const movieLog = structuredClone(movie);
            movieLog.logType = "Unwatch";
            movieLog.logTime = Date.now();
            movieLog.moviesCount = questForLifeData.movies.length;
            questForLifeData.movieLogs.unshift(movieLog);
            saveState("watched");
        });
    });
    movieCardsEl.querySelectorAll('[data-act="movie-delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const movie = questForLifeData.watchedMovies.find(x => x.id === id);
            if (!movie) return;
            const ok = confirm(`Delete "${movie.name}"?`);
            if (!ok) return;
            questForLifeData.watchedMovies = questForLifeData.watchedMovies.filter(x => x.id !== id);
            const movieLog = structuredClone(movie);
            movieLog.logType = "Delete";
            movieLog.logTime = Date.now();
            movieLog.moviesCount = questForLifeData.movies.length;
            questForLifeData.movieLogs.unshift(movieLog);
            saveState("watched");
        });
    });

    movieControlEl.classList.add('hidden');
    movieEmptyEl.classList.add('hidden');
    movieLogEmptyEl.classList.add('hidden');
    movieFilterEl.classList.add("hidden");
    movieCardsEl.classList.remove('hidden');
    movieLogContainerEl.classList.add('hidden');
}

function movieCount(movies) {
    let movieCountEl = document.querySelector("#movie-count");
    let movieCountTextEl = document.querySelector("#movie-count-text");
    switch (movies.length) {
        case 0:
            movieCountEl.innerHTML = "";
            movieCountTextEl.innerHTML = "No gems💎 yet — add your first one ✨";
            break;
        case 1:
            movieCountEl.innerHTML = movies.length + " gem💎";
            movieCountTextEl.innerHTML = " ready to watch 🎬";
            break;
        default:
            movieCountEl.innerHTML = movies.length + " gems💎";
            movieCountTextEl.innerHTML = " ready to watch 🎬";
            break;
    }
}

function renderReleasePulse() {
    const el = document.getElementById('release-pulse');
    if (!el) return;

    const date = formatDate(questForLifeData.releasePulse);
    el.innerHTML = `Release Pulse: <strong>${date}</strong>`;
}

function updateReleasePulse() {
    const ok = confirm("Update Release Pulse?");
    if (!ok) return;

    questForLifeData.releasePulse = Date.now();
    saveState();
    renderReleasePulse();
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
    
    moviesViewEl.addEventListener("change", function () {
        if (this.checked) {
            renderMovies();
        }
    });

    watchedCheckboxEl.addEventListener("change", function () {
        if(this.checked){
            renderWatchedMovies();
        }
    });

    logCheckboxEl.addEventListener("change", function () {
        if(this.checked){
            renderLogs();
        }
    });
}

function renderLogs() {
    const { movieLogs = [] } = questForLifeData || {};

    movieLogContainerEl.innerHTML = '';

    if (movieLogs.length === 0) {
        movieLogEmptyEl.classList.remove('hidden');
    } else {
        movieLogEmptyEl.classList.add('hidden');

        const groups = new Map();
        for (const log of movieLogs) {
            const day = formatDay(log.logTime);
            if (!groups.has(day)) groups.set(day, []);
            groups.get(day).push(log);
        }

        for (const [day, list] of groups.entries()) {
            const dayEl = document.createElement('div');
            dayEl.className = 'timeline-day';

            const h = document.createElement('h3');
            h.className = 'timeline-date';
            h.textContent = day;
            dayEl.appendChild(h);

            for (const log of list) {
                const time = formatTime(log.logTime);
                const m = typeMeta(log.logType);
                const platform = log.platform ? `on ${log.platform}` : '';
                const moviesCount = log.moviesCount ? `${log.moviesCount}` : '';
                const lang = log.language ? `${log.language}` : '';
                const cast = Array.isArray(log.cast) && log.cast.length ? `${log.cast.slice(0, 2).join(', ')}${log.cast.length > 2 ? '…' : ''}` : '';

                const item = document.createElement('div');
                item.className = 'timeline-item';
                // set CSS vars for the marker
                item.style.setProperty('--icon', `"${m.icon}"`);
                item.style.setProperty('--bg', m.bg);
                item.style.setProperty('--fg', m.fg);

                item.innerHTML = `
                    <div class="timeline-title">
                        <span class="badge ${m.cls}" aria-label="${m.label}">
                        ${m.icon} ${m.label}
                        </span>
                        <span class="movie-name">${log.name}</span>
                        <span class="meta">at ${time}</span>
                    </div>
                    <div class="timeline-details">
                        ${platform ? `<span>${platform}</span>` : ''}
                        ${lang ? `<span class="sep">${lang}</span>` : ''}
                        ${cast ? `<span class="sep">Cast: ${cast}</span>` : ''}
                        ${moviesCount ? `<span class="sep">To‑Watch: <b>${log.moviesCount}</b></span>` : ''}
                    </div>
                    `;

                dayEl.appendChild(item);
            }

            movieLogContainerEl.appendChild(dayEl);
        }
    }

    movieControlEl.classList.add('hidden');
    movieEmptyEl.classList.add('hidden');
    movieWatchedEmptyEl.classList.add('hidden');
    movieFilterEl.classList.add("hidden");
    movieCardsEl.classList.add('hidden');
    movieLogContainerEl.classList.remove('hidden');
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
        return d.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—' }
}

function formatDay(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const toKey = v => (v ?? '').toString().trim().toLowerCase();

// Map type to badge/icon/colors
function typeMeta(type) {
    switch ((type || '').toLowerCase()) {
        case 'add': return { cls: 'add', label: 'Added', icon: '➕', bg: '#dbeafe', fg: '#1d4ed8' };
        case 'watch': return { cls: 'watch', label: 'Watched', icon: '🎬', bg: '#d1fae5', fg: '#047857' };
        case 'unwatch': return { cls: 'unwatch', label: 'Unwatched', icon: '↩', bg: '#fde68a', fg: '#b45309' };
        case 'delete': return { cls: 'delete', label: 'Deleted', icon: '🗑', bg: '#fecaca', fg: '#b91c1c' };
        default: return { cls: 'add', label: type, icon: '•', bg: '#e5e7eb', fg: '#111827' };
    }
}

/*****************
 * Add/Edit Movie
 *****************/
const movieModal = new bootstrap.Modal(document.getElementById('modal-movie'));
const movieForm = document.getElementById('movie-form');
const movieClose = document.getElementById('movie-close');
const movieCancel = document.getElementById('movie-cancel');
const mfName = document.getElementById('mf-name');
const mfLang = document.getElementById('mf-language');
const mfPlat = document.getElementById('mf-platform');
const mfCast = document.getElementById('mf-cast');

let editingId = null;

document.getElementById('btn-add-movie').addEventListener('click', () => addMovieModal());

function addMovieModal(movie = null) {
    editingId = movie?.id || null;
    movieForm.reset();
    mfName.value = movie?.name || '';
    mfLang.value = movie?.language || '';
    mfPlat.value = movie?.platform || '';
    mfCast.value = (movie?.cast || []).join(', ');
    movieModal.show();
}

function closeMovieModal() {
    movieModal.hide();
}

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
    const movieLog = structuredClone(questForLifeData.movies[questForLifeData.movies.length - 1]);
    movieLog.logType = "Add";
    movieLog.logTime = Date.now();
    movieLog.moviesCount = questForLifeData.movies.length;
    questForLifeData.movieLogs.unshift(movieLog);

    saveState();
    closeMovieModal();
});

document.getElementById('btn-release-pulse').addEventListener('click', () => updateReleasePulse());

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
            watchedMovies: Array.isArray(data.watchedMovies) ? data.watchedMovies : [],
            movieLogs: Array.isArray(data.movieLogs) ? data.movieLogs : [],
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