/* ========== Scroll Animations (Intersection Observer) ========== */
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
})();

/* ========== Navbar Scroll Effect ========== */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  });
})();

/* ========== Tab Switching ========== */
(function () {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach((c) => {
        c.classList.remove('active');
        c.style.animation = 'none';
        c.querySelectorAll('video').forEach((v) => v.pause());
      });

      const activeTab = document.getElementById('tab-' + target);
      if (activeTab) {
        void activeTab.offsetHeight;
        activeTab.style.animation = '';
        activeTab.classList.add('active');
        activeTab.querySelectorAll('video').forEach((v) => {
          v.currentTime = 0;
          v.play().catch(() => {});
        });
      }
    });
  });
})();

/* ========== 3D Visualization Switcher ========== */
(function () {
  const vizBtns = document.querySelectorAll('.viz-btn');
  const iframe = document.getElementById('viz-iframe');
  if (!iframe) return;

  vizBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      vizBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (iframe.tagName === 'IFRAME') iframe.src = btn.dataset.viz;
    });
  });
})();

/* ========== Copy BibTeX ========== */
(function () {
  const copyBtn = document.getElementById('copy-bibtex');
  if (!copyBtn) return;
  const bibtex = document.querySelector('.bibtex-code code');

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(bibtex.textContent).then(() => {
      copyBtn.classList.add('copied');
      copyBtn.querySelector('span').textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.querySelector('span').textContent = 'Copy';
      }, 2000);
    });
  });
})();

/* ========== Synchronized Video Playback in Comparisons ========== */
(function () {
  document.querySelectorAll('.video-compare').forEach((block) => {
    const videos = block.querySelectorAll('video');
    if (videos.length < 2) return;

    function syncPlay() {
      const minTime = Math.min(...Array.from(videos).map((v) => v.currentTime));
      videos.forEach((v) => {
        if (Math.abs(v.currentTime - minTime) > 0.3) {
          v.currentTime = minTime;
        }
      });
    }

    videos.forEach((v) => {
      v.addEventListener('seeked', syncPlay);
      v.addEventListener('play', () => {
        videos.forEach((other) => {
          if (other !== v) other.play().catch(() => {});
        });
      });
    });
  });
})();

/* ========== Smooth nav link scrolling (fallback) ========== */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

