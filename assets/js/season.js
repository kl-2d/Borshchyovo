// Expedition calendar: occupancy per day, events, day panel, date picking, arrivals list.
// One mock dataset feeds every view so they never disagree. Later this becomes API data.
// Season.render({ calendar, people, events, filters, mode: 'public'|'admin' })
(function () {
  const DAY = 86400000;
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MONTHS_PREP = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
  const WD = ['пн','вт','ср','чт','пт','сб','вс'];
  const Y = 2026; // structural; UI prints "ГГГГ" wherever a year would show

  const SEASON = {
    // The calendar always shows June–September; season bounds inside it are set by the leader in admin.
    windowFrom: d('06-01'), windowTo: d('09-30'),
    start: d('06-15'), end: d('09-15'), today: d('07-21'),
    capacity: 12, minDays: 7, maxDays: 40,
    dayOff: 0, // weekday index (0 = Sunday): a property of days, not an event
    sites: [{ id: 'b5', name: 'Борщёво-5' }, { id: 'k', name: 'Стоянка' }],
    // Event kinds: holiday (праздник), edu (лекция, экскурсия, музей), guests (группы, гости, пресса),
    // work (открытие, закрытие, консервация, субботник). Days off are a weekday setting, not events.
    events: [
      ev('06-15', '06-15', 'Открытие сезона', 'Приезд первой группы, установка лагеря', 'work'),
      ev('07-04', '07-05', 'Экскурсия в музей Костёнки', 'Для всех, кто в лагере', 'edu'),
      ev('07-18', '07-18', 'Лекция о палеолите Дона', 'Вечером у костра', 'edu'),
      ev('07-26', '07-26', 'Приезд школьной группы', '12 человек на день', 'guests'),
      ev('08-15', '08-15', 'День археолога', 'Праздник в лагере', 'holiday'),
      ev('08-31', '09-01', 'Археологический Новый год', 'Ночь с 31 августа на 1 сентября', 'holiday'),
      ev('09-15', '09-15', 'Закрытие сезона', 'Консервация раскопа, сбор лагеря', 'work'),
    ],
    people: [
      p('А', 'b5', '06-15', '06-28', 'confirmed', 'поезд', '07:40', true), p('М', 'b5', '06-15', '07-12', 'confirmed', 'машина', '', false),
      p('К', 'k', '06-20', '06-27', 'confirmed', 'автобус', '13:10', true), p('Д', 'b5', '06-22', '07-06', 'confirmed', 'поезд', '07:40', true),
      p('Е', 'b5', '07-01', '07-22', 'confirmed', 'электричка', '10:05', true), p('С', 'k', '07-03', '07-10', 'confirmed', 'поезд', '07:40', true),
      p('О', 'b5', '07-06', '07-20', 'confirmed', 'машина', '', false), p('Н', 'b5', '07-10', '07-31', 'confirmed', 'поезд', '19:20', true),
      p('И', 'k', '07-13', '07-20', 'pending', 'не знает', '', false), p('Т', 'b5', '07-15', '07-24', 'confirmed', 'поезд', '07:40', true),
      p('Л', 'b5', '07-18', '08-08', 'confirmed', 'поезд', '07:40', true), p('Ю', 'b5', '07-19', '07-28', 'confirmed', 'машина', '', false),
      p('Ж', 'k', '07-20', '07-27', 'confirmed', 'автобус', '13:10', true), p('З', 'b5', '07-21', '08-04', 'confirmed', 'поезд', '07:40', true),
      p('Ф', 'b5', '07-22', '07-29', 'confirmed', 'электричка', '10:05', false), p('Х', 'b5', '07-23', '07-30', 'pending', 'поезд', '', true),
      p('П', 'b5', '08-01', '08-12', 'pending', 'поезд', '', true), p('Р', 'k', '08-05', '08-19', 'confirmed', 'машина', '', false),
      p('В', 'b5', '08-10', '08-24', 'confirmed', 'поезд', '07:40', true), p('Г', 'b5', '08-14', '08-28', 'confirmed', 'поезд', '19:20', true),
      p('Б', 'b5', '08-25', '09-08', 'confirmed', 'автобус', '13:10', true), p('Ц', 'k', '08-30', '09-06', 'confirmed', 'поезд', '07:40', true),
      p('Ч', 'b5', '09-01', '09-15', 'confirmed', 'машина', '', false),
    ],
  };
  function d(md) { return new Date(`${Y}-${md}T00:00:00`); }
  function ev(from, to, title, note, kind) { return { from: d(from), to: d(to), title, note, kind: kind || 'work' }; }
  const KIND_LABEL = { holiday: 'праздник', edu: 'лекция, экскурсия', guests: 'гости, группы', work: 'работы лагеря' };
  const KIND_ICON = { holiday: 'star', edu: 'book', guests: 'users', work: 'trowel' };
  const kicon = k => `<svg class="icon"><use href="#i-${KIND_ICON[k]}"/></svg>`;
  function p(initial, site, from, to, status, transport, time, meet) { return { name: 'Имя', initial, site, from: d(from), to: d(to), status, transport, time, meet }; }
  const days = (a, b) => Math.round((b - a) / DAY);
  const addDays = (a, n) => new Date(a.getTime() + n * DAY);
  const same = (a, b) => a.getTime() === b.getTime();
  const fmt = x => `${x.getDate()} ${MONTHS[x.getMonth()]}`;
  const fmtShort = x => `${x.getDate()} ${MONTHS[x.getMonth()].slice(0, 3)}`;
  const inSeason = x => x >= SEASON.start && x <= SEASON.end;
  const siteName = id => (SEASON.sites.find(s => s.id === id) || {}).name || '';

  function peopleOn(x, filter) {
    const f = q => !filter || filter === 'all' || q.site === filter;
    return {
      inCamp: SEASON.people.filter(q => f(q) && x >= q.from && x <= q.to),
      arrive: SEASON.people.filter(q => f(q) && same(x, q.from)),
      leave: SEASON.people.filter(q => f(q) && same(x, q.to)),
    };
  }
  function eventsOn(x) { return SEASON.events.filter(e => x >= e.from && x <= e.to); }
  function level(n) { const r = n / SEASON.capacity; return n === 0 ? 0 : r < 0.35 ? 1 : r < 0.7 ? 2 : r < 1 ? 3 : 4; }
  const LEVEL_LABEL = ['пока никого', 'мало людей', 'обычная загрузка', 'почти полно', 'мест нет'];

  // ---------- Calendar ----------
  function renderCalendar(root, opts) {
    const mode = opts.mode || 'public';
    const sel = { from: null, to: null };
    let open = null;
    const filter = () => root.dataset.site || 'all';
    let tip = document.querySelector('.tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; document.body.appendChild(tip); }
    const panel = opts.panel ? document.getElementById(opts.panel) : null;

    function build() {
      root.innerHTML = '';
      let cur = new Date(Y, SEASON.windowFrom.getMonth(), 1);
      while (cur <= SEASON.windowTo) { root.appendChild(monthGrid(cur)); cur = new Date(Y, cur.getMonth() + 1, 1); }
      paint();
    }
    function monthGrid(first) {
      const m = document.createElement('section'); m.className = 'cal__month';
      const daysIn = new Date(Y, first.getMonth() + 1, 0).getDate();
      let peak = 0, sum = 0, n = 0;
      for (let i = 1; i <= daysIn; i++) { const x = new Date(Y, first.getMonth(), i); if (!inSeason(x)) continue; const c = peopleOn(x, filter()).inCamp.length; peak = Math.max(peak, c); sum += c; n++; }
      const h = document.createElement('h3');
      h.innerHTML = `${MONTHS_NOM[first.getMonth()]}<small>${n ? `в среднем ${Math.round(sum / n)}, пик ${peak}` : 'вне сезона'}</small>`;
      m.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'cal__grid';
      WD.forEach(w => { const e = document.createElement('span'); e.className = 'cal__wd'; e.textContent = w; grid.appendChild(e); });
      const offset = (first.getDay() + 6) % 7;
      for (let i = 0; i < offset; i++) { const e = document.createElement('span'); grid.appendChild(e); }
      for (let i = 1; i <= daysIn; i++) grid.appendChild(dayCell(new Date(Y, first.getMonth(), i)));
      m.appendChild(grid);
      return m;
    }
    function dayCell(x) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cal__day'; b.dataset.t = x.getTime();
      b.innerHTML = `<span class="cal__num">${x.getDate()}</span>`;
      if ((x.getDay() + 6) % 7 >= 5) b.classList.add('is-weekend');
      const off = x.getDay() === SEASON.dayOff && inSeason(x);
      if (off) { b.classList.add('is-dayoff'); b.insertAdjacentHTML('beforeend', '<span class="cal__off" title="выходной">вых</span>'); }
      if (same(x, SEASON.today)) b.classList.add('is-today');
      const evs = eventsOn(x);
      if (!inSeason(x)) {
        b.classList.add('is-out');
        b.setAttribute('aria-label', `${fmt(x)}: вне сезона`);
        if (!evs.length) { b.disabled = true; return b; }
      }
      const st = peopleOn(x, filter());
      const n = st.inCamp.length, lv = inSeason(x) ? level(n) : 0;
      b.classList.add('is-' + lv);
      evs.forEach(e => {
        const pos = same(e.from, e.to) ? 'single' : same(x, e.from) ? 'start' : same(x, e.to) ? 'end' : 'mid';
        b.insertAdjacentHTML('beforeend', `<span class="cal__ev is-${pos} kind-${e.kind}">${pos === 'single' || pos === 'start' ? kicon(e.kind) + '<span>' + e.title + '</span>' : ''}</span>`);
      });
      const label = `${fmt(x)}: ${n} в лагере, ${LEVEL_LABEL[lv]}` + (off ? '; выходной' : '') + (evs.length ? `; ${evs.map(e => e.title).join(', ')}` : '');
      b.setAttribute('aria-label', label);
      b.dataset.tip = `<b>${fmt(x)}</b>${off ? ' · выходной' : ''}<br>${n} чел. в лагере · ${LEVEL_LABEL[lv]}` + (st.arrive.length ? `<br>приезжают: ${st.arrive.length}` : '') + (st.leave.length ? `<br>уезжают: ${st.leave.length}` : '') + evs.map(e => `<br>${e.title}`).join('');
      b.addEventListener('click', () => openDay(x));
      b.addEventListener('mouseenter', () => { showTip(b); preview(x); }); b.addEventListener('focus', () => { showTip(b); preview(x); });
      b.addEventListener('mouseleave', () => { hideTip(); preview(null); }); b.addEventListener('blur', () => { hideTip(); preview(null); });
      return b;
    }
    function showTip(b) { tip.innerHTML = b.dataset.tip; tip.hidden = false; const r = b.getBoundingClientRect(); tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top - 8) + 'px'; }
    function hideTip() { tip.hidden = true; }

    // While an arrival is chosen and no departure yet, hovering a later day previews the range.
    function preview(x) {
      const on = mode !== 'admin' && sel.from && !sel.to && x && x > sel.from;
      root.querySelectorAll('.cal__day').forEach(b => {
        const t = new Date(+b.dataset.t);
        b.classList.toggle('is-preview', !!on && t > sel.from && t <= x);
      });
    }
    function openDay(x) { open = x; paint(); renderPanel(); }
    function closeDay() { open = null; paint(); renderPanel(); }
    function pick(kind, x) {
      if (kind === 'from') { sel.from = x; if (sel.to && sel.to < x) sel.to = null; }
      else { if (sel.from && x < sel.from) { sel.to = sel.from; sel.from = x; } else sel.to = x; }
      paint(); renderPanel();
    }
    function paint() {
      root.querySelectorAll('.cal__day').forEach(b => {
        const x = new Date(+b.dataset.t);
        b.classList.toggle('is-open', !!open && same(x, open));
        b.classList.toggle('is-from', !!sel.from && same(x, sel.from));
        b.classList.toggle('is-to', !!sel.to && same(x, sel.to));
        b.classList.toggle('is-in', !!(sel.from && sel.to) && x > sel.from && x < sel.to);
      });
    }
    function person(q, withTransport) {
      const tr = withTransport ? `<small>${q.transport}${q.time ? ' ' + q.time : ''}${q.meet ? ' · <b>встретить</b>' : ''}</small>` : `<small>${siteName(q.site)}</small>`;
      return `<li><span class="avatar${q.site === 'k' ? ' avatar--river' : ''}" style="width:1.5rem;height:1.5rem;font-size:.7rem">${q.initial}</span><span><span class="draft">${q.name}</span>${q.status === 'pending' ? ' <span class="chip chip--warn">заявка</span>' : ''} ${tr}</span></li>`;
    }
    let renderPanel = function () {
      if (!panel) return;
      panel.classList.toggle('is-open', !!open);
      if (!open) {
        panel.innerHTML = `<h3>День</h3><p class="empty">Нажмите на день в календаре: увидите, сколько человек в лагере, кто приезжает и уезжает, и события.</p>` + pickedBlock();
        return;
      }
      const st = peopleOn(open, filter()); const evs = eventsOn(open); const n = st.inCamp.length;
      const out = !inSeason(open);
      let h = `<h3>${fmt(open)}<span>${WD[(open.getDay() + 6) % 7]}${open.getDay() === SEASON.dayOff ? ' · выходной' : ''}${same(open, SEASON.today) ? ' · сегодня' : ''}</span></h3>`;
      evs.forEach(e => h += `<div class="ev kind-${e.kind}"><span class="kind">${kicon(e.kind)}${KIND_LABEL[e.kind]}</span><b>${e.title}</b>${e.note ? `<br><small>${e.note}</small>` : ''}${!same(e.from, e.to) ? `<br><small>${fmtShort(e.from)} — ${fmtShort(e.to)}</small>` : ''}</div>`);
      if (out) h += `<p class="empty">Вне сезона: раскопки идут с ${fmt(SEASON.start)} по ${fmt(SEASON.end)}.</p>`;
      else {
        h += `<div class="occ"><b>${n}</b><span>из ${SEASON.capacity} в лагере · ${LEVEL_LABEL[level(n)]}</span></div>`;
        if (st.arrive.length) h += `<h4>Приезжают</h4><ul>${st.arrive.map(q => person(q, mode === 'admin')).join('')}</ul>`;
        if (st.leave.length) h += `<h4>Уезжают</h4><ul>${st.leave.map(q => person(q, mode === 'admin')).join('')}</ul>`;
        const staying = st.inCamp.filter(q => !same(q.from, open) && !same(q.to, open));
        if (staying.length) h += `<h4>В лагере</h4><ul>${staying.map(q => person(q, false)).join('')}</ul>`;
        if (!n) h += `<p class="empty">Пока никого — хорошее время приехать.</p>`;
        if (mode === 'admin') h += `<div class="pick"><a class="btn btn--secondary btn--sm" href="#add-event">Событие в этот день</a><a class="btn btn--secondary btn--sm" href="daylist.html">Список на день</a></div>`;
        else h += (sel.from && sel.to) ? pickedBlock() + pickControls() : pickControls();
      }
      panel.innerHTML = `<button type="button" class="close" aria-label="Закрыть"><svg class="icon"><use href="#i-x"/></svg></button>` + h + ((sel.from && sel.to) ? '' : pickedBlock());
      panel.querySelector('.close').addEventListener('click', closeDay);
      panel.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick, open)));
      panel.querySelector('#pick-clear')?.addEventListener('click', () => { sel.from = sel.to = null; paint(); preview(null); renderPanel(); });
    };
    // One clear next action per state: arrive → depart → apply.
    function pickControls() {
      if (!sel.from || sel.to) {
        if (sel.to) return `<div class="pick pick--one" style="margin-top: var(--sp-3)"><button type="button" class="btn btn--secondary btn--sm" data-pick="from">Новый приезд с этого дня</button></div>`;
        return `<div class="pick pick--one"><button type="button" class="btn btn--primary" data-pick="from"><svg class="icon"><use href="#i-signin"/></svg>Приехать в этот день</button><span class="pick__hint">Потом выберите день отъезда</span></div>`;
      }
      if (open <= sel.from) {
        return `<div class="pick pick--one"><button type="button" class="btn btn--secondary" data-pick="from">Приехать в этот день вместо ${fmtShort(sel.from)}</button></div>`;
      }
      const n = days(sel.from, open) + 1;
      const bad = n < SEASON.minDays ? `Минимум ${SEASON.minDays} дней` : n > SEASON.maxDays ? `Максимум ${SEASON.maxDays} дней` : '';
      return `<div class="pick pick--one"><button type="button" class="btn btn--primary" data-pick="to"${bad ? ' disabled' : ''}><svg class="icon"><use href="#i-signout"/></svg>Уехать в этот день · ${n} дн.</button><span class="pick__hint">${bad || `Приезд ${fmtShort(sel.from)}, всего ${n} дней`}</span></div>`;
    }
    function pickedBlock() {
      if (mode === 'admin' || !sel.from) return '';
      if (!sel.to) return `<div class="picked picked--step"><span class="chip chip--river"><svg class="icon"><use href="#i-signin"/></svg>Приезд ${fmtShort(sel.from)}</span> <span class="small">Теперь нажмите день отъезда в календаре</span></div>`;
      const n = days(sel.from, sel.to) + 1;
      let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, peopleOn(addDays(sel.from, i), filter()).inCamp.length);
      const warn = n < SEASON.minDays ? `Минимум ${SEASON.minDays} дней.` : n > SEASON.maxDays ? `Максимум ${SEASON.maxDays} дней.` : peak >= SEASON.capacity ? 'На часть дат мест нет — можно в лист ожидания.' : '';
      return `<div class="picked picked--done"><div class="picked__dates"><b>${fmtShort(sel.from)} — ${fmtShort(sel.to)}</b><span>${n} дн. · в лагере будет до ${peak} чел.</span>${warn ? `<span class="picked__warn">${warn}</span>` : ''}</div>
        <a class="btn btn--primary btn--block btn--pulse" href="${root.dataset.applyUrl || '../apply/step3.html'}">Записаться на ${fmtShort(sel.from)} — ${fmtShort(sel.to)}</a>
        <button type="button" class="link-more small" id="pick-clear" style="background:none;border:0;padding:0;cursor:pointer;margin-top:var(--sp-2)">Сбросить даты</button></div>`;
    }
    // Keyboard: arrows move between days across months, Enter/Space opens (native button).
    root.addEventListener('keydown', e => {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step || !e.target.classList.contains('cal__day')) return;
      e.preventDefault();
      const next = addDays(new Date(+e.target.dataset.t), step);
      const el = root.querySelector(`.cal__day[data-t="${next.getTime()}"]`);
      if (el && !el.disabled) el.focus();
    });
    // Mobile: once both dates are chosen, a bottom bar carries the apply button.
    let bar = null;
    function renderBar() {
      if (mode === 'admin') return;
      if (!bar) { bar = document.createElement('div'); bar.className = 'pickbar'; document.body.appendChild(bar); }
      if (sel.from && sel.to) { bar.innerHTML = `<a class="btn btn--primary btn--block" href="${root.dataset.applyUrl || '../apply/step3.html'}">Записаться на ${fmtShort(sel.from)} — ${fmtShort(sel.to)}</a>`; bar.classList.add('is-visible'); }
      else bar.classList.remove('is-visible');
    }
    const _renderPanel = renderPanel;
    renderPanel = function () { _renderPanel(); renderBar(); };
    root.addEventListener('site-filter', () => { build(); renderPanel(); });
    build(); renderPanel();
  }

  // ---------- Events in a date range (admin today, cabinet arrival) ----------
  function renderUpcoming(root, from, to, withKind) {
    const list = SEASON.events.filter(e => e.to >= from && e.from <= to);
    if (!list.length) { root.innerHTML = '<p class="empty">Событий нет.</p>'; return; }
    root.innerHTML = list.map(e => `<li class="kind-${e.kind}"><span class="date${same(e.from, e.to) ? '' : ' is-range'}"><b>${same(e.from, e.to) ? e.from.getDate() : e.from.getDate() + '–' + e.to.getDate()}</b><span>${MONTHS[e.from.getMonth()].slice(0, 3)}</span>${kicon(e.kind)}</span><span class="body"><b>${e.title}</b><small>${KIND_LABEL[e.kind]}${e.note ? ' · ' + e.note : ''}</small></span></li>`).join('');
  }

  // ---------- Events list ----------
  function renderEvents(root) {
    const next = SEASON.events.find(e => e.to >= SEASON.today);
    root.innerHTML = SEASON.events.map(e => {
      const range = !same(e.from, e.to);
      const date = range
        ? `<span class="date is-range"><b>${e.from.getDate()}–${e.to.getDate()}</b><span>${MONTHS[e.from.getMonth()].slice(0, 3)}${e.from.getMonth() !== e.to.getMonth() ? '–' + MONTHS[e.to.getMonth()].slice(0, 3) : ''}</span>${kicon(e.kind)}</span>`
        : `<span class="date"><b>${e.from.getDate()}</b><span>${MONTHS[e.from.getMonth()].slice(0, 3)}</span>${kicon(e.kind)}</span>`;
      const cls = ` class="kind-${e.kind}${e === next ? ' is-next' : e.to < SEASON.today ? ' is-past' : ''}"`;
      return `<li${cls}>${date}<span class="body"><b>${e.title}</b><small>${KIND_LABEL[e.kind]}${e.note ? ' · ' + e.note : ''}</small></span></li>`;
    }).join('');
  }

  // ---------- People list ----------
  function renderPeople(root) {
    const total = days(SEASON.start, SEASON.end) + 1;
    const filter = () => root.dataset.site || 'all';
    const pct = x => Math.max(0, Math.min(100, days(SEASON.start, x) / total * 100)).toFixed(2);
    function build() {
      const list = SEASON.people.filter(q => filter() === 'all' || q.site === filter()).sort((a, b) => a.from - b.from);
      root.innerHTML = '';
      root.style.setProperty('--today', pct(SEASON.today) + '%');
      const head = document.createElement('div'); head.className = 'people__head';
      head.innerHTML = `<span>Кто</span><span>Даты</span><span class="people__track"></span>`;
      const th = head.querySelector('.people__track');
      let cur = new Date(Y, SEASON.start.getMonth(), 1);
      while (cur <= SEASON.end) { const s = document.createElement('i'); s.style.left = pct(cur < SEASON.start ? SEASON.start : cur) + '%'; s.textContent = MONTHS_NOM[cur.getMonth()]; th.appendChild(s); cur = new Date(Y, cur.getMonth() + 1, 1); }
      root.appendChild(head);
      let last = -1;
      list.forEach(q => {
        if (q.from.getMonth() !== last) { last = q.from.getMonth(); const g = document.createElement('div'); g.className = 'people__group'; g.textContent = `Приезжают в ${MONTHS_PREP[last]}`; root.appendChild(g); }
        const row = document.createElement('div'); row.className = 'people__row' + (q.status === 'pending' ? ' is-pending' : '') + (q.to < SEASON.today ? ' is-past' : '');
        row.innerHTML = `<span class="people__who"><span class="avatar${q.site === 'k' ? ' avatar--river' : ''}">${q.initial}</span><span><span class="draft">${q.name}</span><small>${siteName(q.site)}${q.status === 'pending' ? ' · ждёт подтверждения' : ''}</small></span></span>
          <span class="people__dates">${fmtShort(q.from)} — ${fmtShort(q.to)}<small>${days(q.from, q.to) + 1} дн.</small></span>
          <span class="people__track"><i class="bar" style="left:${pct(q.from)}%;width:${((days(q.from, q.to) + 1) / total * 100).toFixed(2)}%"></i></span>`;
        root.appendChild(row);
      });
      if (!list.length) root.insertAdjacentHTML('beforeend', '<p class="muted">Пока никто не записался на эту стоянку.</p>');
    }
    root.addEventListener('site-filter', build);
    build();
  }

  function wireFilters(container, targets) {
    container.querySelectorAll('[data-site]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      container.querySelectorAll('[data-site]').forEach(x => x.removeAttribute('aria-current'));
      a.setAttribute('aria-current', 'true');
      targets.forEach(t => { t.dataset.site = a.dataset.site; t.dispatchEvent(new Event('site-filter')); });
    }));
  }

  window.Season = {
    data: SEASON,
    render(ids) {
      const targets = [];
      if (ids.calendar) { const el = document.getElementById(ids.calendar); renderCalendar(el, ids); targets.push(el); }
      if (ids.people) { const el = document.getElementById(ids.people); renderPeople(el); targets.push(el); }
      if (ids.events) renderEvents(document.getElementById(ids.events));
      if (ids.week) renderUpcoming(document.getElementById(ids.week), SEASON.today, addDays(SEASON.today, 7));
      if (ids.stay) renderUpcoming(document.getElementById(ids.stay), d('07-15'), d('07-24'));
      if (ids.filters) wireFilters(document.getElementById(ids.filters), targets);
      document.querySelectorAll('[data-season-fact]').forEach(el => {
        const k = el.dataset.seasonFact;
        el.textContent = k === 'range' ? `${fmt(SEASON.start)} — ${fmt(SEASON.end)}` : k === 'days' ? `от ${SEASON.minDays} до ${SEASON.maxDays} дней` : k === 'capacity' ? `до ${SEASON.capacity} человек` : k === 'count' ? SEASON.people.length : '';
      });
    },
  };
})();
