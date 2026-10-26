/*
 * '그림부터' 워크시트 → 결과물 설계안 → GPT 프롬프트
 * - 답을 일부만 써도 동작하고, 빈 항목은 [추가 확인 필요]로 표시합니다.
 * - 시각화 추천은 3번 답의 낱말(과정, 학교, 성과…)을 보고 고르는 단순한 규칙입니다.
 */
(function () {
  var MISSING = '[추가 확인 필요]';

  // '배민 예시로 채워보기'에 쓰는 교육용 가상 예시
  var EXAMPLE = {
    1: '배민(가상 예시) CSR 담당자와 임원',
    2: '‘우리가 후원한 사업이 이렇게 체계적으로 진행됐구나!’',
    3: '사업을 왜 시작했는지\n기획부터 실행까지의 진행 과정\n참여 학교와 학교별 지원 현황\n주요 성과와 현장 사례\n사업으로 달라진 점과 시사점',
    4: 'input/business_plan/ 사업계획서\ninput/results/ 결과보고 초안, 일정표\ninput/data/ 학교별 실적 엑셀, 학교 주소\ninput/photos/ 현장 사진 (공개 동의 확인된 것)',
    5: '짧은 배경 설명 + 핵심 문장 한 줄\n타임라인 (단계·담당 주체)\n지도 + 학교 클릭 시 정보 카드\n핵심 수치 카드 + 사진 사례\n요약 카드',
    6: '월드비전 오렌지 포인트, 깔끔하지만 따뜻한 분위기, 챕터별 웹페이지'
  };

  // 3번 답의 낱말로 고르는 시각화 추천
  var VIZ_RULES = [
    { words: ['과정', '진행', '단계', '일정', '절차', '흐름'], viz: '타임라인 또는 프로세스 다이어그램' },
    { words: ['학교', '지역', '위치', '어디', '기관'], viz: '지도 + 클릭 시 정보 카드 (검증된 위치 정보만 표시)' },
    { words: ['성과', '실적', '수치', '규모', '결과', '데이터'], viz: '핵심 수치 카드 (필요하면 그래프)' },
    { words: ['사진', '현장', '사례', '변화', '이야기'], viz: '사진 + 캡션, 사례 카드 (가명 사용)' },
    { words: ['배경', '왜', '목적', '문제'], viz: '프롤로그: 짧은 배경 설명 + 핵심 문장' },
    { words: ['시사점', '의미', '달라진', '다음'], viz: '요약 카드 + 다음 계획' }
  ];

  function lines(v) {
    return (v || '').split('\n').map(function (t) { return t.trim(); }).filter(Boolean);
  }
  function suggestViz(text) {
    var hit = VIZ_RULES.filter(function (r) { return r.words.some(function (w) { return text.indexOf(w) !== -1; }); });
    return hit.length ? hit[0].viz : null;
  }

  window.WORKSHEET_EXAMPLE = EXAMPLE;

  window.buildDesignPlan = function (a) {
    var readers = (a[1] || '').trim();
    var impression = (a[2] || '').trim();
    var contents = lines(a[3]);
    var sources = lines(a[4]);
    var ways = lines(a[5]);
    var design = (a[6] || '').trim();

    var chapters = contents.map(function (c, i) {
      var how = ways[i] || suggestViz(c);
      return '챕터 ' + (i + 1) + '. ' + c + ' → ' + (how ? how + (ways[i] ? '' : ' (자동 추천)') : '표현 방식 ' + MISSING);
    });
    var viz = [];
    contents.forEach(function (c, i) {
      var v = ways[i] || suggestViz(c);
      if (v && viz.indexOf(v) === -1) viz.push(v);
    });

    var todo = [];
    if (!readers) todo.push('누가 보는지 (핵심 독자)');
    if (!impression) todo.push('보는 사람이 느꼈으면 하는 인상');
    if (!contents.length) todo.push('꼭 보여줘야 할 내용 (챕터)');
    if (!sources.length) todo.push('근거 자료의 위치');
    if (!ways.length) todo.push('내용별 표현 방식 (지금은 자동 추천만 있음)');
    if (!design) todo.push('원하는 화면과 분위기');
    if (viz.some(function (v) { return v.indexOf('지도') !== -1; })) todo.push('학교·지역 위치 정보가 원본 자료로 검증됐는지, 외부 공개 시 학교명 공개가 괜찮은지');
    todo.push('모든 수치·일정·기관명은 원본 자료와 대조');

    var purpose = readers && impression
      ? readers + '이(가) 결과보고를 보고 ' + impression + '라고 느끼도록 하는 것'
      : MISSING;
    var message = impression && contents.length
      ? impression + ' — 이 인상이 들도록 ' + contents.join(', ') + '을(를) 근거와 함께 보여준다'
      : MISSING;

    var items = [
      { label: '결과물의 목적', value: purpose },
      { label: '핵심 독자', value: readers || MISSING },
      { label: '전달하고 싶은 인상', value: impression || MISSING },
      { label: '핵심 메시지', value: message },
      { label: '필요한 정보와 근거 자료', value: sources.length ? sources : MISSING },
      { label: '챕터별 구성', value: chapters.length ? chapters : MISSING },
      { label: '추천하는 시각화 방식', value: viz.length ? viz : MISSING },
      { label: '디자인 방향', value: design || MISSING },
      { label: '추가로 확인해야 할 정보', value: todo }
    ];

    var planText = items.map(function (it) {
      var v = Array.isArray(it.value) ? '\n' + it.value.map(function (x) { return '  - ' + x; }).join('\n') : ' ' + it.value;
      return '- ' + it.label + ':' + v;
    }).join('\n');

    var prompt = [
      '아래는 내가 "그림부터 그리는 방식"으로 정리한 결과보고 설계안이야.',
      '이 설계안을 바탕으로, Claude Code에 바로 붙여넣을 수 있는 "실행용 프롬프트"를 작성해줘.',
      '',
      '## 결과물 설계안',
      planText,
      '',
      '## 실행용 프롬프트에 꼭 넣어줄 것',
      '- 화면을 예쁘게 만드는 것보다, 각 챕터가 "전달하고 싶은 인상"을 어떻게 뒷받침하는지 먼저 설계하게 해줘.',
      '- 작업 순서: 원본 자료 검토 → 확인된 정보로 페이지 구성안 제안 → 내가 방향을 확인한 뒤 구현.',
      '- 원본 자료에 없는 수치·사실·사례는 지어내지 말고, 부족한 자료는 목록으로 알려달라고 해줘.',
      '- 확인된 정보와 가상의 예시를 명확히 구분하게 해줘.',
      '- input 폴더 원본은 수정·삭제하지 말고, 결과물은 output 폴더에만 만들게 해줘.',
      '- 아동·참여자 개인정보(실명, 얼굴 식별 사진, 학교·학급 등)가 외부 공개 화면에 나오지 않게 해줘.',
      '- 모바일에서도 읽기 편하고, PDF로 저장해도 잘리지 않게 해줘.',
      '- 설계안에 ' + MISSING + '로 남은 항목은 너도 지어내지 말고, 나에게 물어볼 질문으로 정리해줘.'
    ].join('\n');

    return { items: items, prompt: prompt, missing: MISSING };
  };

  // 의도 기반 수정 프롬프트 (빈칸은 템플릿 자리로 남김)
  window.buildIntentPrompt = function (v) {
    function f(x, ph) { return x && x.trim() ? x.trim() : '[' + ph + ']'; }
    return [
      '처음 의도는 "' + f(v[1], '원래 의도: 보는 사람이 느꼈으면 하는 것') + '"였어.',
      '그런데 지금 화면은 "' + f(v[2], '현재 문제: 그 의도와 어긋나는 부분') + '" 상태야.',
      f(v[3], '유지할 것') + '은(는) 그대로 유지해줘.',
      '대신 ' + f(v[4], '바꿀 것: 구체적으로 어떻게') + '(으)로 바꿔줘.',
      '원본 자료에 없는 내용은 추가하지 말고, 수정한 뒤에는 무엇을 바꿨는지와 처음 의도에 가까워졌는지 짧게 정리해줘.'
    ].join('\n');
  };

  // 지도 설계 예시용 가상 학교 정보 (교육용)
  window.DEMO_SCHOOLS = [
    { name: '가상 학교 A', activity: '도시락 배분 · 영양 교육', support: '[원본 데이터의 지원 실적]' },
    { name: '가상 학교 B', activity: '도시락 배분', support: '[원본 데이터의 지원 실적]' },
    { name: '가상 학교 C', activity: '도시락 배분 · 봉사활동', support: '[원본 데이터의 지원 실적]' },
    { name: '가상 학교 D', activity: '도시락 배분', support: '[원본 데이터의 지원 실적]' }
  ];
})();