/* ========== Gentle indoor camera preview ========== */
(function () {
  const viewer = document.getElementById('hero-model');
  if (!viewer) return;
  const [yaw, pitch, radius] = viewer.getAttribute('camera-orbit').split(/\s+/).map(parseFloat);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inspecting = false;
  let visible = false;
  let elapsed = 0;
  let previousTime;

  // Hand control to the visitor without resetting their chosen view.
  ['pointerdown', 'wheel', 'keydown'].forEach((type) => {
    viewer.addEventListener(type, () => { inspecting = true; }, { passive: true });
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(viewer);

  function animate(time) {
    const delta = previousTime === undefined ? 0 : Math.min(time - previousTime, 100);
    previousTime = time;
    if (viewer.loaded && visible && !document.hidden && !inspecting && !reducedMotion.matches) {
      elapsed += delta;
      const phase = elapsed / 24000 * Math.PI * 2;
      // A fixed distance and small oscillation keep the camera in the room.
      viewer.cameraOrbit = `${yaw + Math.sin(phase) * 6}deg ${pitch + Math.sin(phase) * 0.8}deg ${radius}m`;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();

/* ========== Interactive scene streaming comparison ========== */
(function () {
  const viewers = [...document.querySelectorAll('.scene-model')];
  const playButton = document.getElementById('scene-play');
  if (!viewers.length) return;
  let playing = true;
  let t = 0;
  const inspecting = new Set();
  // Synchronized rows share viewing direction, lens, orbit motion and input.
  // Per-model targets and base distances preserve each scene’s framing.
  const syncedViewers = new Set();
  const syncedRows = [...document.querySelectorAll('[data-sync-camera]')].map((row) => {
    const models = [...row.querySelectorAll('.scene-model')];
    const state = { yaw: 0, motion: 0, pitch: 0, radius: 0 };
    function applyCamera(source) {
      models.forEach((model) => {
        if (model === source) return;
        const yaw = Number(model.dataset.cameraYaw) + state.yaw + state.motion;
        model.cameraOrbit = `${yaw}deg ${Number(model.dataset.cameraPitch) + state.pitch}deg ${Number(model.dataset.cameraRadius) + state.radius}m`;
        if (source) model.jumpCameraToGoal();
      });
    }
    models.forEach((model) => {
      syncedViewers.add(model);
      model.addEventListener('camera-change', (event) => {
        if (event.detail.source !== 'user-interaction') return;
        const orbit = model.getCameraOrbit();
        state.yaw = orbit.theta * 180 / Math.PI - Number(model.dataset.cameraYaw) - state.motion;
        state.pitch = orbit.phi * 180 / Math.PI - Number(model.dataset.cameraPitch);
        state.radius = orbit.radius - Number(model.dataset.cameraRadius);
        applyCamera(model);
      });
    });
    return { models, state, applyCamera };
  });
  viewers.forEach((viewer) => {
    viewer.addEventListener('pointerenter', () => inspecting.add(viewer));
    viewer.addEventListener('pointerleave', () => inspecting.delete(viewer));
    viewer.addEventListener('focusin', () => inspecting.add(viewer));
    viewer.addEventListener('focusout', () => inspecting.delete(viewer));
  });
  if (playButton) playButton.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? 'Ⅱ Pause comparison' : '▶ Play comparison';
    playButton.setAttribute('aria-pressed', String(playing));
  });
  function animateIndoorCamera() {
    if (playing) {
      t += 0.012;
      const yaw = Math.sin(t) * 8;
      syncedRows.forEach(({ models, state, applyCamera }) => {
        if (models.some((model) => inspecting.has(model))) return;
        state.motion = yaw;
        applyCamera();
      });
      viewers.forEach((viewer) => {
        if (!viewer.cameraOrbit || inspecting.has(viewer) || syncedViewers.has(viewer)) return;
        const baseYaw = Number(viewer.dataset.cameraYaw || 0);
        const pitch = Number(viewer.dataset.cameraPitch || 76);
        const radius = Number(viewer.dataset.cameraRadius || 4.2);
        viewer.cameraOrbit = `${(baseYaw + yaw).toFixed(2)}deg ${pitch}deg ${radius}m`;
      });
    }
    requestAnimationFrame(animateIndoorCamera);
  }
  animateIndoorCamera();
})();

/* Reading progress and section navigation. */
(function () {
  const progress = document.getElementById('reading-progress');
  const links = [...document.querySelectorAll('.nav-links a')];
  const targets = links.map(link => document.querySelector(link.getAttribute('href')));
  let scheduled = false;
  function update() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${total > 0 ? window.scrollY / total * 100 : 0}%`;
    let current = -1;
    targets.forEach((target, index) => {
      if (target && target.getBoundingClientRect().top <= window.innerHeight * .35) current = index;
    });
    links.forEach((link, index) => {
      link.classList.toggle('active', index === current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Show complete benchmarks; narrow layouts stack one table per dataset. */
(function () {
  const table = document.querySelector('.results-table');
  const buttons = [...document.querySelectorAll('.dataset-filter')];
  if (!table || !buttons.length) return;
  const datasets = ['scannet', 'ca1m', 'arkit'];
  function selectColumns(target, selected) {
    const all = selected === 'all';
    target.dataset.dataset = selected;
    target.querySelectorAll('[data-table-dataset]').forEach(cell => {
      cell.hidden = !all && cell.dataset.tableDataset !== selected;
    });
    const inDomain = target.querySelector('[data-domain="in"]');
    const outDomain = target.querySelector('[data-domain="out"]');
    inDomain.hidden = selected === 'arkit';
    inDomain.colSpan = all ? 8 : 4;
    outDomain.hidden = !all && selected !== 'arkit';
    target.querySelectorAll('tbody tr').forEach(row => {
      if (row.classList.contains('section-divider')) {
        row.cells[0].colSpan = all ? 14 : 6;
        return;
      }
      [...row.cells].forEach((cell, index) => {
        cell.hidden = index >= 2 && !all && datasets[Math.floor((index - 2) / 4)] !== selected;
      });
    });
    target.querySelector('.metric-col').span = all ? 12 : 4;
  }
  const stacked = document.createElement('div');
  stacked.className = 'benchmark-stacked';
  const labels = ['ScanNet', 'CA-1M', 'ARKitScenes'];
  const panels = datasets.map((dataset, index) => {
    const panel = document.createElement('div');
    panel.className = 'dataset-table-panel';
    const title = document.createElement('h4');
    title.className = 'dataset-table-title';
    title.textContent = labels[index];
    const copy = table.cloneNode(true);
    copy.classList.add('stacked-results-table');
    copy.querySelector('.effort-heading').textContent = 'Effort';
    copy.querySelector('caption').textContent = `Quantitative comparison on ${labels[index]}.`;
    selectColumns(copy, dataset);
    panel.append(title, copy);
    stacked.append(panel);
    return panel;
  });
  table.parentElement.after(stacked);
  buttons.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.dataset;
    selectColumns(table, selected);
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    panels.forEach((panel, index) => {
      panel.hidden = selected !== 'all' && datasets[index] !== selected;
    });
  }));
})();
