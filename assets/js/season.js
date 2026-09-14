// Season data + the three views the v3 site needs: the landing strip (occupancy by colour),
// the leisure events calendar (four months, event bars, no occupancy), and the apply-form date
// hint. One mock dataset feeds all of them; later `occupancy.json` from the booking service.
// Season.render({ strip, calendar, events, dates })
(function () {
  const DAY = 86400000;
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const WD = ['пн','вт','ср','чт','пт','сб','вс'];
  const Y = 2026; // structural; UI prints "ГГГГ" wherever a year would show

  const SEASON = {
    // The calendar always shows June–September; season bounds inside it are set by the leader.
    windowFrom: d('06-01'), windowTo: d('09-30'),
    start: d('06-15'), end: d('09-15'), today: d('07-21'),
    capacity: 12, minDays: 7, maxDays: 40,
    dayOff: 0, // weekday index (0 = Sunday): a property of days, not an event
    // Event kinds: holiday (праздник), edu (лекция, экскурсия, музей), guests (группы, гости, пресса),
    // work (открытие, закрытие, консервация). Source later: events.json built by the booking service
    // from an .ics feed (the leader's Yandex/Google calendar) or edited by hand once a season.
    events: [
      ev('06-15', '06-15', 'Открытие сезона', 'Приезд первой группы, установка лагеря', 'work'),
      ev('07-04', '07-05', 'Экскурсия в музей Костёнки', 'Для всех, кто в лагере', 'edu'),
      ev('07-18', '07-18', 'Лекция о палеолите Дона', 'Вечером у костра', 'edu'),
      ev('07-26', '07-26', 'Приезд школьной группы', '12 человек на день', 'guests'),
      ev('08-15', '08-15', 'День археолога', 'Праздник в лагере', 'holiday'),
      ev('08-31', '09-01', 'Археологический Новый год', 'Ночь с 31 августа на 1 сентября', 'holiday'),
      ev('09-15', '09-15', 'Закрытие сезона', 'Консервация раскопа, сбор лагеря', 'work'),
    ],
    // Mock stays: only from/to matter now (occupancy per day). Names never reach the public site.
    stays: [
      s('06-15', '06-28'), s('06-15', '07-12'), s('06-20', '06-27'), s('06-22', '07-06'), s('07-01', '07-22'),
      s('07-03', '07-10'), s('07-06', '07-20'), s('07-10', '07-31'), s('07-13', '07-20'), s('07-15', '07-24'),
      s('07-18', '08-08'), s('07-19', '07-28'), s('07-20', '07-27'), s('07-21', '08-04'), s('07-22', '07-29'),
      s('07-23', '07-30'), s('08-01', '08-12'), s('08-05', '08-19'), s('08-10', '08-24'), s('08-14', '08-28'),
      s('08-25', '09-08'), s('08-30', '09-06'), s('09-01', '09-15'),
    ],
  };
  function d(md) { return new Date(`${Y}-${md}T00:00:00`); }
  function ev(from, to, title, note, kind) { return { from: d(from), to: d(to), title, note, kind: kind || 'work', desc: 'Описание события: что будет, где собираемся, во сколько, кому подходит — текст из календаря начальника экспедиции' }; }
  function s(from, to) { return { from: d(from), to: d(to) }; }
  const KIND_LABEL = { holiday: 'праздник', edu: 'лекция, экскурсия', guests: 'гости, группы', work: 'работы лагеря' };
  const KIND_ICON = { holiday: 'star', edu: 'book', guests: 'users', work: 'trowel' };
  const kicon = k => `<svg class="icon"><use href="#i-${KIND_ICON[k]}"/></svg>`;
  const days = (a, b) => Math.round((b - a) / DAY);
  const addDays = (a, n) => new Date(a.getTime() + n * DAY);
  const same = (a, b) => a.getTime() === b.getTime();
  const fmt = x => `${x.getDate()} ${MONTHS[x.getMonth()]}`;
  const fmtShort = x => `${x.getDate()} ${MONTHS[x.getMonth()].slice(0, 3)}`;
  const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const inSeason = x => x >= SEASON.start && x <= SEASON.end;
  const inCamp = x => SEASON.stays.filter(q => x >= q.from && x <= q.to).length;
  const eventsOn = x => SEASON.events.filter(e => x >= e.from && x <= e.to);
  function level(n) { const r = n / SEASON.capacity; return n === 0 ? 0 : r < 0.35 ? 1 : r < 0.7 ? 2 : r < 1 ? 3 : 4; }
  const LEVEL_LABEL = ['пока никого', 'мало людей', 'обычная загрузка', 'почти полно', 'мест нет'];

  // ---------- Events calendar (leisure) ----------
  // Four month grids; a day carries event bars (start cell shows icon + title) and a hover tip.
  // No occupancy, no clicking: this is a poster of the season, not a booking tool.
  function renderCalendar(root) {
    let tip = document.querySelector('.tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; document.body.appendChild(tip); }
    const showTip = b => { tip.innerHTML = b.dataset.tip; tip.hidden = false; const r = b.getBoundingClientRect(); tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top - 8) + 'px'; };
    const hideTip = () => { tip.hidden = true; };
    root.innerHTML = '';
    for (let m = SEASON.windowFrom.getMonth(); m <= SEASON.windowTo.getMonth(); m++) {
      const sec = document.createElement('section'); sec.className = 'cal__month';
      sec.innerHTML = `<h3>${MONTHS_NOM[m]}</h3>`;
      const grid = document.createElement('div'); grid.className = 'cal__grid';
      WD.forEach(w => { const e = document.createElement('span'); e.className = 'cal__wd'; e.textContent = w; grid.appendChild(e); });
      const first = new Date(Y, m, 1), n = new Date(Y, m + 1, 0).getDate();
      for (let i = 0; i < (first.getDay() + 6) % 7; i++) grid.appendChild(document.createElement('span'));
      for (let i = 0; i < n; i++) {
        const x = addDays(first, i), evs = eventsOn(x), off = x.getDay() === SEASON.dayOff && inSeason(x);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'cal__day is-0';
        b.innerHTML = `<span class="cal__num">${x.getDate()}</span>`;
        if ((x.getDay() + 6) % 7 >= 5) b.classList.add('is-weekend');
        if (off) { b.classList.add('is-dayoff'); b.insertAdjacentHTML('beforeend', '<span class="cal__off" title="выходной">вых</span>'); }
        if (same(x, SEASON.today)) b.classList.add('is-today');
        if (!inSeason(x)) { b.classList.add('is-out'); if (!evs.length) { b.disabled = true; b.setAttribute('aria-label', `${fmt(x)}: вне сезона`); grid.appendChild(b); continue; } }
        if (!evs.length) b.disabled = true; // plain days are not interactive here
        evs.forEach(e => {
          const pos = same(e.from, e.to) ? 'single' : same(x, e.from) ? 'start' : same(x, e.to) ? 'end' : 'mid';
          b.insertAdjacentHTML('beforeend', `<span class="cal__ev is-${pos} kind-${e.kind}">${pos === 'single' || pos === 'start' ? kicon(e.kind) + '<span>' + e.title + '</span>' : ''}</span>`);
          if (e.kind === 'holiday') b.classList.add('has-holiday');
        });
        if (evs.length) { b.classList.add('has-ev'); b.addEventListener('click', () => openEvent(SEASON.events.indexOf(evs[0]))); }
        b.setAttribute('aria-label', `${fmt(x)}` + (off ? ', выходной' : '') + (evs.length ? `: ${evs.map(e => e.title).join(', ')}` : ''));
        b.dataset.tip = `<b>${fmt(x)}</b>${off ? ' · выходной' : ''}` + (evs.length ? evs.map(e => `<br>${e.title}`).join('') : '<br>обычный день');
        b.addEventListener('mouseenter', () => showTip(b)); b.addEventListener('focus', () => showTip(b));
        b.addEventListener('mouseleave', hideTip); b.addEventListener('blur', hideTip);
        grid.appendChild(b);
      }
      sec.appendChild(grid); root.appendChild(sec);
    }
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
      return `<li${cls}><button type="button" data-ev="${SEASON.events.indexOf(e)}">${date}<span class="body"><b>${e.title}</b><small>${KIND_LABEL[e.kind]}${e.note ? ' · ' + e.note : ''}</small></span></button></li>`;
    }).join('');
    root.addEventListener('click', ev => { const b = ev.target.closest('[data-ev]'); if (b) openEvent(+b.dataset.ev); });
  }

  // ---------- Event detail (native dialog) ----------
  function openEvent(i) {
    const e = SEASON.events[i]; if (!e) return;
    let dlg = document.getElementById('ev-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'ev-dialog'; dlg.className = 'ev-dialog';
      dlg.innerHTML = '<button type="button" class="ev-dialog__close" data-close aria-label="Закрыть"><svg class="icon"><use href="#i-x"/></svg></button><div class="ev-dialog__body"></div>';
      dlg.addEventListener('click', ev => { if (ev.target === dlg || ev.target.closest('[data-close]')) dlg.close(); });
      document.body.appendChild(dlg);
    }
    const when = same(e.from, e.to) ? fmt(e.from) : `${fmt(e.from)} — ${fmt(e.to)}`;
    dlg.querySelector('.ev-dialog__body').innerHTML = `<span class="chip kind-${e.kind}" style="background: color-mix(in srgb, var(--ev) 14%, white); color: var(--ev)">${kicon(e.kind)}${KIND_LABEL[e.kind]}</span><h3>${e.title}</h3><p class="ev-dialog__when"><svg class="icon"><use href="#i-calendar"/></svg>${when}${e.note ? ' · ' + e.note : ''}</p><p class="draft">${e.desc}</p>`;
    dlg.showModal();
  }

  // ---------- Season strip (landing) ----------
  // Four months as rows of small day cells, colour = occupancy level only. No names, no numbers:
  // the public sees "when it is quiet / crowded", dates are chosen on the apply page.
  function renderStrip(root) {
    const months = [];
    for (let m = SEASON.windowFrom.getMonth(); m <= SEASON.windowTo.getMonth(); m++) months.push(m);
    root.innerHTML = months.map(m => {
      const first = new Date(Y, m, 1), n = new Date(Y, m + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < n; i++) {
        const x = addDays(first, i);
        const inS = inSeason(x);
        const lv = inS ? level(inCamp(x)) : 0;
        const cls = ['strip__day', inS ? `is-${lv}` : 'is-out', same(x, SEASON.today) ? 'is-today' : '', x.getDay() === SEASON.dayOff ? 'is-off' : ''].filter(Boolean).join(' ');
        const label = inS ? `${x.getDate()} ${MONTHS[m]} — ${LEVEL_LABEL[lv]}` : `${x.getDate()} ${MONTHS[m]} — вне сезона`;
        cells.push(`<i class="${cls}" title="${label}"></i>`);
      }
      return `<div class="strip__month"><b>${MONTHS_NOM[m]}</b><div class="strip__days">${cells.join('')}</div></div>`;
    }).join('') + `<div class="strip__legend"><span>свободно</span><i class="is-1"></i><i class="is-2"></i><i class="is-3"></i><i class="is-4"></i><span>людно</span><span class="strip__today"><i></i>сегодня</span></div>`;
  }

  // ---------- Date inputs (apply form) ----------
  // Native date pickers: min/max = season bounds, hint shows length, limits and how full the camp
  // will be. Keeps the form light; the big calendar lives elsewhere.
  function watchDates(ids) {
    const fromEl = document.getElementById(ids.from), toEl = document.getElementById(ids.to), hint = document.getElementById(ids.hint);
    fromEl.min = toEl.min = iso(SEASON.start); fromEl.max = toEl.max = iso(SEASON.end);
    const base = hint.innerHTML;
    function update() {
      const f = fromEl.value ? new Date(fromEl.value + 'T00:00:00') : null, t = toEl.value ? new Date(toEl.value + 'T00:00:00') : null;
      if (f) toEl.min = iso(addDays(f, SEASON.minDays - 1));
      if (!f || !t || t <= f) { hint.innerHTML = base; hint.classList.remove('is-warn'); return; }
      const n = days(f, t) + 1;
      let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, inCamp(addDays(f, i)));
      const warn = n < SEASON.minDays ? `минимум ${SEASON.minDays} дней` : n > SEASON.maxDays ? `максимум ${SEASON.maxDays} дней` : peak >= SEASON.capacity ? 'на часть дат мест нет — запишем в лист ожидания' : '';
      hint.innerHTML = `<b>${fmtShort(f)} — ${fmtShort(t)}</b> · ${n} дн. · в лагере будет до ${peak} чел.` + (warn ? ` · <span class="warn">${warn}</span>` : '');
      hint.classList.toggle('is-warn', !!warn);
    }
    fromEl.addEventListener('change', update); toEl.addEventListener('change', update); update();
  }

  window.Season = {
    data: SEASON,
    render(ids) {
      // Facts first: watchDates snapshots the hint's HTML, so the spans must already be filled.
      document.querySelectorAll('[data-season-fact]').forEach(el => {
        const k = el.dataset.seasonFact;
        el.textContent = k === 'range' ? `${fmt(SEASON.start)} — ${fmt(SEASON.end)}` : k === 'days' ? `от ${SEASON.minDays} до ${SEASON.maxDays} дней` : k === 'capacity' ? `до ${SEASON.capacity} человек` : '';
      });
      if (ids.calendar) renderCalendar(document.getElementById(ids.calendar));
      if (ids.events) renderEvents(document.getElementById(ids.events));
      if (ids.strip) renderStrip(document.getElementById(ids.strip));
      if (ids.dates) watchDates(ids.dates);
    },
  };
})();
