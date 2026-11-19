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
    const DUR = 7000;      // otomatik geçiş süresi
    const ANIM = 1150;     // geçiş animasyonu süresi
    let idx = 0, timer = null, paused = false, visible = true, lockUntil = 0;

    // çizimlerin "kendini çizme" animasyonu için yol uzunluklarını normalize et
    show.querySelectorAll('.slide__art *').forEach((el) => el.setAttribute('pathLength', '1'));

    const sync = () => {
      slides.forEach((s, i) => {
        const on = i === idx;
        s.toggleAttribute('inert', !on);
        s.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === idx)));
      show.style.setProperty('--i', idx);
      show.style.setProperty('--p', (idx + 1) / slides.length);
    };

    const go = (n, dir) => {
      n = (n + slides.length) % slides.length;
      if (n === idx) return;
      dir = dir || (n > idx ? 1 : -1);
      // önce yönü uygula, stilleri hesaplat, sonra sınıfları değiştir
      show.dataset.dir = dir > 0 ? 'next' : 'prev';
      slides.forEach((s) => s.classList.remove('is-leaving'));
      void show.offsetWidth;
      const prev = slides[idx];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      clearTimeout(prev._t);
      prev._t = setTimeout(() => prev.classList.remove('is-leaving'), ANIM + 50);
      idx = n;
      slides[idx].classList.add('is-active');
      lockUntil = performance.now() + ANIM;
      sync();
      restart();
    };

    const stop = () => { clearTimeout(timer); timer = null; show.classList.remove('is-playing'); };
    const restart = () => {
      stop();
      if (reduce || paused || !visible) return;
      void show.offsetWidth; // ilerleme çubuğunu sıfırla
      show.classList.add('is-playing');
      timer = setTimeout(() => go(idx + 1, 1), DUR);
    };
    show.style.setProperty('--dur', DUR + 'ms');

    show.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => {
      const d = Number(b.dataset.dir);
      go(idx + d, d);
    }));
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
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(idx + 1, 1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(idx - 1, -1); }
    });

    const atTop = () => window.scrollY <= 4;
    const below = () => document.getElementById('hakkimizda')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });

    // fare tekerleği / trackpad: sayfa en üstteyken slaytlar arasında gez,
    // son slayttan sonra (ya da ilk slayttan önce) sayfa normal kaysın
    let lastT = 0, lastAbs = 0, acc = 0;
    show.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const now = performance.now();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      const abs = Math.abs(dy);
      // trackpad ataleti: azalan art arda olaylar yeni bir hareket sayılmaz
      const inertia = now - lastT < 140 && abs <= lastAbs + 1;
      lastT = now; lastAbs = abs;
      if (!atTop()) return;
      const dir = dy > 0 ? 1 : -1;
      if (now < lockUntil || inertia) {
        // kilit/atalet sırasında ne slayt değişir ne sayfa kayar
        e.preventDefault();
        return;
      }
      if (dir > 0 && idx === slides.length - 1) return; // sayfaya devam
      if (dir < 0 && idx === 0) return;
      e.preventDefault();
      acc += dy;
      if (Math.abs(acc) < 24) return;
      acc = 0;
      go(idx + dir, dir);
    }, { passive: false });

    // dokunmatik / fare sürükleme: yatay ve dikey
    let x0 = null, y0 = 0, moved = false;
    show.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.show__bar')) return;
      x0 = e.clientX; y0 = e.clientY; moved = false;
    });
    show.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      if (Math.hypot(e.clientX - x0, e.clientY - y0) > 10) { moved = true; show.classList.add('is-drag'); }
    });
    const end = (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null; show.classList.remove('is-drag');
      if (!moved || performance.now() < lockUntil) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        return;
      }
      if (Math.abs(dy) < 50 || e.pointerType === 'mouse') return;
      const dir = dy < 0 ? 1 : -1; // yukarı kaydırma = sonraki
      if (!atTop()) { dir > 0 ? below() : window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (dir > 0 && idx === slides.length - 1) { below(); return; }
      if (dir < 0 && idx === 0) return;
      go(idx + dir, dir);
    };
    show.addEventListener('pointerup', end);
    show.addEventListener('pointercancel', () => { x0 = null; show.classList.remove('is-drag'); });
    // sürükleme sonrası link tıklamasını engelle
    show.addEventListener('click', (e) => { if (moved && e.target.closest('a')) { e.preventDefault(); moved = false; } }, true);
    show.addEventListener('dragstart', (e) => e.preventDefault());

    sync();
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
