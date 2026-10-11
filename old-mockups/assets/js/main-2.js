document.getElementById('year').textContent = new Date().getFullYear();
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('[data-reveal]').forEach(t => io.observe(t));
} else {
  document.querySelectorAll('[data-reveal]').forEach(t => t.classList.add('vis'));
}
