// ============================================================
//  ★ KONFIGURASI SPREADSHEET ★
//  Ganti ID dengan spreadsheet-mu
// ============================================================

// ★ GANTI DENGAN ID SPREADSHEET ANIME ★
const SHEET_ID_ANIME = '2PACX-1vRuF_ijjsJZRQjXLXmJcq4Cji2qq5UePwCurLI4-YNpJXETguh-F3PMtUpTaITATGxPrNcrXXuItcgh';

// ★ GANTI DENGAN ID SPREADSHEET EPISODE ★
const SHEET_ID_EPISODE = '2PACX-1vT15YMAkebNMF0RMD-QCdgXFWSCmdVG0Rm7JUN3ih0jq71pGERqxJD5FHu0Ee3OLLiv4er4v6yBgZ_B';

// URL untuk mengambil data CSV
const ANIME_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_ANIME}/pub?output=csv&gid=0`;
const EPISODES_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_EPISODE}/pub?output=csv&gid=0`;

// ============================================================
//  ★ PARSE CSV ★
// ============================================================
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx] || '';
        });
        result.push(obj);
    }
    return result;
}

// ============================================================
//  ★ LOAD DATA DARI SPREADSHEET ★
// ============================================================
async function loadFromSpreadsheet() {
    const grid = document.getElementById('animeGrid');
    if (!grid) return;
    grid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        // Load anime
        const animeRes = await fetch(ANIME_URL);
        if (!animeRes.ok) throw new Error('Gagal load anime');
        const animeCSV = await animeRes.text();
        const animeList = parseCSV(animeCSV);

        // Load episodes
        const epRes = await fetch(EPISODES_URL);
        if (!epRes.ok) throw new Error('Gagal load episodes');
        const epCSV = await epRes.text();
        const episodesList = parseCSV(epCSV);

        console.log('📊 Anime loaded:', animeList.length);
        console.log('📊 Episodes loaded:', episodesList.length);

        // Simpan ke localStorage untuk diakses info.html
        localStorage.setItem('allAnime', JSON.stringify(animeList));
        localStorage.setItem('allEpisodes', JSON.stringify(episodesList));

        // Render halaman
        renderAnimeList(animeList, 'all', 1);
    } catch (error) {
        console.error('Error loading from spreadsheet:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data dari Spreadsheet.</p>
                <p style="font-size:12px; margin-top:8px; color:#8892b0;">
                    Pastikan spreadsheet sudah dipublish dan ID-nya benar.
                </p>
            </div>
        `;
    }
}

// ============================================================
//  ★ RENDER ANIME LIST ★
// ============================================================
function renderAnimeList(animeList, genre = 'all', page = 1) {
    const grid = document.getElementById('animeGrid');
    if (!grid) return;

    let filteredList = [...animeList];

    // Sortir dari yang terbaru
    filteredList.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter genre
    if (genre !== 'all') {
        filteredList = filteredList.filter(anime => {
            const genres = anime.genre ? anime.genre.toLowerCase().split(/[,;]\s*/) : [];
            return genres.some(g => g.trim() === genre.toLowerCase());
        });
    }

    // Pagination
    const itemsPerPage = 24;
    const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredList.slice(start, end);

    if (pageItems.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-frown"></i><p>Tidak ada anime dengan genre "${genre}".</p></div>`;
        updatePaginationButtons(totalPages, page);
        return;
    }

    grid.innerHTML = pageItems.map(anime => `
        <div class="anime-card" onclick="openAnime('${anime.id}')">
            <img src="${anime.image || 'https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
            <div class="info">
                <h3>${anime.title || 'No Title'}</h3>
                <p>${anime.genre || 'Anime'}</p>
            </div>
        </div>
    `).join('');

    updatePaginationButtons(totalPages, page);
}

// ============================================================
//  ★ UPDATE PAGINATION ★
// ============================================================
function updatePaginationButtons(totalPages, currentPage) {
    const prev = document.getElementById('prevPageBtn');
    const next = document.getElementById('nextPageBtn');
    const info = document.getElementById('pageInfo');
    if (prev) prev.disabled = (currentPage <= 1);
    if (next) next.disabled = (currentPage >= totalPages);
    if (info) info.textContent = `Halaman ${currentPage} dari ${totalPages}`;
}

// ============================================================
//  ★ OPEN ANIME ★
// ============================================================
function openAnime(animeId) {
    const allAnime = JSON.parse(localStorage.getItem('allAnime') || '[]');
    const allEpisodes = JSON.parse(localStorage.getItem('allEpisodes') || '[]');

    const anime = allAnime.find(a => a.id === animeId);
    if (!anime) {
        alert('Anime tidak ditemukan!');
        return;
    }

    const episodes = allEpisodes.filter(ep => ep.anime_id === animeId);

    localStorage.setItem('currentAnime', JSON.stringify(anime));
    localStorage.setItem('currentEpisodes', JSON.stringify(episodes));

    location.href = `${animeId}/info.html`;
}

// ============================================================
//  ★ FILTER & SEARCH ★
// ============================================================
function filterByGenre(genre) {
    const allAnime = JSON.parse(localStorage.getItem('allAnime') || '[]');
    document.querySelectorAll('.genre-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.genre === genre);
    });
    renderAnimeList(allAnime, genre, 1);
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
        genreFilter.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function goHome() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-home').classList.add('active');
    const allAnime = JSON.parse(localStorage.getItem('allAnime') || '[]');
    renderAnimeList(allAnime, 'all', 1);
}

function searchAnime() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
    const grid = document.getElementById('animeGrid');
    if (!query || !grid) { goHome(); return; }

    const allAnime = JSON.parse(localStorage.getItem('allAnime') || '[]');
    const results = allAnime.filter(a => a.title.toLowerCase().includes(query));

    if (results.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>Tidak ada hasil untuk "${query}"</p></div>`;
        return;
    }

    grid.innerHTML = results.map(anime => `
        <div class="anime-card" onclick="openAnime('${anime.id}')">
            <img src="${anime.image || 'https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
            <div class="info">
                <h3>${anime.title || 'No Title'}</h3>
                <p>${anime.genre || 'Anime'}</p>
            </div>
        </div>
    `).join('');
    document.querySelector('.pagination').style.display = 'none';
}

// ============================================================
//  ★ INISIALISASI ★
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromSpreadsheet();
    document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchAnime();
    });
    document.querySelector('.pagination').style.display = 'flex';
});

console.log('🚀 AnimeStream dengan Google Spreadsheet siap!');
console.log('📊 Data otomatis dari spreadsheet.');
console.log('💡 Edit spreadsheet, refresh website, data langsung berubah!');
