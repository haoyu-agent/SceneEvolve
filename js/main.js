/* ========== Particle Canvas Background ========== */
(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const PARTICLE_COUNT = 96;
  const CONNECTION_DIST = 142;
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    particles = [];
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const colors = [
      { fill: '155,124,255', glow: 'rgba(155,124,255,0.9)' },
      { fill: '49,213,202', glow: 'rgba(49,213,202,0.85)' },
      { fill: '255,155,114', glow: 'rgba(255,155,114,0.8)' },
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = colors[i % colors.length];
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.8 + 0.7,
        alpha: Math.random() * 0.35 + 0.35,
        phase: Math.random() * Math.PI * 2,
        color,
      });
    }
  }

  function draw(time = 0) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    // Slow orbital rings create a nebula-like sense of depth behind the title.
    ctx.save();
    ctx.translate(w * 0.5, h * 0.46);
    ctx.rotate(Math.sin(time * 0.00008) * 0.22);
    ctx.setLineDash([2, 14]);
    [0.22, 0.34, 0.48].forEach((scale, index) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * scale, h * (scale * 0.38), index * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${index === 1 ? '49,213,202' : '155,124,255'},${0.08 - index * 0.015})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      const twinkle = p.alpha + Math.sin(time * 0.0014 + p.phase) * 0.13;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.fill},${Math.max(0.18, twinkle)})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color.glow;
      ctx.fill();
      ctx.shadowBlur = 0;

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const opacity = (1 - dist / CONNECTION_DIST) * 0.11;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(155,124,255,${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < 200) {
        const opacity = (1 - mDist / 200) * 0.28;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(49,213,202,${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (mouse.x > -9000) {
      const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
      glow.addColorStop(0, 'rgba(49,213,202,0.16)');
      glow.addColorStop(0.45, 'rgba(155,124,255,0.07)');
      glow.addColorStop(1, 'rgba(155,124,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(mouse.x - 220, mouse.y - 220, 440, 440);
    }

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });
})();

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

/* ========== Interactive scene streaming comparison ========== */
(function () {
  const player = document.querySelector('[data-scene-player]');
  const scrubber = document.getElementById('scene-scrubber');
  const frameLabel = document.getElementById('scene-frame');
  const playButton = document.getElementById('scene-play');
  const steps = document.querySelectorAll('[data-scene-step]');
  if (!player || !scrubber || !playButton) return;

  const panels = [...player.querySelectorAll('.scene-panel')];
  let timer = null;
  function setFrame(frame) {
    const safeFrame = Math.max(0, Math.min(4, Number(frame) || 0));
    scrubber.value = String(safeFrame * 25);
    frameLabel.textContent = String(safeFrame + 1).padStart(2, '0');
    steps.forEach((step, index) => step.classList.toggle('active', index === safeFrame));
    panels.forEach((panel) => panel.classList.toggle('is-active', safeFrame === 0 || panel.dataset.scene === 'ours'));
  }
  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
    playButton.textContent = '▶ Play comparison';
    playButton.setAttribute('aria-pressed', 'false');
  }
  playButton.addEventListener('click', () => {
    if (timer) { stop(); return; }
    playButton.textContent = 'Ⅱ Pause comparison';
    playButton.setAttribute('aria-pressed', 'true');
    timer = window.setInterval(() => {
      const next = Number(scrubber.value) + 5;
      if (next >= 100) { setFrame(0); stop(); return; }
      scrubber.value = String(next);
      setFrame(Math.round(next / 25));
    }, 180);
  });
  scrubber.addEventListener('input', () => setFrame(Math.round(Number(scrubber.value) / 25)));
  steps.forEach((step) => step.addEventListener('click', () => { stop(); setFrame(step.dataset.sceneStep); }));
  setFrame(0);
})();

/* Keep the three model viewers moving through a small indoor-only camera arc. */
(function () {
  const viewers = [...document.querySelectorAll('.scene-model')];
  if (!viewers.length) return;
  let t = 0;
  function animateIndoorCamera() {
    t += 0.012;
    const yaw = Math.sin(t) * 8;
    viewers.forEach((viewer) => {
      if (viewer.cameraOrbit) {
        const baseYaw = Number(viewer.dataset.cameraYaw || 0);
        viewer.cameraOrbit = `${(baseYaw + yaw).toFixed(2)}deg 76deg 4.2m`;
      }
    });
    requestAnimationFrame(animateIndoorCamera);
  }
  animateIndoorCamera();
})();
