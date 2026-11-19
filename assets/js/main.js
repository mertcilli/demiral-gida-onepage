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

  // showcase slider
  const show = document.querySelector('.show');
  if (show) {
    const slides = [...show.querySelectorAll('.slide')];
    const dots = [...show.querySelectorAll('[data-go]')];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DUR = 7000;
    let idx = 0, timer = null, paused = false, visible = true;

    const setInert = () => slides.forEach((s, i) => {
      const on = i === idx;
      s.toggleAttribute('inert', !on);
      s.setAttribute('aria-hidden', String(!on));
    });

    const go = (n) => {
      n = (n + slides.length) % slides.length;
      if (n === idx) return;
      const prev = slides[idx];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(() => prev.classList.remove('is-leaving'), 1100);
      idx = n;
      slides[idx].classList.add('is-active');
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === idx)));
      setInert();
      restart();
    };

    const stop = () => { clearTimeout(timer); timer = null; show.classList.remove('is-playing'); };
    const restart = () => {
      stop();
      if (reduce || paused || !visible) return;
      void show.offsetWidth; // progress animasyonunu sıfırla
      show.classList.add('is-playing');
      timer = setTimeout(() => go(idx + 1), DUR);
    };
    show.style.setProperty('--dur', DUR + 'ms');

    show.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => go(idx + Number(b.dataset.dir))));
    dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.go))));

    // hover / odakta durdur
    show.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { paused = true; stop(); } });
    show.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { paused = false; restart(); } });
    show.addEventListener('focusin', () => { paused = true; stop(); });
    show.addEventListener('focusout', (e) => { if (!show.contains(e.relatedTarget)) { paused = false; restart(); } });

    // görünür değilken durdur
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; restart(); }, { threshold: 0.3 }).observe(show);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; restart(); });

    // klavye
    show.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
    });

    // sürükle / kaydır
    let x0 = null, y0 = 0, moved = false;
    show.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.show__bar')) return;
      x0 = e.clientX; y0 = e.clientY; moved = false;
    });
    show.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      if (Math.abs(e.clientX - x0) > 10 && Math.abs(e.clientX - x0) > Math.abs(e.clientY - y0)) {
        moved = true; show.classList.add('is-drag');
      }
    });
    const end = (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null; show.classList.remove('is-drag');
      if (moved && Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1));
    };
    show.addEventListener('pointerup', end);
    show.addEventListener('pointercancel', () => { x0 = null; show.classList.remove('is-drag'); });
    // sürükleme sonrası link tıklamasını engelle
    show.addEventListener('click', (e) => { if (moved && e.target.closest('a')) { e.preventDefault(); moved = false; } }, true);
    show.addEventListener('dragstart', (e) => e.preventDefault());

    setInert();
    restart();
  }

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
  const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'ok' : 'err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let bad = null;
    form.querySelectorAll('[required]').forEach((f) => {
      const invalid = f.type === 'checkbox' ? !f.checked : !f.value.trim() || !f.checkValidity();
      f.classList.toggle('is-invalid', invalid);
      if (invalid && !bad) bad = f;
    });
    if (bad) {
      say(bad.type === 'checkbox' ? 'Devam etmek için KVKK onayını işaretleyin.' : 'Lütfen zorunlu alanları doğru doldurun.', false);
      bad.focus();
      return;
    }
    submit.disabled = true;
    say('Gönderiliyor…', true);
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      say(data.message, data.success);
      if (data.success) form.reset();
    } catch {
      say('Mesaj gönderilemedi. Lütfen info@demiral.com.tr adresine e-posta gönderin.', false);
    } finally {
      submit.disabled = false;
    }
  });
  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));
})();
