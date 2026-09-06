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
<footer class="site-footer">
  <div class="wrap">
    <div>
      <h4>Археологическая экспедиция Костёнки-Борщёво</h4>
      <p class="draft">Организация и год основания экспедиции</p>
      <p><a href="${root}privacy/">Обработка персональных данных</a></p>
    </div>
    <div>
      <h4>Волонтёру</h4>
      <ul><li><a href="${root}volunteers/">Условия</a></li><li><a href="${root}getting-there/">Как добраться</a></li><li><a href="${root}season/">Сезон и календарь</a></li><li><a href="${root}apply/login.html">Записаться</a></li><li><a href="${root}cabinet/">Кабинет</a></li></ul>
    </div>
    <div>
      <h4>Экспедиция</h4>
      <ul><li><a href="${root}sites/">Стоянки</a></li><li><a href="${root}about/">Об экспедиции</a></li><li><a href="${root}lisitsyn/">Руководитель</a></li><li><a href="${root}news/">Новости</a></li><li><a href="${root}gallery/">Галерея</a></li><li><a href="${root}contacts/">Контакты</a></li></ul>
    </div>
    <div>
      <h4>Связь</h4>
      <ul><li><a href="${root}contacts/">Написать экспедиции</a></li><li><a href="#" rel="noopener">Группа ВКонтакте</a></li><li><a href="https://goodsurfing.org/ru/offers/5379" rel="noopener">Карточка на goodsurfing</a></li><li><a href="${root}admin/" class="small">Админка (в прототипе открыта)</a></li></ul>
    </div>
  </div>
  <div class="wrap site-footer__bottom">
    <span class="small">© Экспедиция Костёнки-Борщёво, ГГГГ</span>
    <a class="credit" href="https://web-tseh.ru/" rel="author noopener" target="_blank">
      <span class="credit__mark" aria-hidden="true">wt</span>
      <span class="credit__text">
        <span class="credit__role">Разработка и администрирование сайта</span>
        <b>Константин Ларионов</b>
        <span class="credit__site">web-tseh.ru<svg class="icon"><use href="#i-arrow"/></svg></span>
      </span>
    </a>
  </div>
</footer>`;
  body.insertAdjacentHTML('afterbegin', header);
  body.insertAdjacentHTML('beforeend', footer);
  // Sprite is fetched with a version so browsers pick up new icons without a hard reload.
  const ASSET_V = '2';
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

  // Mobile sticky CTA appears once the hero has scrolled away.
  const hero = body.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    const bar = document.createElement('div');
    bar.className = 'stickycta';
    bar.innerHTML = `<a class="btn btn--primary btn--block" href="${root}apply/login.html">Записаться в экспедицию</a>`;
    body.appendChild(bar);
    body.classList.add('has-stickycta');
    new IntersectionObserver(([e]) => bar.classList.toggle('is-visible', !e.isIntersecting), { threshold: 0.05 }).observe(hero);
  }
})();
