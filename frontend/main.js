// =============================================
// main.js  –  Shared utilities for all pages
// =============================================

/**
 * Animate a number counter from 0 to target value.
 * @param {HTMLElement} el  - The element to update
 * @param {number}      end - Target number
 * @param {number}      duration - Animation duration in ms
 */
function animateCounter(el, end, duration = 1400) {
  let start = 0;
  const step = Math.ceil(end / (duration / 16));
  const timer = setInterval(() => {
    start += step;
    if (start >= end) { start = end; clearInterval(timer); }
    el.textContent = start + '%';
  }, 16);
}

/**
 * Add entrance animations to elements as they scroll into view.
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.result-card, .feature-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// Run on all pages
document.addEventListener('DOMContentLoaded', initScrollAnimations);
