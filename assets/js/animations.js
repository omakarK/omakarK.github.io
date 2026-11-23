/**
 * Oak & Whimsy — DRAMATIC Animations Engine v2.0
 * Jarag Nagar, Kolhapur Workshop
 * Features: Scroll-reveal, slot-machine counters, 3D tilt, wood particles,
 *           scroll progress bar, shimmer hover, section entrances, parallax hero.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgressBar();
  initCardTilt();
  initCounters();
  initHeaderScroll();
  initFloatingElements();
  initSectionReveal();
  initWoodParticles();
  initHeroTypewriter();
  initParallaxHero();
  initStaggerCards();
});

/* ============================================================
   1. SCROLL PROGRESS BAR (Under header)
   ============================================================ */
function initScrollProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress-bar';
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 0%;
    background: linear-gradient(90deg, #d9822b, #c26f1c, #a35612);
    z-index: 10000;
    transition: width 0.1s linear;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 8px rgba(217, 130, 43, 0.6);
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = scrollPct.toFixed(2) + '%';
  }, { passive: true });
}

/* ============================================================
   2. SECTION REVEAL — Fade + Slide Up on Scroll
   ============================================================ */
function initSectionReveal() {
  const sections = document.querySelectorAll('section, .founders-card, .comparison-wrap, .eco-banner');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  sections.forEach((el, index) => {
    el.classList.add('section-reveal');
    // slight stagger per section
    el.style.transitionDelay = `${(index % 4) * 0.05}s`;
    revealObserver.observe(el);
  });
}

/* ============================================================
   3. SLOT MACHINE NUMBER COUNTERS
   Each digit rolls up independently like a slot machine
   ============================================================ */
function initCounters() {
  const stats = document.querySelectorAll('.stat-number, .tree-count');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetValue = parseInt(el.getAttribute('data-target') || '0', 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';

        // Add glow class
        el.classList.add('counting-glow');

        // Run slot machine roll
        runSlotCounter(el, targetValue, prefix, suffix, 2200);

        obs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  stats.forEach(s => observer.observe(s));
}

function runSlotCounter(el, end, prefix, suffix, duration) {
  const fps = 60;
  const totalFrames = Math.round((duration / 1000) * fps);
  let frame = 0;

  // Easing: fast start → decelerates dramatically at end (like a slot machine stopping)
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  const timer = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    const eased = easeOutExpo(progress);
    const current = Math.round(eased * end);

    // Flash digit colour as it rolls
    const hue = Math.floor(progress * 100);
    el.style.color = progress < 0.9
      ? `hsl(${30 + hue * 1.2}, 90%, 60%)`
      : ''; // snap to natural colour at end

    el.textContent = `${prefix}${current.toLocaleString('en-IN')}${suffix}`;

    if (frame >= totalFrames) {
      clearInterval(timer);
      el.textContent = `${prefix}${end.toLocaleString('en-IN')}${suffix}`;
      el.style.color = '';
      el.classList.remove('counting-glow');
      el.classList.add('counter-done');
    }
  }, 1000 / fps);
}

/* ============================================================
   4. STICKY HEADER + CLASS SWITCH
   ============================================================ */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ============================================================
   5. 3D CARD TILT (Desktop / Pointer:Fine Only)
   ============================================================ */
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024) return;
  const cards = document.querySelectorAll('.product-card, .hero-main-card, .toy-display-stage');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -7;
      const rotY = ((x - cx) / cx) * 7;
      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-6px) scale(1.015)`;
      card.style.transition = 'transform 0.08s ease';

      // Dynamic specular gloss on hover
      const gradX = ((x / rect.width) * 100).toFixed(0);
      const gradY = ((y / rect.height) * 100).toFixed(0);
      card.style.backgroundImage = `radial-gradient(circle at ${gradX}% ${gradY}%, rgba(255,255,255,0.08) 0%, transparent 60%), var(--card-bg, none)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s var(--ease-gentle)';
      card.style.backgroundImage = '';
    });
  });
}

/* ============================================================
   6. FLOATING BADGES (Hero)
   ============================================================ */
