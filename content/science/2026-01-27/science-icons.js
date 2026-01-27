(function initScienceIcons() {
  const basePath = '../../../../icons';

  const iconMap = {
    celebration: { file: 'icon-celebration-confetti-20260127.svg', alt: '축하 아이콘' },
    thinking: { file: 'icon-thinking-face.svg', alt: '생각 아이콘' },
    target: { file: 'icon-target-goal-bullseye-20260124.svg', alt: '목표 아이콘' },
    car: { file: 'icon-car-side-20260127.svg', alt: '자동차 아이콘' },
    rocket: { file: 'icon-rocket-launch-20260127.svg', alt: '로켓 아이콘' },
    sun: { file: 'icon-sun-bright-20260127.svg', alt: '태양 아이콘' },
    sprout: { file: 'icon-sprout-leaf-20260127.svg', alt: '새싹 아이콘' },
    water: { file: 'icon-water-drop-20260127.svg', alt: '물방울 아이콘' },
    co2: { file: 'icon-cloud-co2-20260127.svg', alt: '이산화탄소 아이콘' },
    glucose: { file: 'icon-candy-glucose-20260127.svg', alt: '포도당 아이콘' },
    oxygen: { file: 'icon-wind-oxygen-20260127.svg', alt: '산소 아이콘' },
    tree: { file: 'icon-tree-forest-20260127.svg', alt: '나무 아이콘' },
    globe: { file: 'icon-globe-earth-20260127.svg', alt: '지구 아이콘' },
    mountain: { file: 'icon-mountain-peak-20260127.svg', alt: '산맥 아이콘' },
    volcano: { file: 'icon-volcano-eruption-20260127.svg', alt: '화산 아이콘' },
    lightning: { file: 'icon-lightning.svg', alt: '번개 아이콘' },
    puzzle: { file: 'icon-puzzle-piece-fit-20260124.svg', alt: '퍼즐 아이콘' },
    cycle: { file: 'icon-refresh-cycle-spin-20260124.svg', alt: '순환 아이콘' },
    explosion: { file: 'icon-explosion-impact-20260127.svg', alt: '충돌 아이콘' },
    alert: { file: 'icon-alert-warning-20260127.svg', alt: '경고 아이콘' },
    moonCrescent: { file: 'icon-moon-crescent-20260127.svg', alt: '초승달 아이콘' },
    moonFull: { file: 'icon-moon-full-20260127.svg', alt: '보름달 아이콘' },
    hint: { file: 'icon-lightbulb-idea-bright-20260124.svg', alt: '힌트 아이콘' },
    ramen: { file: 'icon-ramen-bowl-20260127.svg', alt: '라면 아이콘' }
  };

  function getIconConfig(key) {
    return iconMap[key] || null;
  }

  function buildIconHtml(key, className) {
    const iconConfig = getIconConfig(key);
    if (!iconConfig) {
      return '';
    }

    const resolvedClass = className && className.length > 0 ? className : 'science-icon';
    const src = `${basePath}/${iconConfig.file}`;
    return `<img src="${src}" alt="${iconConfig.alt}" class="${resolvedClass}">`;
  }

  function setIcon(element, key, className) {
    if (!element) {
      return;
    }
    element.innerHTML = buildIconHtml(key, className);
  }

  function setInlineIcon(container, key, text, options) {
    if (!container) {
      return;
    }

    const resolvedOptions = options || {};
    const wrapperClass = resolvedOptions.wrapperClass || 'science-inline-icon';
    const iconClass = resolvedOptions.iconClass || 'science-icon science-icon--inline';
    const labelClass = resolvedOptions.labelClass || 'science-inline-label';

    const iconHtml = buildIconHtml(key, iconClass);
    container.innerHTML = `<span class="${wrapperClass}">${iconHtml}<span class="${labelClass}">${text}</span></span>`;
  }

  function hydrateIcons(root) {
    if (typeof document === 'undefined') {
      return;
    }

    const scope = root || document;
    const iconElements = scope.querySelectorAll('[data-icon]');

    iconElements.forEach((element) => {
      const key = element.dataset.icon;
      const inlineText = element.dataset.inlineText;
      const iconClass = element.dataset.iconClass;

      if (inlineText && inlineText.length > 0) {
        setInlineIcon(element, key, inlineText, { iconClass });
        return;
      }

      setIcon(element, key, iconClass);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => hydrateIcons(document));
    } else {
      hydrateIcons(document);
    }
  }

  window.ScienceIcons = {
    basePath,
    iconMap,
    buildIconHtml,
    setIcon,
    setInlineIcon,
    hydrateIcons
  };
})();
