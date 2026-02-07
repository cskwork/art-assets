/* AI 교육 콘텐츠 생성기 - Admin Dashboard App */
(function () {
  'use strict';

  // --- DOM 요소 ---
  const $subjectSelect = document.getElementById('subjectSelect');
  const $contentTypeSelect = document.getElementById('contentTypeSelect');
  const $gradeLevelSelect = document.getElementById('gradeLevelSelect');
  const $countSlider = document.getElementById('countSlider');
  const $countDisplay = document.getElementById('countDisplay');
  const $useArtAssets = document.getElementById('useArtAssets');
  const $btnGenerate = document.getElementById('btnGenerate');
  const $jobGrid = document.getElementById('jobGrid');
  const $emptyState = document.getElementById('emptyState');
  const $logContent = document.getElementById('logContent');
  const $btnClearLog = document.getElementById('btnClearLog');
  const $wsIndicator = document.getElementById('wsIndicator');
  const $wsStatusText = document.getElementById('wsStatusText');
  const $previewModal = document.getElementById('previewModal');
  const $previewTitle = document.getElementById('previewTitle');
  const $previewIframe = document.getElementById('previewIframe');
  const $btnCloseModal = document.getElementById('btnCloseModal');
  const $statPending = document.getElementById('statPending');
  const $statProcessing = document.getElementById('statProcessing');
  const $statCompleted = document.getElementById('statCompleted');
  const $statFailed = document.getElementById('statFailed');
  const $themeToggle = document.getElementById('themeToggle');
  const $opsClock = document.getElementById('opsClock');
  const $opsDate = document.getElementById('opsDate');
  const $kpiPending = document.getElementById('kpiPending');
  const $kpiProcessing = document.getElementById('kpiProcessing');
  const $kpiCompleted = document.getElementById('kpiCompleted');
  const $kpiFailed = document.getElementById('kpiFailed');

  const THEME_STORAGE_KEY = 'ADMIN_UI_THEME';

  // --- 상태 ---
  let config = null;
  let jobs = [];
  let ws = null;
  let wsReconnectTimer = null;
  let jobPollTimer = null;
  let clockTimer = null;

  // --- 테마 ---
  function applyTheme(theme) {
    var nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);

    if ($themeToggle) {
      $themeToggle.textContent = nextTheme === 'dark' ? '라이트 모드' : '다크 모드';
      $themeToggle.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
    }
  }

  function initTheme() {
    var savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    } catch (_err) {}
    applyTheme(savedTheme);
  }

  // --- 유틸 ---
  function formatTime(ts) {
    var d = new Date(ts);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function relativeTime(ts) {
    var diff = Date.now() - ts;
    if (diff < 60000) return Math.floor(diff / 1000) + '초 전';
    if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
    return Math.floor(diff / 3600000) + '시간 전';
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    var weekday = weekdays[d.getDay()];
    return year + '년 ' + month + '월 ' + day + '일 (' + weekday + ')';
  }

  function statusLabel(status) {
    var map = { pending: '대기', processing: '진행 중', completed: '완료', failed: '실패' };
    return map[status] || status;
  }

  // 상단 메타 시계 갱신
  function updateMetaClock() {
    if (!$opsClock || !$opsDate) return;
    var now = Date.now();
    $opsClock.textContent = formatTime(now);
    $opsDate.textContent = formatDate(now);
  }

  // --- 로그 ---
  function addLog(msg, level) {
    var entry = document.createElement('div');
    entry.className = 'log-entry';

    var time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = '[' + formatTime(Date.now()) + ']';

    var text = document.createElement('span');
    text.className = 'log-msg ' + (level || '');
    text.textContent = msg;

    entry.appendChild(time);
    entry.appendChild(text);
    $logContent.appendChild(entry);
    $logContent.scrollTop = $logContent.scrollHeight;
  }

  // --- 설정 로드 ---
  function loadConfig() {
    fetch('/api/admin/config')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        config = data;
        populateSelect($subjectSelect, data.subjects);
        populateSelect($contentTypeSelect, data.contentTypes);
        populateSelect($gradeLevelSelect, data.gradeLevels);
        $btnGenerate.disabled = false;
        addLog('설정 로드 완료', 'success');
      })
      .catch(function (err) {
        addLog('설정 로드 실패: ' + err.message, 'error');
      });
  }

  function populateSelect(el, items) {
    el.innerHTML = '';
    items.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.label;
      el.appendChild(opt);
    });
  }

  // --- 슬라이더 ---
  $countSlider.addEventListener('input', function () {
    $countDisplay.textContent = this.value;
  });

  if ($themeToggle) {
    $themeToggle.addEventListener('click', function () {
      var currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (_err) {}
      addLog('테마 변경: ' + (nextTheme === 'dark' ? '다크' : '라이트'), 'info');
    });
  }

  // --- 생성 요청 ---
  $btnGenerate.addEventListener('click', function () {
    if (!config) return;

    var subject = $subjectSelect.value;
    var contentType = $contentTypeSelect.value;
    var gradeLevel = $gradeLevelSelect.value;
    var count = parseInt($countSlider.value, 10);
    var useArtAssets = $useArtAssets.checked;

    if (!subject || !contentType || !gradeLevel) {
      addLog('모든 필드를 선택하세요.', 'warn');
      return;
    }

    $btnGenerate.disabled = true;
    $btnGenerate.textContent = '생성 중...';
    addLog(subject + ' / ' + contentType + ' / ' + gradeLevel + ' x' + count + ' 생성 요청', 'info');

    fetch('/api/admin/batch-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject, contentType: contentType, gradeLevel: gradeLevel, count: count, useArtAssets: useArtAssets })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.batchId) {
          addLog('배치 생성 완료: ' + data.batchId + ' (' + data.jobs.length + '개 Job)', 'success');
          data.jobs.forEach(function (j) {
            if (j.status === 'created') {
              addLog('  Job ' + j.jobId.slice(0, 8) + '... -> ' + j.topic, 'info');
            } else {
              addLog('  Job 생성 실패: ' + j.topic, 'error');
            }
          });
          fetchJobs();
        } else {
          addLog('배치 생성 실패: ' + (data.error || '알 수 없는 오류'), 'error');
        }
      })
      .catch(function (err) {
        addLog('배치 생성 요청 실패: ' + err.message, 'error');
      })
      .finally(function () {
        $btnGenerate.disabled = false;
        $btnGenerate.textContent = '교육 콘텐츠 생성 시작';
      });
  });

  // --- Job 목록 ---
  function fetchJobs() {
    fetch('/api/admin/jobs')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        jobs = (data.jobs || []).sort(function (a, b) { return b.createdAt - a.createdAt; });
        renderJobs();
        updateStats();
      })
      .catch(function (err) {
        addLog('Job 목록 로드 실패: ' + err.message, 'error');
      });
  }

  function renderJobs() {
    if (jobs.length === 0) {
      $emptyState.style.display = 'flex';
      $jobGrid.style.display = 'none';
      return;
    }

    $emptyState.style.display = 'none';
    $jobGrid.style.display = 'grid';
    $jobGrid.innerHTML = '';

    jobs.forEach(function (job) {
      var card = document.createElement('div');
      card.className = 'job-card status-' + job.status;
      card.dataset.jobId = job.jobId;

      var isCompleted = job.status === 'completed';
      var shortId = job.jobId.slice(0, 8);

      // 카드 내용 조립
      var html = '';
      html += '<div class="job-card-header">';
      html += '  <span class="job-id">' + shortId + '</span>';
      html += '  <span class="status-badge ' + job.status + '">' + statusLabel(job.status) + '</span>';
      html += '</div>';
      html += '<div class="job-card-body">';
      html += '  <h3>' + (job.moduleId || shortId) + '</h3>';
      html += '  <div class="job-tags">';
      html += '    <span class="tag">' + (job.jobType === 'generate' ? '생성' : '리뷰') + '</span>';
      if (job.moduleId) {
        html += '    <span class="tag">' + job.moduleId + '</span>';
      }
      html += '  </div>';
      if (job.error) {
        html += '  <div class="job-error">' + escapeHtml(job.error) + '</div>';
      }
      html += '</div>';
      html += '<div class="job-card-footer">';
      html += '  <span class="job-time">' + relativeTime(job.createdAt) + '</span>';
      html += '  <button class="btn-preview" ' + (isCompleted && job.modulePath ? '' : 'disabled') + ' data-path="' + (job.modulePath || '') + '">미리보기</button>';
      html += '</div>';

      card.innerHTML = html;

      // 미리보기 버튼 이벤트
      var previewBtn = card.querySelector('.btn-preview');
      if (previewBtn && !previewBtn.disabled) {
        previewBtn.addEventListener('click', function () {
          openPreview(job.modulePath, job.moduleId);
        });
      }

      $jobGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function updateStats() {
    var counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
    jobs.forEach(function (j) {
      if (counts[j.status] !== undefined) counts[j.status]++;
    });
    $statPending.textContent = counts.pending;
    $statProcessing.textContent = counts.processing;
    $statCompleted.textContent = counts.completed;
    $statFailed.textContent = counts.failed;

    if ($kpiPending) $kpiPending.textContent = counts.pending;
    if ($kpiProcessing) $kpiProcessing.textContent = counts.processing;
    if ($kpiCompleted) $kpiCompleted.textContent = counts.completed;
    if ($kpiFailed) $kpiFailed.textContent = counts.failed;
  }

  // --- Job 상태 업데이트 (단일) ---
  function updateJobInList(jobId, updates) {
    var found = false;
    jobs.forEach(function (j, i) {
      if (j.jobId === jobId) {
        jobs[i] = Object.assign({}, j, updates);
        found = true;
      }
    });
    if (!found) {
      // 새 Job인 경우 전체 목록 재조회
      fetchJobs();
      return;
    }
    renderJobs();
    updateStats();
  }

  // --- 미리보기 모달 ---
  function openPreview(modulePath, moduleId) {
    if (!modulePath) return;
    $previewTitle.textContent = (moduleId || '콘텐츠') + ' 미리보기';
    $previewIframe.src = '/' + modulePath + '/index.html';
    $previewModal.classList.add('active');
    addLog('미리보기: ' + modulePath, 'info');
  }

  function closePreview() {
    $previewModal.classList.remove('active');
    $previewIframe.src = 'about:blank';
  }

  $btnCloseModal.addEventListener('click', closePreview);
  $previewModal.addEventListener('click', function (e) {
    if (e.target === $previewModal) closePreview();
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
  });

  // --- WebSocket ---
  function connectWebSocket() {
    var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsUrl = protocol + '//' + location.host + '/ws';

    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      addLog('WebSocket 연결 실패: ' + err.message, 'error');
      scheduleReconnect();
      return;
    }

    ws.onopen = function () {
      $wsIndicator.classList.add('connected');
      $wsStatusText.textContent = '실시간 연결';
      addLog('WebSocket 연결됨', 'success');
      if (wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
      }
    };

    ws.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);
        handleWsMessage(data);
      } catch (err) {
        addLog('WebSocket 메시지 파싱 실패', 'warn');
      }
    };

    ws.onclose = function () {
      $wsIndicator.classList.remove('connected');
      $wsStatusText.textContent = '연결 끊김';
      addLog('WebSocket 연결 끊김', 'warn');
      scheduleReconnect();
    };

    ws.onerror = function () {
      $wsIndicator.classList.remove('connected');
      $wsStatusText.textContent = '연결 오류';
    };
  }

  function scheduleReconnect() {
    if (wsReconnectTimer) return;
    wsReconnectTimer = setTimeout(function () {
      wsReconnectTimer = null;
      addLog('WebSocket 재연결 시도...', 'info');
      connectWebSocket();
    }, 5000);
  }

  function handleWsMessage(data) {
    if (data.type === 'job_created') {
      addLog('Job 생성: ' + (data.topic || data.jobId), 'info');
      fetchJobs();
    } else if (data.type === 'job_status_changed') {
      addLog('Job ' + (data.jobId || '').slice(0, 8) + ' -> ' + statusLabel(data.status), data.status === 'completed' ? 'success' : data.status === 'failed' ? 'error' : 'info');
      updateJobInList(data.jobId, {
        status: data.status,
        moduleId: data.moduleId || undefined,
        error: data.error || undefined
      });
    }
  }

  // --- Job 폴링 (5초) ---
  function startJobPolling() {
    jobPollTimer = setInterval(fetchJobs, 5000);
  }

  // --- 로그 지우기 ---
  $btnClearLog.addEventListener('click', function () {
    $logContent.innerHTML = '';
  });

  // --- 초기화 ---
  function init() {
    initTheme();
    updateMetaClock();
    clockTimer = setInterval(updateMetaClock, 1000);
    addLog('Admin 대시보드 초기화', 'info');
    loadConfig();
    fetchJobs();
    connectWebSocket();
    startJobPolling();
  }

  init();
})();
