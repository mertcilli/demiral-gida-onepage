(() => {
  document.documentElement.classList.add('js');
  const header = document.querySelector('.header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  // header solid on scroll
  const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const setMenu = (open) => {
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // active nav link
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-active'));
      byId.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  // reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    io.observe(el);
  });

  // dialogs
  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => document.getElementById(btn.dataset.open)?.showModal());
  });
  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });

  // year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // contact form
  const form = document.getElementById('contactForm');
  const msg = form.querySelector('.form__msg');
  const submit = form.querySelector('button[type=submit]');
  const show = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'ok' : 'err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let bad = null;
    form.querySelectorAll('[required]').forEach((f) => {
      const invalid = f.type === 'checkbox' ? !f.checked : !f.value.trim() || !f.checkValidity();
      f.classList.toggle('is-invalid', invalid);
      if (invalid && !bad) bad = f;
    });
    if (bad) {
      show(bad.type === 'checkbox' ? 'Devam etmek için KVKK onayını işaretleyin.' : 'Lütfen zorunlu alanları doğru doldurun.', false);
      bad.focus();
      return;
    }
    submit.disabled = true;
    show('Gönderiliyor…', true);
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      show(data.message, data.success);
      if (data.success) form.reset();
    } catch {
      show('Mesaj gönderilemedi. Lütfen info@demiral.com.tr adresine e-posta gönderin.', false);
    } finally {
      submit.disabled = false;
    }
  });
  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));
})();
