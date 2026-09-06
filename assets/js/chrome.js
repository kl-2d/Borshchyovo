// Shared header/footer/icon-sprite + prototype helpers, so static pages share one source.
// data-root on <body> = relative prefix to repo root ("" or "../").
(function () {
  const body = document.body;
  const root = body.dataset.root || '';
  const here = body.dataset.page || '';
  const user = body.dataset.user || ''; // logged-in state for cabinet/admin mockups
  const nav = [
    ['volunteers', 'Волонтёрам'],
    ['sites', 'Стоянки'],
    ['season', 'Сезон'],
    ['getting-there', 'Как добраться'],
    ['news', 'Новости'],
    ['about', 'Об экспедиции'],
  ];
  const links = nav.map(([slug, label]) =>
    `<a href="${root}${slug}/"${here === slug ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const header = `
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${root}./">
      <img class="brand__mark" src="${root}assets/brand/mark.svg" alt="" width="36" height="36">
      <span>Костёнки-Борщёво<small>археологическая экспедиция</small></span>
    </a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Меню</button>
    <nav class="nav" id="nav" aria-label="Разделы">${links}<a class="nav__mobile" href="${root}gallery/">Галерея</a><a class="nav__mobile" href="${root}contacts/">Контакты</a><a class="nav__mobile" href="${root}cabinet/">Войти</a><a class="nav__mobile" href="${root}apply/login.html">Записаться</a></nav>
    <div class="header-actions">${user
      ? `<a class="btn btn--secondary btn--sm" href="${root}cabinet/arrival.html"><span class="avatar" style="width:1.4rem;height:1.4rem">${user[0]}</span>${user}</a>`
      : `<a class="btn btn--secondary btn--sm" href="${root}cabinet/">Войти</a><a class="btn btn--primary btn--sm" href="${root}apply/login.html">Записаться</a>`}
    </div>
  </div>
</header>`;
  const footer = `
<footer class="site-footer site-footer--v4">
  <div class="wrap">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <div class="brandline"><img src="${root}assets/brand/mark.svg" alt=""><span>Костёнки-Борщёво<br><span class="small" style="font-weight:400">археологическая экспедиция</span></span></div>
        <p class="draft">Одна строка: организация, с какого года, где</p>
        <div class="site-footer__social">
          <a href="#" rel="noopener"><svg class="icon"><use href="#i-vk"/></svg>ВКонтакте</a>
          <a href="https://goodsurfing.org/ru/offers/5379" rel="noopener"><svg class="icon"><use href="#i-compass"/></svg>goodsurfing</a>
          <a href="${root}contacts/"><svg class="icon"><use href="#i-mail"/></svg>Написать</a>
        </div>
      </div>
      <div class="site-footer__col"><h4>Волонтёру</h4><ul><li><a href="${root}volunteers/">Справочник</a></li><li><a href="${root}season/">Сезон и календарь</a></li><li><a href="${root}getting-there/">Как добраться</a></li><li><a href="${root}apply/login.html">Записаться</a></li><li><a href="${root}cabinet/">Кабинет</a></li></ul></div>
      <div class="site-footer__col"><h4>Экспедиция</h4><ul><li><a href="${root}about/">Об экспедиции</a></li><li><a href="${root}sites/">Стоянки</a></li><li><a href="${root}lisitsyn/">Руководитель</a></li><li><a href="${root}news/">Новости</a></li><li><a href="${root}gallery/">Галерея</a></li><li><a href="${root}reviews/">Отзывы</a></li></ul></div>
      <div class="site-footer__col"><h4>Документы</h4><ul><li><a href="${root}privacy/">Персональные данные</a></li><li><a href="#" class="draft">Правила лагеря</a></li><li><a href="#" class="draft">Открытый лист</a></li><li><a href="${root}contacts/">Для прессы</a></li><li><a href="${root}admin/">Админка</a></li></ul></div>
    </div>
    <div class="site-footer__bottom">
      <div class="small">© Археологическая экспедиция Костёнки-Борщёво, ГГГГ</div>
      <a class="credit credit--wt" href="https://web-tseh.ru/" rel="author noopener" target="_blank">
        <span class="credit__mark">[wt]</span>
        <span class="credit__text"><span class="credit__role">Разработка и администрирование сайта</span><b>Константин Ларионов · Web-Цех</b><span class="credit__site">web-tseh.ru<svg class="icon"><use href="#i-arrow"/></svg></span></span>
      </a>
    </div>
  </div>
</footer>`;
  body.insertAdjacentHTML('afterbegin', header);
  body.insertAdjacentHTML('beforeend', footer);
  // Sprite is fetched with a version so browsers pick up new icons without a hard reload.
  const ASSET_V = '10';
  fetch(root + 'assets/icons.svg?v=' + ASSET_V).then(r => r.text()).then(svg => {
    body.insertAdjacentHTML('afterbegin', svg);
  }).catch(() => {});

  const toggle = body.querySelector('.nav-toggle');
  const navEl = body.querySelector('#nav');
  toggle.addEventListener('click', () => {
    const open = navEl.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // toc-active: highlight the section in view in an in-page table of contents.
  const toc = body.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.remove('is-active')); byId.get(e.target.id)?.classList.add('is-active'); } }), { rootMargin: '-30% 0px -60% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  // FAQ: animate <details> open/close by height (native details can't transition).
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.querySelectorAll('.faq details').forEach(d => {
    const sum = d.querySelector('summary'); if (!sum) return;
    let wrap = d.querySelector('.faq__body');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'faq__body'; while (sum.nextSibling) wrap.appendChild(sum.nextSibling); d.appendChild(wrap); }
    let anim = null;
    sum.addEventListener('click', e => {
      e.preventDefault(); if (anim) anim.cancel();
      if (reduce) { d.open = !d.open; return; }
      if (d.open) {
        anim = wrap.animate([{ height: wrap.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: 'ease-in' });
        anim.onfinish = () => { d.open = false; anim = null; };
      } else {
        d.open = true; const h = wrap.scrollHeight;
        anim = wrap.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 280, easing: 'ease-out' });
        anim.onfinish = () => { anim = null; };
      }
    });
  });

  // Lightbox for galleries: click a photo → full-screen view with caption; arrows / Esc.
  const shots = [...body.querySelectorAll('.masonry .photo, .cols-4 .photo--square, .article-body .photo')];
  if (shots.length) {
    const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Просмотр фото');
    lb.innerHTML = '<div class="lightbox__stage"><div class="photo"><span class="photo__cap"></span></div></div><div class="lightbox__bar"><button type="button" data-prev aria-label="Предыдущее"><svg class="icon" style="transform:rotate(180deg)"><use href="#i-arrow"/></svg></button><span class="lightbox__cap"></span><span class="row"><button type="button" data-next aria-label="Следующее"><svg class="icon"><use href="#i-arrow"/></svg></button><button type="button" data-close aria-label="Закрыть"><svg class="icon"><use href="#i-x"/></svg></button></span></div>';
    body.appendChild(lb);
    let cur = 0;
    const show = i => { cur = (i + shots.length) % shots.length; const cap = shots[cur].querySelector('.photo__cap'); lb.querySelector('.lightbox__cap').textContent = (cap ? cap.textContent : '') + ' · ' + (cur + 1) + ' из ' + shots.length; lb.querySelector('.lightbox__stage .photo__cap').textContent = cap ? cap.textContent : ''; lb.classList.add('is-open'); lb.querySelector('[data-close]').focus(); };
    const hide = () => lb.classList.remove('is-open');
    shots.forEach((s, i) => { s.style.cursor = 'zoom-in'; s.tabIndex = 0; s.setAttribute('role', 'button'); s.addEventListener('click', () => show(i)); s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); } }); });
    lb.querySelector('[data-close]').addEventListener('click', hide);
    lb.querySelector('[data-prev]').addEventListener('click', () => show(cur - 1));
    lb.querySelector('[data-next]').addEventListener('click', () => show(cur + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) hide(); });
    document.addEventListener('keydown', e => { if (!lb.classList.contains('is-open')) return; if (e.key === 'Escape') hide(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  }

  // Mobile sticky CTA appears once the hero has scrolled away.
  const hero = body.querySelector('.hero, .event--top');
  if (hero && 'IntersectionObserver' in window) {
    const bar = document.createElement('div');
    bar.className = 'stickycta';
    bar.innerHTML = `<a class="btn btn--primary btn--block" href="${root}apply/login.html">Записаться в экспедицию</a>`;
    body.appendChild(bar);
    body.classList.add('has-stickycta');
    new IntersectionObserver(([e]) => bar.classList.toggle('is-visible', !e.isIntersecting), { threshold: 0.05 }).observe(hero);
  }
})();
