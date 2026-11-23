/**
 * Animations & Interactive Micro-Physics for Oak & Whimsy
 * Provides 3D tilt effects, smooth entrance transitions, counter tickers, and floating wood particles.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCardTilt();
  initCounters();
  initHeaderScroll();
  initFloatingElements();
});

// 3D Card Tilt for Product Cards and Hero Visual
function initCardTilt() {
  const cards = document.querySelectorAll('.product-card, .hero-main-card, .toy-display-stage');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease';
    });
  });
}

// Animate numbers when they scroll into view
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
        animateValue(el, 0, targetValue, 2000, prefix, suffix);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  stats.forEach(s => observer.observe(s));
}

function animateValue(obj, start, end, duration, prefix = '', suffix = '') {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // Ease out quart
    const easeOut = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(easeOut * (end - start) + start);
    obj.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = `${prefix}${end.toLocaleString()}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
}

// Sticky header class switch
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

// Subtle floating ambient effect for badges
function initFloatingElements() {
  const floatingBadges = document.querySelectorAll('.floating-badge');
  floatingBadges.forEach((badge, index) => {
    const delay = index * 1.5;
    badge.animate([
      { transform: 'translateY(0px)' },
      { transform: 'translateY(-8px)' },
      { transform: 'translateY(0px)' }
    ], {
      duration: 3600 + index * 600,
      iterations: Infinity,
      easing: 'ease-in-out',
      delay: delay * 1000
    });
  });
}
