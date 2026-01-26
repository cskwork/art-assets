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

// assets-source.json 로드 (아카이브 데이터용)
const sourcePath = path.join(__dirname, 'assets-source.json');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// 카테고리별 기본 포맷
const defaultFormats = {
  icons: 'svg',
  illustrations: 'svg',
  diagrams: 'svg',
  backgrounds: 'png',
  photos: 'jpg',
  '3d': 'glb'
};

// 아카이브 에셋을 full 형식으로 변환
function expandArchivedAsset(compact) {
  const [id, category, tags, description, format, dimensions, archivedDate] = compact;
  const assetFormat = format || defaultFormats[category] || 'svg';
  const assetPath = `archive/${category}/${id}.${assetFormat}`;

  const asset = {
    id,
    path: assetPath,
    category,
    tags,
    description,
    format: assetFormat,
    archivedDate: archivedDate || 'N/A',
    isArchived: true
  };

  if (dimensions && Array.isArray(dimensions)) {
    if (dimensions.length === 2) {
      asset.dimensions = { width: dimensions[0], height: dimensions[1] };
    } else if (dimensions.length === 3) {
      asset.dimensions = { width: dimensions[0], height: dimensions[1], depth: dimensions[2] };
    }
  }

  return asset;
}

// 아카이브된 에셋
const archivedAssets = (source.archived || []).map(expandArchivedAsset);

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
  const archivedCount = archivedAssets.length;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Art Assets Gallery</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
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

    .card-preview model-viewer {
      width: 100%;
      height: 100%;
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

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;
    }

    .modal-overlay.show {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      transform: scale(0.9);
      transition: transform 0.2s;
    }

    .modal-overlay.show .modal {
      transform: scale(1);
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #333;
    }

    .modal-desc {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .modal-asset-info {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 0.85rem;
      word-break: break-all;
      margin-bottom: 1rem;
    }

    .modal-result {
      margin-bottom: 1rem;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      display: none;
    }

    .modal-result.success {
      display: block;
      background: #e8f5e9;
      border: 1px solid #4caf50;
      color: #2e7d32;
    }

    .modal-result.error {
      display: block;
      background: #ffebee;
      border: 1px solid #f44336;
      color: #c62828;
    }

    .modal-result.loading {
      display: block;
      background: #e3f2fd;
      border: 1px solid #2196f3;
      color: #1565c0;
    }

    .modal-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .modal-btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid #ddd;
      background: #fff;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .modal-btn:hover {
      background: #f5f5f5;
    }

    .modal-btn.primary {
      background: #4a90d9;
      border-color: #4a90d9;
      color: #fff;
    }

    .modal-btn.primary:hover {
      background: #3a7bc8;
    }

    .modal-btn.primary.copied {
      background: #4caf50;
      border-color: #4caf50;
    }

    /* Archive button styles */
    .btn-archive {
      flex: 1;
      padding: 0.4rem;
      border: 1px solid #f0a000;
      background: #fff8e0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      color: #a07000;
      transition: all 0.2s;
    }

    .btn-archive:hover {
      background: #f0a000;
      color: #fff;
    }

    .btn-restore {
      flex: 1;
      padding: 0.4rem;
      border: 1px solid #4caf50;
      background: #e8f5e9;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      color: #2e7d32;
      transition: all 0.2s;
    }

    .btn-restore:hover {
      background: #4caf50;
      color: #fff;
    }

    /* Archived badge */
    .archived-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #f0a000;
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 500;
    }

    .card-preview {
      position: relative;
    }

    /* Archived tab style */
    .tab[data-category="archived"] .count {
      background: #fff8e0;
      color: #a07000;
    }

    .tab.active[data-category="archived"] .count {
      background: #f0a000;
      color: #fff;
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
      <button class="tab" data-category="archived">
        Archived <span class="count">${archivedCount}</span>
      </button>
    </div>
  </nav>

  <main class="container">
    <div class="grid" id="gallery">
${assets.assets.map(asset => generateCard(asset, false)).join('\n')}
${archivedAssets.map(asset => generateCard(asset, true)).join('\n')}
      <div class="no-results" id="no-results" style="display: none;">
        검색 결과가 없습니다.
      </div>
    </div>
  </main>

  <div class="toast" id="toast">경로가 복사되었습니다</div>

  <!-- Archive/Restore Modal -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal">
      <div class="modal-title" id="modal-title">에셋 아카이브</div>
      <div class="modal-desc" id="modal-desc">이 에셋을 아카이브하시겠습니까?</div>
      <div class="modal-asset-info" id="modal-asset-info"></div>
      <div class="modal-result" id="modal-result"></div>
      <div class="modal-actions" id="modal-actions">
        <button class="modal-btn" onclick="closeModal()">취소</button>
        <button class="modal-btn primary" id="modal-execute-btn" onclick="executeAction()">실행</button>
      </div>
    </div>
  </div>

  <script>
    // 탭 필터링
    const tabs = document.querySelectorAll('.tab');
    const cards = document.querySelectorAll('.card');
    const searchInput = document.getElementById('search');
    const noResults = document.getElementById('no-results');
    const toast = document.getElementById('toast');

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalAssetInfo = document.getElementById('modal-asset-info');
    const modalResult = document.getElementById('modal-result');
    const modalActions = document.getElementById('modal-actions');
    const modalExecuteBtn = document.getElementById('modal-execute-btn');

    let currentCategory = 'all';
    let currentSearch = '';
    let currentAction = null; // { type: 'archive' | 'restore', assetId: string }

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
        const isArchived = card.dataset.archived === 'true';
        const tags = card.dataset.tags.toLowerCase();
        const desc = card.dataset.desc.toLowerCase();
        const name = card.dataset.name.toLowerCase();

        let categoryMatch = false;
        if (currentCategory === 'all') {
          categoryMatch = !isArchived;
        } else if (currentCategory === 'archived') {
          categoryMatch = isArchived;
        } else {
          categoryMatch = category === currentCategory && !isArchived;
        }

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

    function showToast(msg) {
      toast.textContent = msg + ' 복사됨';
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }

    // Archive/Restore Modal
    function showArchiveModal(assetId) {
      currentAction = { type: 'archive', assetId };
      modalTitle.textContent = '에셋 아카이브';
      modalDesc.textContent = '이 에셋을 아카이브하시겠습니까?';
      modalAssetInfo.textContent = assetId;
      resetModalState();
      modalOverlay.classList.add('show');
    }

    function showRestoreModal(assetId) {
      currentAction = { type: 'restore', assetId };
      modalTitle.textContent = '에셋 복원';
      modalDesc.textContent = '이 에셋을 복원하시겠습니까?';
      modalAssetInfo.textContent = assetId;
      resetModalState();
      modalOverlay.classList.add('show');
    }

    function resetModalState() {
      modalResult.className = 'modal-result';
      modalResult.textContent = '';
      modalExecuteBtn.disabled = false;
      modalExecuteBtn.textContent = '실행';
      modalActions.style.display = 'flex';
    }

    function showResult(type, message) {
      modalResult.className = 'modal-result ' + type;
      modalResult.textContent = message;
    }

    async function executeAction() {
      if (!currentAction) return;

      const { type, assetId } = currentAction;
      const apiUrl = '/api/' + type + '/' + encodeURIComponent(assetId);

      // 로딩 상태
      modalExecuteBtn.disabled = true;
      modalExecuteBtn.textContent = '처리 중...';
      showResult('loading', '요청을 처리하는 중입니다...');

      try {
        const response = await fetch(apiUrl, { method: 'POST' });
        const data = await response.json();

        if (data.success) {
          showResult('success', data.message + (data.warning ? ' (' + data.warning + ')' : ''));
          modalActions.style.display = 'none';
          // 2초 후 페이지 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showResult('error', '오류: ' + data.error);
          modalExecuteBtn.disabled = false;
          modalExecuteBtn.textContent = '다시 시도';
        }
      } catch (error) {
        showResult('error', '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
        modalExecuteBtn.disabled = false;
        modalExecuteBtn.textContent = '다시 시도';
      }
    }

    function closeModal() {
      modalOverlay.classList.remove('show');
      currentAction = null;
    }

    // Close modal when clicking overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
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

function generateCard(asset, isArchived = false) {
  const isBackground = asset.category === 'backgrounds';
  const is3D = asset.category === '3d';
  const previewClass = isBackground ? 'card-preview bg-preview' : 'card-preview';
  const tags = asset.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');

  let previewContent;
  if (is3D) {
    previewContent = `<model-viewer src="${asset.path}" alt="${asset.description}" auto-rotate camera-controls></model-viewer>`;
  } else {
    previewContent = `<img src="${asset.path}" alt="${asset.description}" loading="lazy" />`;
  }

  // Archived badge
  const archivedBadge = isArchived ? `<span class="archived-badge">Archived</span>` : '';

  // Action buttons
  let actionButtons;
  if (isArchived) {
    actionButtons = `
            <button class="btn-copy" onclick="copyPath('${asset.path}', this)">Copy Path</button>
            <button class="btn-restore" onclick="showRestoreModal('${asset.id}')">Restore</button>`;
  } else {
    actionButtons = `
            <button class="btn-copy" onclick="copyPath('${asset.path}', this)">Copy Path</button>
            <button class="btn-archive" onclick="showArchiveModal('${asset.id}')">Archive</button>`;
  }

  return `      <div class="card" data-category="${asset.category}" data-tags="${asset.tags.join(' ')}" data-desc="${asset.description}" data-name="${asset.id}" data-archived="${isArchived}">
        <div class="${previewClass}">
          ${archivedBadge}
          ${previewContent}
        </div>
        <div class="card-info">
          <div class="card-name">${asset.id}</div>
          <div class="card-desc">${asset.description}</div>
          <div class="card-tags">${tags}</div>
          <div class="card-actions">${actionButtons}
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
