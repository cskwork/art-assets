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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --surface-0: #fafbfc;
      --surface-1: #ffffff;
      --surface-2: #f3f4f6;
      --surface-3: #e5e7eb;
      --border: #e2e5ea;
      --border-light: #f0f1f3;
      --text-primary: #1a1d23;
      --text-secondary: #5a6070;
      --text-muted: #9ca3af;
      --accent: #3b82f6;
      --accent-light: #eff6ff;
      --accent-hover: #2563eb;
      --success: #10b981;
      --success-light: #ecfdf5;
      --warning: #f59e0b;
      --warning-light: #fffbeb;
      --danger: #ef4444;
      --danger-light: #fef2f2;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.04), 0 10px 20px rgba(0,0,0,0.06);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.08);
      --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--surface-0);
      color: var(--text-primary);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* === Header === */
    .header {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
      background: rgba(255,255,255,0.92);
    }

    .header-content {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      height: 64px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .header .badge {
      background: var(--accent-light);
      color: var(--accent);
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .search-box {
      position: relative;
    }

    .search-box svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-box input {
      padding: 0.55rem 1rem 0.55rem 2.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-family: inherit;
      width: 280px;
      background: var(--surface-2);
      color: var(--text-primary);
      transition: border-color var(--transition), background var(--transition), box-shadow var(--transition);
    }

    .search-box input::placeholder {
      color: var(--text-muted);
    }

    .search-box input:focus {
      outline: none;
      border-color: var(--accent);
      background: var(--surface-1);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    /* === Tabs === */
    .tabs {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
    }

    .tabs-inner {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .tabs-inner::-webkit-scrollbar { display: none; }

    .tab {
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
      font-weight: 500;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      transition: color var(--transition), border-color var(--transition);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .tab .count {
      background: var(--surface-2);
      padding: 0.1rem 0.45rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all var(--transition);
    }

    .tab.active .count {
      background: var(--accent-light);
      color: var(--accent);
    }

    /* === Container & Grid === */
    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 1.5rem 2rem 3rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    /* === Cards === */
    .card {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
    }

    .card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-3px);
      border-color: var(--border);
    }

    .card.hidden {
      display: none;
    }

    .card-preview {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-2);
      padding: 1.25rem;
      overflow: hidden;
      position: relative;
    }

    .card-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    }

    .card:hover .card-preview img {
      transform: scale(1.05);
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
      padding: 1rem;
    }

    .card-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      margin-bottom: 0.35rem;
      word-break: break-all;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .card-desc {
      font-size: 0.82rem;
      color: var(--text-primary);
      font-weight: 500;
      margin-bottom: 0.6rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.5;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-bottom: 0.75rem;
    }

    .tag {
      background: var(--surface-2);
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      font-size: 0.68rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: background var(--transition), color var(--transition);
    }

    .card:hover .tag {
      background: var(--accent-light);
      color: var(--accent);
    }

    .card-actions {
      display: flex;
      gap: 0.4rem;
    }

    .btn-copy, .btn-archive, .btn-restore {
      flex: 1;
      padding: 0.45rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.75rem;
      font-family: inherit;
      font-weight: 500;
      transition: all var(--transition);
    }

    .btn-copy {
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
    }

    .btn-copy:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .btn-copy.copied {
      background: var(--success);
      border-color: var(--success);
      color: #fff;
    }

    .btn-archive {
      border: 1px solid #fbbf24;
      background: var(--warning-light);
      color: #92400e;
    }

    .btn-archive:hover {
      background: #fbbf24;
      border-color: #f59e0b;
      color: #fff;
    }

    .btn-restore {
      border: 1px solid var(--success);
      background: var(--success-light);
      color: #065f46;
    }

    .btn-restore:hover {
      background: var(--success);
      border-color: var(--success);
      color: #fff;
    }

    /* === No Results === */
    .no-results {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
      grid-column: 1 / -1;
      font-size: 0.9rem;
    }

    /* === Toast === */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--text-primary);
      color: #fff;
      padding: 0.7rem 1.25rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 500;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      box-shadow: var(--shadow-lg);
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* === Modal === */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s ease;
    }

    .modal-overlay.show {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      max-width: 480px;
      width: 92%;
      box-shadow: var(--shadow-lg);
      transform: scale(0.95) translateY(10px);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-overlay.show .modal {
      transform: scale(1) translateY(0);
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .modal-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .modal-asset-info {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      word-break: break-all;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    .modal-result {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      display: none;
      font-weight: 500;
    }

    .modal-result.success {
      display: block;
      background: var(--success-light);
      border: 1px solid #6ee7b7;
      color: #065f46;
    }

    .modal-result.error {
      display: block;
      background: var(--danger-light);
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    .modal-result.loading {
      display: block;
      background: var(--accent-light);
      border: 1px solid #93c5fd;
      color: #1e40af;
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .modal-btn {
      padding: 0.55rem 1.25rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-1);
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
      font-weight: 500;
      transition: all var(--transition);
      color: var(--text-secondary);
    }

    .modal-btn:hover {
      background: var(--surface-2);
      color: var(--text-primary);
    }

    .modal-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal-btn.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .modal-btn.primary:hover {
      background: var(--accent-hover);
    }

    .modal-btn.primary.copied {
      background: var(--success);
      border-color: var(--success);
    }

    /* === Archived === */
    .archived-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--warning);
      color: #fff;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .tab[data-category="archived"] .count {
      background: var(--warning-light);
      color: #92400e;
    }

    .tab.active[data-category="archived"] .count {
      background: var(--warning);
      color: #fff;
    }

    /* === Design Refresh === */
    :root {
      --surface-0: #eef3e7;
      --surface-1: rgba(255, 255, 255, 0.88);
      --surface-2: #e1e8d8;
      --surface-3: #d4ddca;
      --border: rgba(23, 33, 52, 0.18);
      --border-light: rgba(23, 33, 52, 0.1);
      --text-primary: #172134;
      --text-secondary: #33415b;
      --text-muted: #64708b;
      --accent: #0666d1;
      --accent-light: #d7e8ff;
      --accent-hover: #074fa0;
      --success: #0d7a4f;
      --success-light: #dbfaec;
      --warning: #b76e1f;
      --warning-light: #fff4e3;
      --danger: #b42330;
      --danger-light: #fde7ea;
      --radius-sm: 10px;
      --radius-md: 16px;
      --radius-lg: 22px;
      --shadow-sm: 0 10px 24px rgba(27, 42, 79, 0.08);
      --shadow-md: 0 22px 36px rgba(27, 42, 79, 0.14);
      --shadow-lg: 0 32px 66px rgba(27, 42, 79, 0.2);
    }

    body {
      font-family: 'IBM Plex Sans KR', sans-serif;
      background:
        radial-gradient(circle at 10% 8%, rgba(74, 170, 255, 0.28), transparent 30%),
        radial-gradient(circle at 88% 14%, rgba(255, 186, 86, 0.34), transparent 34%),
        linear-gradient(160deg, #eef3e7 0%, #dde6d2 48%, #d6e2cf 100%);
      min-height: 100vh;
      color: var(--text-primary);
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: -1;
      opacity: 0.35;
      background:
        linear-gradient(90deg, rgba(23, 33, 52, 0.07) 1px, transparent 1px) 0 0 / 22px 22px,
        linear-gradient(0deg, rgba(23, 33, 52, 0.05) 1px, transparent 1px) 0 0 / 22px 22px;
      pointer-events: none;
    }

    .header {
      margin: 1rem 1.4rem 0;
      border: 1px solid var(--border);
      border-bottom: none;
      border-radius: 26px 26px 0 0;
      background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.76));
      box-shadow: 0 16px 28px rgba(23, 33, 52, 0.12);
      padding: 0 1.4rem;
    }

    .header-content {
      max-width: 1460px;
      height: 74px;
      padding: 0;
    }

    .title-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.08rem;
    }

    .header h1 {
      font-family: 'Black Han Sans', sans-serif;
      font-size: 1.45rem;
      letter-spacing: 0.01em;
      line-height: 1;
    }

    .header-note {
      font-size: 0.76rem;
      color: var(--text-secondary);
      opacity: 0.92;
      letter-spacing: 0.03em;
    }

    .header .badge {
      font-family: 'IBM Plex Mono', monospace;
      border: 1px solid rgba(6, 102, 209, 0.28);
      padding: 0.25rem 0.72rem;
      background: rgba(240, 247, 255, 0.8);
    }

    .search-box input {
      width: 340px;
      border: 1px solid rgba(23, 33, 52, 0.18);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(8px);
    }

    .search-box input:focus {
      box-shadow:
        0 0 0 3px rgba(6, 102, 209, 0.15),
        0 10px 22px rgba(6, 102, 209, 0.12);
    }

    .tabs {
      margin: 0 1.4rem;
      border: 1px solid var(--border);
      border-top: none;
      border-bottom: none;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(245, 249, 240, 0.86));
      padding: 0 1.4rem;
    }

    .tabs-inner {
      gap: 0.42rem;
      padding: 0.7rem 0 0.8rem;
    }

    .tab {
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0.55rem 0.95rem;
      transition: all var(--transition);
    }

    .tab:hover {
      border-color: rgba(23, 33, 52, 0.16);
      background: rgba(255, 255, 255, 0.72);
      transform: translateY(-1px);
    }

    .tab.active {
      border-color: rgba(6, 102, 209, 0.44);
      background: linear-gradient(120deg, rgba(230, 243, 255, 0.95), rgba(217, 236, 255, 0.88));
      box-shadow: 0 8px 16px rgba(6, 102, 209, 0.12);
    }

    .container {
      max-width: 1460px;
      padding: 1.15rem 2.8rem 3.4rem;
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 26px 26px;
      margin: 0 1.4rem 2rem;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(242, 247, 237, 0.78));
      box-shadow: 0 24px 48px rgba(23, 33, 52, 0.16);
    }

    .insight-bar {
      margin: 0 1.4rem;
      border: 1px solid var(--border);
      border-top: none;
      background: linear-gradient(120deg, rgba(23, 33, 52, 0.92), rgba(35, 70, 124, 0.9));
      padding: 0.8rem 1.4rem 0.9rem;
    }

    .insight-inner {
      max-width: 1460px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 0.9rem;
      flex-wrap: wrap;
    }

    .insight-chip {
      border: 1px solid rgba(208, 226, 252, 0.35);
      background: rgba(228, 240, 255, 0.09);
      border-radius: 999px;
      color: #ecf4ff;
      padding: 0.35rem 0.82rem;
      display: inline-flex;
      align-items: baseline;
      gap: 0.44rem;
    }

    .insight-chip strong {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.8rem;
    }

    .insight-label {
      font-size: 0.72rem;
      opacity: 0.86;
      letter-spacing: 0.02em;
    }

    .insight-link {
      margin-left: auto;
      text-decoration: none;
      color: #fef8ea;
      border: 1px solid rgba(255, 220, 124, 0.48);
      border-radius: 999px;
      padding: 0.42rem 0.95rem;
      background: linear-gradient(120deg, rgba(254, 178, 45, 0.4), rgba(255, 206, 96, 0.28));
      transition: transform var(--transition), box-shadow var(--transition);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .insight-link:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 18px rgba(255, 186, 45, 0.22);
    }

    .grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .card {
      border: 1px solid rgba(23, 33, 52, 0.12);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 252, 242, 0.92));
      box-shadow: 0 10px 22px rgba(23, 33, 52, 0.12);
      animation: card-enter 0.5s ease both;
    }

    .card:nth-child(3n) {
      animation-delay: 0.05s;
    }

    .card:nth-child(4n) {
      animation-delay: 0.09s;
    }

    .card-preview {
      background:
        radial-gradient(circle at 18% 22%, rgba(6, 102, 209, 0.14), transparent 50%),
        linear-gradient(160deg, #eff5ea 0%, #e3ebd9 100%);
    }

    .card-name {
      font-family: 'IBM Plex Mono', monospace;
      color: #3b4a65;
    }

    .tag {
      border: 1px solid rgba(23, 33, 52, 0.1);
      background: rgba(255, 255, 255, 0.74);
    }

    .btn-copy,
    .btn-archive,
    .btn-restore {
      border-radius: 999px;
      font-size: 0.73rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      padding: 0.46rem 0.54rem;
    }

    .btn-copy {
      border-color: rgba(23, 33, 52, 0.2);
      background: rgba(255, 255, 255, 0.88);
      color: #293347;
    }

    .btn-copy:hover {
      background: linear-gradient(120deg, #0666d1, #3d9cff);
      border-color: transparent;
      box-shadow: 0 10px 18px rgba(6, 102, 209, 0.22);
    }

    .archived-badge {
      font-family: 'IBM Plex Mono', monospace;
      background: linear-gradient(120deg, #b76e1f, #d39a4d);
      box-shadow: 0 8px 16px rgba(183, 110, 31, 0.26);
    }

    .toast {
      background: linear-gradient(120deg, #172134, #224a80);
      border: 1px solid rgba(213, 230, 255, 0.22);
    }

    @keyframes card-enter {
      from {
        transform: translateY(14px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* === Scrollbar === */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

    /* === Responsive === */
    @media (max-width: 768px) {
      .header { margin: 0.7rem 0.7rem 0; padding: 0 0.85rem; border-radius: 20px 20px 0 0; }
      .tabs { margin: 0 0.7rem; padding: 0 0.85rem; }
      .insight-bar { margin: 0 0.7rem; padding: 0.75rem 0.85rem 0.85rem; }
      .container { margin: 0 0.7rem 1.2rem; padding: 1rem; border-radius: 0 0 20px 20px; }
      .header-content { height: auto; min-height: 60px; padding: 0.55rem 0; }
      .search-box input { width: 220px; }
      .insight-link { margin-left: 0; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.75rem; }
      .card-preview { height: 120px; }
    }

    @media (max-width: 480px) {
      .header-content { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .header-left { width: 100%; justify-content: space-between; }
      .search-box { width: 100%; }
      .search-box input { width: 100%; }
      .insight-inner { align-items: stretch; }
      .insight-chip { width: 100%; justify-content: space-between; }
      .insight-link { width: 100%; text-align: center; }
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <div class="header-left">
        <div class="title-wrap">
          <h1>Art Assets Gallery</h1>
          <p class="header-note">수업 제작용 에셋 라이브러리</p>
        </div>
        <span class="badge">${totalCount}개</span>
      </div>
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="search" placeholder="태그, 설명, 파일명 검색" />
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
        아카이브 <span class="count">${archivedCount}</span>
      </button>
    </div>
  </nav>

  <section class="insight-bar">
    <div class="insight-inner">
      <div class="insight-chip">
        <span class="insight-label">현재 필터</span>
        <strong id="active-filter-label">전체</strong>
      </div>
      <div class="insight-chip">
        <span class="insight-label">노출 에셋</span>
        <strong><span id="visible-count">${totalCount}</span>개</strong>
      </div>
      <a class="insight-link" href="/3d/viewer.html">3D 뷰어 열기</a>
    </div>
  </section>

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
    const visibleCount = document.getElementById('visible-count');
    const activeFilterLabel = document.getElementById('active-filter-label');

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

    function updateInsights(count) {
      const activeTab = document.querySelector('.tab.active');
      const labelNode = activeTab ? activeTab.childNodes[0] : null;
      const labelText = labelNode ? labelNode.textContent.trim() : '전체';
      visibleCount.textContent = String(count);
      activeFilterLabel.textContent = currentSearch ? labelText + ' · 검색 적용' : labelText;
    }

    function filterCards() {
      let matchedCount = 0;

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
          matchedCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      noResults.style.display = matchedCount === 0 ? 'block' : 'none';
      noResults.textContent = currentSearch
        ? '검색 결과가 없습니다. 다른 태그나 키워드로 시도해보세요.'
        : '조건에 맞는 에셋이 없습니다.';
      updateInsights(matchedCount);
    }

    // 경로 복사
    function copyPath(path, btn) {
      navigator.clipboard.writeText(path).then(() => {
        btn.textContent = '복사 완료';
        btn.classList.add('copied');
        showToast(path);
        setTimeout(() => {
          btn.textContent = '경로 복사';
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

    updateInsights(${totalCount});
  </script>
</body>
</html>`;
}

function getCategoryLabel(category) {
  const labels = {
    icons: '아이콘',
    illustrations: '일러스트',
    diagrams: '다이어그램',
    backgrounds: '배경',
    photos: '사진',
    '3d': '3D 모델'
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
  const archivedBadge = isArchived ? `<span class="archived-badge">아카이브됨</span>` : '';

  // Action buttons
  let actionButtons;
  if (isArchived) {
    actionButtons = `
            <button class="btn-copy" onclick="copyPath('${asset.path}', this)">경로 복사</button>
            <button class="btn-restore" onclick="showRestoreModal('${asset.id}')">복원</button>`;
  } else {
    actionButtons = `
            <button class="btn-copy" onclick="copyPath('${asset.path}', this)">경로 복사</button>
            <button class="btn-archive" onclick="showArchiveModal('${asset.id}')">아카이브</button>`;
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