function initFloatingElements() {
  const floatingBadges = document.querySelectorAll('.floating-badge');
  floatingBadges.forEach((badge, index) => {
    const delay = index * 1.5;
    badge.animate([
      { transform: 'translateY(0px) rotate(-1deg)' },
      { transform: 'translateY(-10px) rotate(1deg)' },
      { transform: 'translateY(0px) rotate(-1deg)' }
    ], {
      duration: 4000 + index * 700,
      iterations: Infinity,
      easing: 'ease-in-out',
      delay: delay * 1000
    });
  });
}

/* ============================================================
   7. AMBIENT WOOD PARTICLES in Hero Background
   ============================================================ */
function initWoodParticles() {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  // Don't add on mobile
  if (window.innerWidth < 768) return;

  const particleContainer = document.createElement('div');
  particleContainer.className = 'wood-particles-layer';
  particleContainer.setAttribute('aria-hidden', 'true');
  hero.prepend(particleContainer);

  const shapes = ['●', '◆', '▲', '✦', '⬟', '◉'];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'wood-particle';
    p.textContent = shapes[i % shapes.length];
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${(Math.random() * 6).toFixed(2)}s;
      animation-duration: ${(5 + Math.random() * 7).toFixed(2)}s;
      font-size: ${(0.4 + Math.random() * 0.9).toFixed(2)}rem;
      opacity: ${(0.04 + Math.random() * 0.09).toFixed(2)};
      color: ${['#c1885f', '#7b4c2f', '#d9822b', '#422616', '#9e6741'][i % 5]};
    `;
    particleContainer.appendChild(p);
  }
}

/* ============================================================
   8. HERO TITLE TYPEWRITER EFFECT
   ============================================================ */
function initHeroTypewriter() {
  const italic = document.querySelector('.hero-title .highlight-italic');
  if (!italic) return;

  const fullText = italic.textContent;
  italic.textContent = '';
  italic.style.borderRight = '2px solid var(--honey-400)';
  italic.style.paddingRight = '2px';

  let i = 0;
  const speed = 65;

  function typeChar() {
    if (i < fullText.length) {
      italic.textContent += fullText[i];
      i++;
      setTimeout(typeChar, speed + Math.random() * 30);
    } else {
      // Blink cursor then remove it
      let blinks = 0;
      const blink = setInterval(() => {
        italic.style.borderRight = blinks % 2 === 0 ? '2px solid transparent' : '2px solid var(--honey-400)';
        blinks++;
        if (blinks > 6) {
          clearInterval(blink);
          italic.style.borderRight = 'none';
        }
      }, 400);
    }
  }

  // Start after a short pause so user sees title render first
  setTimeout(typeChar, 800);
}

/* ============================================================
   9. PARALLAX HERO IMAGE (Subtle)
   ============================================================ */
function initParallaxHero() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const heroImg = document.querySelector('.hero-image-wrap img');
  if (!heroImg) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight * 1.5) {
      heroImg.style.transform = `translateY(${(scrollY * 0.12).toFixed(1)}px)`;
    }
  }, { passive: true });
}

/* ============================================================
   10. STAGGER-IN CARDS (Product Cards)
   ============================================================ */
function initStaggerCards() {
  // Run after a short delay to let app.js render cards
  setTimeout(() => {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('card-visible');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach((card, i) => {
      card.classList.add('card-enter');
      card.style.transitionDelay = `${(i % 4) * 0.1}s`;
      cardObserver.observe(card);
    });
  }, 600);

  // Also watch for dynamically added cards (filter changes)
  const container = document.getElementById('products-container');
  if (container) {
    const mo = new MutationObserver(() => {
      container.querySelectorAll('.product-card:not(.card-enter)').forEach((card, i) => {
        card.classList.add('card-enter');
        card.style.transitionDelay = `${(i % 4) * 0.1}s`;
        // Trigger immediately
        requestAnimationFrame(() => card.classList.add('card-visible'));
      });
    });
    mo.observe(container, { childList: true, subtree: true });
  }
}

/* ============================================================
   11. SHIMMER EFFECT ON CUSTOMIZER FINISH CHANGE
   Exposed globally so app.js can call it
   ============================================================ */
window.triggerCustomizerShimmer = function(imageEl) {
  if (!imageEl) return;
  imageEl.classList.remove('shimmer-flash');
  void imageEl.offsetWidth; // reflow
  imageEl.classList.add('shimmer-flash');
  imageEl.addEventListener('animationend', () => imageEl.classList.remove('shimmer-flash'), { once: true });
};
