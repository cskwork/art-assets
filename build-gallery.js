/**
 * build-gallery.js
 * assets-source.json -> assets.json 빌드 후 gallery.html 생성
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 먼저 assets 빌드 실행
console.log('=== assets 빌드 ===');
try {
  execSync('node scripts/build-assets.js', { cwd: __dirname, stdio: 'inherit' });
} catch (error) {
  console.error('assets 빌드 실패:', error.message);
  process.exit(1);
}

console.log('');
console.log('=== gallery.html 생성 ===');

// assets.json 로드
const assetsPath = path.join(__dirname, 'assets.json');
const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));

// 카테고리별 에셋 분류
const categoryMap = {};
assets.assets.forEach(asset => {
  if (!categoryMap[asset.category]) {
    categoryMap[asset.category] = [];
  }
  categoryMap[asset.category].push(asset);
});

// 카테고리 정렬 순서
const categoryOrder = ['icons', 'illustrations', 'diagrams', 'backgrounds', 'photos', '3d'];

// HTML 생성
function generateHTML() {
  const totalCount = assets.assets.length;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Art Assets Gallery</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.5;
    }

    .header {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .header h1 span {
      color: #888;
      font-weight: 400;
      font-size: 1rem;
    }

    .search-box {
      display: flex;
      gap: 0.5rem;
    }

    .search-box input {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      width: 250px;
    }

    .search-box input:focus {
      outline: none;
      border-color: #4a90d9;
    }

    .tabs {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      padding: 0 2rem;
    }

    .tabs-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      gap: 0;
      overflow-x: auto;
    }

    .tab {
      padding: 0.75rem 1.25rem;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.9rem;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab:hover {
      color: #333;
      background: #f9f9f9;
    }

    .tab.active {
      color: #4a90d9;
      border-bottom-color: #4a90d9;
      font-weight: 500;
    }

    .tab .count {
      background: #eee;
      padding: 0.1rem 0.4rem;
      border-radius: 10px;
      font-size: 0.75rem;
      margin-left: 0.3rem;
    }

    .tab.active .count {
      background: #e3f0fc;
      color: #4a90d9;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .card.hidden {
      display: none;
    }

    .card-preview {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      border-bottom: 1px solid #eee;
      padding: 1rem;
      overflow: hidden;
    }

    .card-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .card-preview.bg-preview {
      padding: 0;
    }

    .card-preview.bg-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-info {
      padding: 0.75rem;
    }

    .card-name {
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
      word-break: break-all;
      color: #333;
    }

    .card-desc {
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .tag {
      background: #f0f0f0;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      font-size: 0.65rem;
      color: #666;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-copy {
      flex: 1;
      padding: 0.4rem;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .btn-copy:hover {
      background: #4a90d9;
      border-color: #4a90d9;
      color: #fff;
    }

    .btn-copy.copied {
      background: #4caf50;
      border-color: #4caf50;
      color: #fff;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: #888;
      grid-column: 1 / -1;
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #333;
      color: #fff;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 0.9rem;
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <h1>Art Assets Gallery <span>(${totalCount}개)</span></h1>
      <div class="search-box">
        <input type="text" id="search" placeholder="태그 또는 설명으로 검색..." />
      </div>
    </div>
  </header>

  <nav class="tabs">
    <div class="tabs-inner">
      <button class="tab active" data-category="all">
        전체 <span class="count">${totalCount}</span>
      </button>
${categoryOrder.filter(cat => categoryMap[cat]).map(cat => `      <button class="tab" data-category="${cat}">
        ${getCategoryLabel(cat)} <span class="count">${categoryMap[cat].length}</span>
      </button>`).join('\n')}
    </div>
  </nav>

  <main class="container">
    <div class="grid" id="gallery">
${assets.assets.map(asset => generateCard(asset)).join('\n')}
      <div class="no-results" id="no-results" style="display: none;">
        검색 결과가 없습니다.
      </div>
    </div>
  </main>

  <div class="toast" id="toast">경로가 복사되었습니다</div>

  <script>
    // 탭 필터링
    const tabs = document.querySelectorAll('.tab');
    const cards = document.querySelectorAll('.card');
    const searchInput = document.getElementById('search');
    const noResults = document.getElementById('no-results');
    const toast = document.getElementById('toast');

    let currentCategory = 'all';
    let currentSearch = '';

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        filterCards();
      });
    });

    // 검색 필터링
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase();
      filterCards();
    });

    function filterCards() {
      let visibleCount = 0;

      cards.forEach(card => {
        const category = card.dataset.category;
        const tags = card.dataset.tags.toLowerCase();
        const desc = card.dataset.desc.toLowerCase();
        const name = card.dataset.name.toLowerCase();

        const categoryMatch = currentCategory === 'all' || category === currentCategory;
        const searchMatch = !currentSearch ||
          tags.includes(currentSearch) ||
          desc.includes(currentSearch) ||
          name.includes(currentSearch);

        if (categoryMatch && searchMatch) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // 경로 복사
    function copyPath(path, btn) {
      navigator.clipboard.writeText(path).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        showToast(path);
        setTimeout(() => {
          btn.textContent = 'Copy Path';
          btn.classList.remove('copied');
        }, 1500);
      });
    }

    function showToast(path) {
      toast.textContent = path + ' 복사됨';
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }
  </script>
</body>
</html>`;
}

function getCategoryLabel(category) {
  const labels = {
    icons: 'Icons',
    illustrations: 'Illustrations',
    diagrams: 'Diagrams',
    backgrounds: 'Backgrounds',
    photos: 'Photos',
    '3d': '3D Models'
  };
  return labels[category] || category;
}

function generateCard(asset) {
  const isBackground = asset.category === 'backgrounds';
  const previewClass = isBackground ? 'card-preview bg-preview' : 'card-preview';
  const tags = asset.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');

  return `      <div class="card" data-category="${asset.category}" data-tags="${asset.tags.join(' ')}" data-desc="${asset.description}" data-name="${asset.id}">
        <div class="${previewClass}">
          <img src="${asset.path}" alt="${asset.description}" loading="lazy" />
        </div>
        <div class="card-info">
          <div class="card-name">${asset.id}</div>
          <div class="card-desc">${asset.description}</div>
          <div class="card-tags">${tags}</div>
          <div class="card-actions">
            <button class="btn-copy" onclick="copyPath('${asset.path}', this)">Copy Path</button>
          </div>
        </div>
      </div>`;
}

// HTML 파일 생성
const htmlContent = generateHTML();
const outputPath = path.join(__dirname, 'gallery.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');

console.log('gallery.html 생성 완료!');
console.log(`총 ${assets.assets.length}개 에셋`);
console.log('카테고리별:');
categoryOrder.forEach(cat => {
  if (categoryMap[cat]) {
    console.log(`  - ${cat}: ${categoryMap[cat].length}개`);
  }
});
