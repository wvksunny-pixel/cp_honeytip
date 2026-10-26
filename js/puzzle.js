/*
 * '그림 → 퍼즐, 5단계' 퍼즐 체험
 * - 조각 5개가 하나의 그림(결과보고서 화면)을 나눠 가집니다. 다 맞추면 한 장의 그림이 돼요.
 * - 단계 문구는 HTML의 #pz-src 목록에서 읽어요. 문구를 바꾸려면 index.html의 그 목록만 고치면 됩니다.
 * - 판 크기: 600 × 400. 위 3조각(200×200), 아래 2조각(300×200).
 */
(function () {
  var root = document.getElementById('puzzle');
  var src = document.getElementById('pz-src');
  if (!root || !src) return;

  var STEPS = Array.prototype.map.call(src.querySelectorAll('li'), function (li) {
    return {
      title: li.querySelector('b').textContent,
      desc: li.querySelector('p').textContent,
      tag: li.dataset.tag,
      piece: li.dataset.piece
    };
  });

  /* ── 조각 모양: 이웃 조각과 같은 곡선을 써서 돌기와 홈이 정확히 맞물려요 ── */
  // 가로선 위 돌기. c: 돌기 중심, s: +1이면 아래로 / -1이면 위로 볼록, dir: 진행 방향
  function knobH(c, y, s, dir) {
    return ['L', c - dir * 12, y,
      'C', c - dir * 12, y + s * 10, c - dir * 24, y + s * 14, c - dir * 24, y + s * 26,
      'C', c - dir * 24, y + s * 40, c + dir * 24, y + s * 40, c + dir * 24, y + s * 26,
      'C', c + dir * 24, y + s * 14, c + dir * 12, y + s * 10, c + dir * 12, y];
  }
  // 세로선 위 돌기. s: +1이면 오른쪽 / -1이면 왼쪽으로 볼록
  function knobV(c, x, s, dir) {
    return ['L', x, c - dir * 12,
      'C', x + s * 10, c - dir * 12, x + s * 14, c - dir * 24, x + s * 26, c - dir * 24,
      'C', x + s * 40, c - dir * 24, x + s * 40, c + dir * 24, x + s * 26, c + dir * 24,
      'C', x + s * 14, c + dir * 24, x + s * 10, c + dir * 12, x, c + dir * 12];
  }
  function edge(x1, y1, x2, y2, knobs) {
    var out = [];
    var horiz = y1 === y2;
    var dir = horiz ? Math.sign(x2 - x1) : Math.sign(y2 - y1);
    (knobs || []).slice().sort(function (a, b) { return dir * (a.at - b.at); }).forEach(function (k) {
      out = out.concat(horiz ? knobH(k.at, y1, k.s, dir) : knobV(k.at, x1, k.s, dir));
    });
    return out.concat(['L', x2, y2]);
  }
  function outline(x, y, parts) {
    return ['M', x, y].concat.apply(['M', x, y], parts).concat('Z').join(' ');
  }

  // 맞물리는 곳: 1↔2(오른쪽), 2↔3, 1↔4, 2↔4, 3↔5, 4↔5
  var PIECES = [
    { d: outline(0, 0, [edge(0, 0, 200, 0), edge(200, 0, 200, 200, [{ at: 100, s: 1 }]), edge(200, 200, 0, 200, [{ at: 100, s: 1 }]), edge(0, 200, 0, 0)]),
      cx: 100, cy: 96, tag: [10, 164], from: [-70, -50, -10] },
    { d: outline(200, 0, [edge(200, 0, 400, 0), edge(400, 0, 400, 200, [{ at: 100, s: -1 }]), edge(400, 200, 200, 200, [{ at: 250, s: -1 }]), edge(200, 200, 200, 0, [{ at: 100, s: 1 }])]),
      cx: 300, cy: 90, tag: [212, 10], from: [0, -80, 7] },
    { d: outline(400, 0, [edge(400, 0, 600, 0), edge(600, 0, 600, 200), edge(600, 200, 400, 200, [{ at: 500, s: -1 }]), edge(400, 200, 400, 0, [{ at: 100, s: -1 }])]),
      cx: 506, cy: 96, tag: [412, 10], from: [80, -50, 10] },
    { d: outline(0, 200, [edge(0, 200, 300, 200, [{ at: 100, s: 1 }, { at: 250, s: -1 }]), edge(300, 200, 300, 400, [{ at: 300, s: 1 }]), edge(300, 400, 0, 400), edge(0, 400, 0, 200)]),
      cx: 150, cy: 306, tag: [132, 210], from: [-80, 60, -7] },
    { d: outline(300, 200, [edge(300, 200, 600, 200, [{ at: 500, s: -1 }]), edge(600, 200, 600, 400), edge(600, 400, 300, 400), edge(300, 400, 300, 200, [{ at: 300, s: 1 }])]),
      cx: 458, cy: 306, tag: [312, 210], from: [80, 60, 9] }
  ];

  /* ── 완성 그림: 결과보고서 화면 한 장. 조각마다 자기 자리만 잘라 보여줘요 ── */
  var ART =
    '<rect width="600" height="400" fill="#fffdf9"/>' +
    // 1 목표·핵심 메시지
    '<rect width="200" height="200" fill="#ffe7d3"/>' +
    '<circle cx="16" cy="16" r="4" fill="#ff6b00"/><circle cx="30" cy="16" r="4" fill="#e8c6a8"/><circle cx="44" cy="16" r="4" fill="#e8c6a8"/>' +
    '<text x="22" y="48" class="a-kicker">2026 결과보고</text>' +
    '<rect x="22" y="60" width="150" height="14" rx="7" fill="#2d2926"/>' +
    '<rect x="22" y="82" width="104" height="14" rx="7" fill="#2d2926"/>' +
    '<circle cx="132" cy="134" r="30" fill="#ff6b00"/><circle cx="132" cy="134" r="20" fill="#fff"/><circle cx="132" cy="134" r="10" fill="#ff6b00"/>' +
    '<path d="M86 108 L126 130" stroke="#2d2926" stroke-width="4" stroke-linecap="round"/><path d="M118 122 L128 132 L114 133 Z" fill="#2d2926"/>' +
    // 2 주요 장면과 정보
    '<rect x="200" width="200" height="200" fill="#fff6ec"/>' +
    '<rect x="226" y="44" width="148" height="88" rx="8" fill="#ffd2ad"/>' +
    '<circle cx="344" cy="66" r="11" fill="#fff"/>' +
    '<path d="M226 132 L268 88 L298 116 L326 94 L374 132 Z" fill="#e85d00" opacity=".85"/>' +
    '<rect x="226" y="146" width="120" height="9" rx="4.5" fill="#cbb8a6"/><rect x="226" y="162" width="84" height="9" rx="4.5" fill="#e0d2c4"/>' +
    // 3 원본 자료·사진·데이터
    '<rect x="400" width="200" height="200" fill="#f3ece4"/>' +
    '<rect x="428" y="38" width="32" height="14" rx="4" fill="#ffb27a"/><rect x="428" y="46" width="72" height="50" rx="6" fill="#ffb27a"/>' +
    '<rect x="512" y="38" width="62" height="78" rx="6" fill="#fff" stroke="#d9cdc0" stroke-width="2"/>' +
    '<rect x="522" y="54" width="42" height="6" rx="3" fill="#d9cdc0"/><rect x="522" y="68" width="34" height="6" rx="3" fill="#d9cdc0"/><rect x="522" y="82" width="40" height="6" rx="3" fill="#d9cdc0"/>' +
    '<rect x="428" y="126" width="146" height="58" rx="6" fill="#fff" stroke="#d9cdc0" stroke-width="2"/>' +
    '<rect x="477" y="127" width="48" height="19" fill="#ffe7d3"/>' +
    '<path d="M477 126 V184 M526 126 V184 M428 146 H574 M428 165 H574" stroke="#d9cdc0" stroke-width="2"/>' +
    // 4 웹페이지 구성과 시각화: 타임라인 · 그래프 · 지도
    '<rect y="200" width="300" height="200" fill="#fff0e4"/>' +
    '<path d="M28 252 H276" stroke="#2d2926" stroke-width="3"/>' +
    '<circle cx="44" cy="252" r="8" fill="#ff6b00"/><circle cx="112" cy="252" r="8" fill="#ff6b00"/><circle cx="180" cy="252" r="8" fill="#ff6b00"/><circle cx="248" cy="252" r="8" fill="#2d2926"/>' +
    '<rect x="30" y="322" width="22" height="54" rx="3" fill="#ffb27a"/><rect x="60" y="300" width="22" height="76" rx="3" fill="#ff6b00"/>' +
    '<rect x="90" y="332" width="22" height="44" rx="3" fill="#ffb27a"/><rect x="120" y="290" width="22" height="86" rx="3" fill="#ff6b00"/>' +
    '<path d="M24 377 H150" stroke="#2d2926" stroke-width="2"/>' +
    '<path d="M180 312 q30-24 62-8 q34 6 40 34 q4 32-30 42 q-40 8-60-12 q-24-22-12-56z" fill="#ffd2ad"/>' +
    '<circle cx="230" cy="322" r="13" fill="#2d2926"/><circle cx="230" cy="322" r="5" fill="#fff"/><path d="M218 327 L242 327 L230 350 Z" fill="#2d2926"/>' +
    // 5 검토와 수정, 최종 완성
    '<rect x="300" y="200" width="300" height="200" fill="#2d2926"/>' +
    '<g fill="#ff6b00"><circle cx="374" cy="258" r="11"/><circle cx="374" cy="294" r="11"/><circle cx="374" cy="330" r="11"/></g>' +
    '<path d="M368 258 l4 4 l8 -8 M368 294 l4 4 l8 -8 M368 330 l4 4 l8 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="394" y="252" width="96" height="12" rx="6" fill="#f7ede4"/><rect x="394" y="288" width="76" height="12" rx="6" fill="#f7ede4"/><rect x="394" y="324" width="88" height="12" rx="6" fill="#f7ede4"/>' +
    '<g transform="rotate(-12 536 318)"><circle cx="536" cy="318" r="42" fill="none" stroke="#ffb27a" stroke-width="4"/>' +
    '<text x="536" y="326" text-anchor="middle" class="a-stamp">완성!</text></g>';

  var svg = document.getElementById('pz-svg');
  var html = '<defs><g id="pz-art">' + ART + '</g>';
  PIECES.forEach(function (p, i) { html += '<clipPath id="pz-clip' + i + '"><path d="' + p.d + '"/></clipPath>'; });
  html += '</defs><g class="pz-slots">';
  PIECES.forEach(function (p, i) {
    html += '<g class="pz-slot" data-i="' + i + '"><path class="pz-slot-shape" d="' + p.d + '"/>' +
      '<g class="pz-slot-label"><circle cx="' + p.cx + '" cy="' + (p.cy - 14) + '" r="22"/>' +
      '<text class="pz-slot-num" x="' + p.cx + '" y="' + (p.cy - 5) + '">' + (i + 1) + '</text>' +
      '<text class="pz-slot-tag" x="' + p.cx + '" y="' + (p.cy + 34) + '">' + STEPS[i].tag + '</text></g></g>';
  });
  html += '</g><g class="pz-pieces">';
  PIECES.forEach(function (p, i) {
    html += '<g class="pz-piece" data-i="' + i + '" style="--dx:' + p.from[0] + 'px;--dy:' + p.from[1] + 'px;--r:' + p.from[2] + 'deg">' +
      '<use href="#pz-art" clip-path="url(#pz-clip' + i + ')"/>' +
      '<path class="pz-veil" d="' + p.d + '"/>' +
      '<path class="pz-edge" d="' + p.d + '"/>' +
      '<g class="pz-tag" transform="translate(' + p.tag[0] + ' ' + p.tag[1] + ')"><rect height="26" rx="13"/>' +
      '<text x="11" y="18"><tspan class="n">' + (i + 1) + '</tspan>  ' + STEPS[i].tag + '</text></g></g>';
  });
  html += '</g>';
  svg.insertAdjacentHTML('beforeend', html);

  // 준비되면 퍼즐을 보여주고, JS가 없을 때 쓰는 카드 목록은 숨겨요 (글자 길이를 재려면 먼저 보여야 해요)
  src.hidden = true;
  root.hidden = false;

  // 태그 배경을 글자 길이에 맞추기
  svg.querySelectorAll('.pz-tag').forEach(function (g) {
    g.querySelector('rect').setAttribute('width', g.querySelector('text').getComputedTextLength() + 22);
  });

  /* ── 진행 상태 ── */
  var pieces = svg.querySelectorAll('.pz-piece');
  var slots = svg.querySelectorAll('.pz-slot');
  var $ = function (id) { return document.getElementById(id); };
  var textBox = $('pz-text'), stepBox = $('pz-step'), doneBox = $('pz-done');
  var swapTimer;
  var btnPrev = $('pz-prev'), btnNext = $('pz-next'), btnReset = $('pz-reset'), linkEx = $('pz-example');
  var dots = $('pz-dots');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  dots.innerHTML = STEPS.map(function (s, i) { return '<li><span>' + (i + 1) + '</span></li>'; }).join('');
  var dotEls = dots.querySelectorAll('li');

  var placed = [false, false, false, false, false];
  var view = 0; // 0~4: 단계 화면, 5: 완성 화면

  function count() { return placed.filter(Boolean).length; }

  function renderText() {
    if (view < 5) {
      var s = STEPS[view];
      $('pz-num').textContent = (view + 1) + '단계 / 5';
      $('pz-title').textContent = s.title;
      $('pz-desc').textContent = s.desc;
      $('pz-piece').innerHTML = '이 조각 → <b>' + s.piece + '</b>';
    }
  }

  function render(swap) {
    var n = count();
    pieces.forEach(function (p, i) { p.classList.toggle('placed', placed[i]); });
    slots.forEach(function (s, i) {
      s.classList.toggle('filled', placed[i]);
      s.classList.toggle('current', i === view && !placed[i]);
    });
    dotEls.forEach(function (d, i) {
      d.classList.toggle('done', placed[i]);
      d.classList.toggle('now', i === view);
    });
    var pct = n * 20;
    $('pz-bar').style.width = pct + '%';
    $('pz-pct').textContent = pct + '%';
    root.querySelector('.pz-bar').setAttribute('aria-valuenow', pct);

    var done = view === 5;
    root.classList.toggle('is-complete', done);
    btnPrev.disabled = view === 0;
    btnNext.hidden = done;
    btnReset.hidden = !done;
    linkEx.hidden = !done;
    if (!done) {
      btnNext.textContent = placed[view]
        ? (view === 4 ? '완성 그림 보기 →' : '다음 단계 →')
        : (view === 4 ? '마지막 조각 맞추기' : '다음 조각 맞추기');
    }

    // 단계 문구는 살짝 사라졌다가 바뀌어요
    function showText() {
      stepBox.hidden = done;
      doneBox.hidden = !done;
      renderText();
    }
    if (swap && !reduceMotion) {
      textBox.classList.add('is-swapping');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(function () {
        showText();
        textBox.classList.remove('is-swapping');
      }, 170);
    } else {
      showText();
    }
  }

  function snap(i) {
    var p = pieces[i];
    if (reduceMotion) return;
    setTimeout(function () {
      p.classList.add('snap');
      setTimeout(function () { p.classList.remove('snap'); }, 200);
    }, 400);
  }

  btnNext.addEventListener('click', function () {
    if (view >= 5) return;
    if (!placed[view]) { placed[view] = true; snap(view); }
    view = view + 1;
    render(true);
    if (view === 5) setTimeout(function () { btnReset.focus(); }, reduceMotion ? 0 : 200);
  });
  btnPrev.addEventListener('click', function () {
    if (view === 0) return;
    var wasDone = view === 5;
    view -= 1; // 이미 맞춘 조각은 그대로 둬요
    render(true);
    if (wasDone) btnNext.focus();
  });
  btnReset.addEventListener('click', function () {
    placed = [false, false, false, false, false];
    view = 0;
    render(true);
    btnNext.focus();
  });

  render(false);
})();
