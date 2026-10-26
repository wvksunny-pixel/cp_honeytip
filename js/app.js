/*
 * 페이지 동작: 메뉴, 설치 탭, 추구미 선택 → 프롬프트 생성, 복사 버튼, 체크리스트
 */
(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // 브라우저 저장소는 막혀 있을 수 있으므로 항상 try/catch
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('gipa-guide:' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('gipa-guide:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ── 제작기: 실제 입력값 채우기 ── */
  if (window.MAKING_OF) {
    $('#mk-raw').textContent = MAKING_OF.RAW_TO_GPT;
    $('#mk-brief').textContent = MAKING_OF.GPT_BRIEF;
    $('#mk-brief-len').textContent = '(약 ' + MAKING_OF.GPT_BRIEF.length.toLocaleString() + '자)';
    $('#mk-upgrade').textContent = MAKING_OF.UPGRADE_BRIEF;
    $('#mk-up-len').textContent = '(약 ' + MAKING_OF.UPGRADE_BRIEF.length.toLocaleString() + '자)';
  }

  /* ── 토스트 ── */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  /* ── 복사 (클립보드 API가 막힌 환경을 위한 대체 방법 포함) ── */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }
  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }
  function markCopied(btn) {
    var original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = '복사됨 ✓';
    btn.classList.add('copied');
    setTimeout(function () { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var text = btn.dataset.copy;
    if (text == null && btn.dataset.copyTarget) {
      // <pre>는 접혀 있어도(innerText가 비어도) 원문 그대로 복사되도록 textContent 사용
      var target = $('#' + btn.dataset.copyTarget);
      text = target.tagName === 'PRE' ? target.textContent : target.innerText;
    }
    copyText(text).then(function () { markCopied(btn); toast('클립보드에 복사했어요'); },
      function () { toast('복사가 막혀 있어요. 글자를 직접 드래그해서 복사해 주세요.'); });
  });

  /* ── 상단 메뉴: 그룹 펼치기 + 모바일 메뉴 ── */
  var menuBtn = $('.menu-toggle');
  var nav = $('#nav');
  var groups = $$('.nav-group', nav);

  function closeGroups(except) {
    groups.forEach(function (g) {
      if (g === except) return;
      g.classList.remove('open');
      $('.nav-top', g).setAttribute('aria-expanded', 'false');
    });
  }
  function closeMobile() {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  groups.forEach(function (g) {
    $('.nav-top', g).addEventListener('click', function () {
      var open = g.classList.toggle('open');
      this.setAttribute('aria-expanded', String(open));
      closeGroups(g);
    });
  });
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { closeGroups(); closeMobile(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-group')) closeGroups();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeGroups(); closeMobile(); }
  });

  /* ── 지금 보고 있는 곳 표시 (메뉴 강조 + '현재 위치') ── */
  var navLinks = $$('.nav-panel a', nav);
  var where = $('#nav-where');
  function markCurrent(href) {
    var link = null;
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === href;
      a.classList.toggle('active', on);
      if (on) link = a;
    });
    groups.forEach(function (g) { g.classList.toggle('is-current', !!link && g.contains(link)); });
    if (!link) { where.textContent = ''; return; }
    var group = link.closest('.nav-group');
    var groupName = $('.nav-top', group).firstChild.textContent.trim();
    var num = $('i', link);
    var n = num && /^\d+$/.test(num.textContent) ? num.textContent + '. ' : '';
    where.innerHTML = escapeHtml(groupName) + ' › <b>' + n + escapeHtml($('b', link).textContent) + '</b>';
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) markCurrent(en.target.dataset.nav); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[data-nav]').forEach(function (sec) { io.observe(sec); });
  }

  /* ── 설치 탭 ── */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        $$('[data-panel]', box).forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
      });
    });
  });

  /* ── 체크리스트 (진행률 + 저장) ── */
  function setupChecklist(name, onChange) {
    var boxes = $$('[data-checklist="' + name + '"] input[type="checkbox"]');
    var counter = $('[data-count-for="' + name + '"]');
    var saved = store.get('check-' + name) || [];
    boxes.forEach(function (b, i) { b.checked = !!saved[i]; });
    function update() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      counter.textContent = done + ' / ' + boxes.length;
      boxes.forEach(function (b) { b.closest('li').classList.toggle('done', b.checked); });
      store.set('check-' + name, boxes.map(function (b) { return b.checked; }));
      if (onChange) onChange(done, boxes.length);
    }
    boxes.forEach(function (b) { b.addEventListener('change', update); });
    update();
    return { reset: function () { boxes.forEach(function (b) { b.checked = false; }); update(); } };
  }
  setupChecklist('hw');
  setupChecklist('ing');
  var finalList = setupChecklist('final', function (done, total) {
    $('#final-bar').style.width = (done / total * 100) + '%';
    $('#final-done').hidden = done !== total;
  });
  $('#reset-final').addEventListener('click', function () { finalList.reset(); });

  /* ── 여러분은 어떤 스타일인가요? (A 그림부터 / B 일단 만들기 / C 둘 다) ── */
  var styleSec = $('#mystyle');
  var wsIds = [1, 2, 3, 4, 5, 6];

  function readApproach() {
    return ($('input[name="approach"]:checked', styleSec) || {}).value || 'A';
  }
  function readWorksheet() {
    var a = {};
    wsIds.forEach(function (n) { a[n] = $('#ws-' + n).value; });
    return a;
  }
  function escapeHtml(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function renderApproach() {
    var ap = readApproach();
    $$('.approach-card', styleSec).forEach(function (l) { l.classList.toggle('is-selected', $('input', l).checked); });
    $$('[data-approach-panel]', styleSec).forEach(function (p) { p.hidden = p.dataset.approachPanel !== ap; });

    var ws = readWorksheet();
    var plan = buildDesignPlan(ws);
    $('#design-plan').innerHTML = plan.items.map(function (it) {
      var v = it.value;
      var body = Array.isArray(v)
        ? '<ul>' + v.map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('') + '</ul>'
        : escapeHtml(v);
      var missing = v === plan.missing ? ' class="missing"' : '';
      return '<div' + missing + '><dt>' + it.label + '</dt><dd>' + body + '</dd></div>';
    }).join('');
    $('#plan-prompt').textContent = plan.prompt;

    store.set('approach', ap);
    store.set('worksheet', ws);
  }

  (function restoreApproach() {
    var ap = store.get('approach');
    var el = ap && $('input[name="approach"][value="' + ap + '"]', styleSec);
    if (el) el.checked = true;
    var ws = store.get('worksheet');
    if (ws) wsIds.forEach(function (n) { if (typeof ws[n] === 'string') $('#ws-' + n).value = ws[n]; });
  })();

  $('#ws-example').addEventListener('click', function () {
    wsIds.forEach(function (n) { $('#ws-' + n).value = WORKSHEET_EXAMPLE[n]; });
    styleSec.dispatchEvent(new Event('input'));
    toast('교육용 가상 예시로 채웠어요');
  });
  $('#ws-clear').addEventListener('click', function () {
    wsIds.forEach(function (n) { $('#ws-' + n).value = ''; });
    styleSec.dispatchEvent(new Event('input'));
  });
  $('#copy-plan-prompt').addEventListener('click', function () {
    var btn = this;
    copyText($('#plan-prompt').textContent).then(function () {
      markCopied(btn);
      $('#plan-copy-guide').hidden = false;
    }, function () { toast('복사가 막혀 있어요. 프롬프트를 직접 드래그해서 복사해 주세요.'); });
  });

  /* ── 지도 설계 예시 (가상 학교) ── */
  $$('.pin').forEach(function (pin) {
    pin.addEventListener('click', function () {
      var s = DEMO_SCHOOLS[+pin.dataset.school];
      $$('.pin').forEach(function (p) { p.classList.toggle('active', p === pin); });
      $('#school-card').innerHTML =
        '<p class="sc-name">' + s.name + ' <span class="badge-ex">가상</span></p>' +
        '<p><b>활동</b> ' + s.activity + '</p>' +
        '<p><b>지원 현황</b> ' + s.support + '</p>' +
        '<p class="tiny muted">실제로는 원본 엑셀의 학교별 실적을 그대로 연결해요.</p>';
    });
  });

  /* ── 의도 기반 수정 프롬프트 만들기 ── */
  var ibSec = $('.intent-builder');
  function renderIntent() {
    var v = {};
    [1, 2, 3, 4].forEach(function (n) { v[n] = $('#ib-' + n).value; });
    $('#ib-out').textContent = buildIntentPrompt(v);
  }
  ibSec.addEventListener('input', renderIntent);
  renderIntent();

  /* ── 추구미 선택 → 프롬프트 생성 ── */
  var form = $('#step3');
  var textIds = { project: 'in-project', partner: 'in-partner', period: 'in-period', folder: 'in-folder', extra: 'in-extra' };

  function readState() {
    var s = {
      style: ($('input[name="style"]:checked', form) || {}).value || 'A',
      mood: ($('input[name="mood"]:checked', form) || {}).value || 'story',
      structure: ($('input[name="structure"]:checked', form) || {}).value || 'chapters',
      data: $$('input[name="data"]:checked', form).map(function (i) { return i.value; }),
      usage: $$('input[name="usage"]:checked', form).map(function (i) { return i.value; })
    };
    Object.keys(textIds).forEach(function (k) { s[k] = $('#' + textIds[k]).value; });
    s.approach = readApproach();
    s.ws = readWorksheet();
    return s;
  }

  function restoreState() {
    var s = store.get('choices');
    if (!s) return;
    ['style', 'mood', 'structure'].forEach(function (k) {
      var el = $('input[name="' + k + '"][value="' + s[k] + '"]', form);
      if (el) el.checked = true;
    });
    ['data', 'usage'].forEach(function (k) {
      if (!Array.isArray(s[k])) return;
      $$('input[name="' + k + '"]', form).forEach(function (i) { i.checked = s[k].indexOf(i.value) !== -1; });
    });
    Object.keys(textIds).forEach(function (k) { if (typeof s[k] === 'string') $('#' + textIds[k]).value = s[k]; });
  }

  var chipLabels = {
    structure: { single: '단일 페이지', chapters: '챕터별 웹페이지' },
    data: { kpi: '핵심 수치', chart: '그래프', map: '지도', timeline: '타임라인' },
    usage: { web: '웹 링크', pdf: 'PDF', archive: '내부 아카이빙' }
  };

  function render() {
    var s = readState();
    store.set('choices', s);

    // 선택된 카드/칩 강조 (:has 미지원 브라우저 대비)
    $$('.style-card, .chip', form).forEach(function (l) {
      l.classList.toggle('is-selected', $('input', l).checked);
    });

    var chips = [PROMPT_LABELS.approach(s.approach), PROMPT_LABELS.style(s.style), PROMPT_LABELS.mood(s.mood), chipLabels.structure[s.structure]]
      .concat(s.data.map(function (k) { return chipLabels.data[k]; }))
      .concat(s.usage.map(function (k) { return chipLabels.usage[k]; }));
    $('#summary-chips').innerHTML = chips.map(function (c) { return '<span>' + c + '</span>'; }).join('');

    $('#prompt-out').textContent = buildPrompt(s);
  }

  restoreState();
  form.addEventListener('change', render);
  form.addEventListener('input', render);
  ['change', 'input'].forEach(function (ev) {
    styleSec.addEventListener(ev, function () { renderApproach(); render(); });
  });
  renderApproach();
  render();

  /* ── 긴 화면에서 이어 읽기: 섹션 끝 '다음' 링크 + 읽기 진행 막대 ── */
  var flowSecs = $$('main > section.section');
  flowSecs.forEach(function (sec, i) {
    var next = flowSecs[i + 1];
    if (!next) return;
    var title = $('.section-title', next);
    var a = document.createElement('a');
    a.className = 'next-link';
    a.href = '#' + next.id;
    a.innerHTML = '<span>다음</span>' + escapeHtml(title ? title.textContent : '') + ' →';
    $('.wrap', sec).appendChild(a);
  });
  var bar = $('#read-progress');
  function updateProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  $('#copy-prompt').addEventListener('click', function () {
    var btn = this;
    copyText($('#prompt-out').textContent).then(function () {
      markCopied(btn);
      $('#copy-guide').hidden = false;
    }, function () { toast('복사가 막혀 있어요. 프롬프트를 직접 드래그해서 복사해 주세요.'); });
  });
})();
