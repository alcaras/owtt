/* ============================================================
   Old World Tech Tree — Phone surface
   Vanilla JS, single-instance, shares localStorage + URL params
   with the desktop redesign.
   ============================================================ */
(function(){
  'use strict';

  const TD = window.techData;
  const ND = window.nationData;
  const NL = window.nationLookup;

  // ---- state (mirrors the desktop redesign's state shape)
  let selectedNation = '';
  let researchOrder = [];           // mixed: main tech IDs and bonus IDs, in click order
  let researchedTechs = [];         // main tech IDs (derived from researchOrder)
  let researchedBonusTechs = [];    // bonus tech IDs (derived from researchOrder)
  let completedTechs = [];          // overlay of "actually researched in current game"

  const techById = new Map(TD.techs.map(t => [t.id, t]));
  const bonusById = new Map(TD.bonusTechs.map(b => [b.id, b]));

  function rebuildDerived(){
    researchedTechs = researchOrder.filter(id => techById.has(id));
    researchedBonusTechs = researchOrder.filter(id => bonusById.has(id));
  }

  const STORAGE_KEY = 'owtt-redesign';

  function techIconPath(tech){
    return `img/icons/techs/${tech.id.replace(/^TECH_/, '').toLowerCase()}.png`;
  }
  function bonusIconPath(bt){
    if (bt.iconName) return `img/icons/bonus/${bt.iconName.toLowerCase()}.png`;
    if (bt.parent){
      const parent = techById.get(bt.parent);
      if (parent) return techIconPath(parent);
    }
    return 'img/icons/yields/science.png';
  }
  function fmt(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function isStarting(techId){
    return !!selectedNation && (ND.startingTechs[selectedNation] || []).includes(techId);
  }
  function getAllPrereqs(techId, acc = new Set()){
    const t = techById.get(techId);
    if (!t) return acc;
    for (const p of (t.prereqs || [])){
      if (!acc.has(p)){ acc.add(p); getAllPrereqs(p, acc); }
    }
    return acc;
  }
  function summarizeUnlocks(tech){
    const u = tech.unlocks || {};
    const parts = [];
    (u.units || []).forEach(x => parts.push(x));
    (u.improvements || []).slice(0, 2).forEach(x => parts.push(x));
    (u.laws || []).slice(0, 2).forEach(x => parts.push(x));
    (u.projects || []).slice(0, 2).forEach(x => parts.push(x));
    return parts.length ? parts.slice(0, 4).join(' · ') : '—';
  }

  // ---- persistence
  function saveState(){
    rebuildDerived();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        researchedTechs: researchedTechs.slice(),
        researchOrder: researchOrder.slice(),
        researchedBonusTechs: researchedBonusTechs.slice(),
        completedTechs: completedTechs.slice(),
        selectedNation,
      }));
    } catch(e){}
    updateURL();
  }
  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      selectedNation = o.selectedNation || '';
      const order = Array.isArray(o.researchOrder) ? o.researchOrder : [];
      researchOrder = order.filter(id => techById.has(id) || bonusById.has(id));
      completedTechs = Array.isArray(o.completedTechs)
        ? o.completedTechs.filter(id => techById.has(id) || bonusById.has(id))
        : [];
      rebuildDerived();
    } catch(e){}
  }
  function updateURL(){
    const parts = [];
    if (selectedNation){
      const ni = NL.indexOf(selectedNation);
      if (ni > -1) parts.push('n=' + ni);
    }
    if (researchOrder.length){
      const nums = researchOrder.map(id => {
        const mi = TD.techs.findIndex(t => t.id === id);
        if (mi > -1) return mi;
        const bi = TD.bonusTechs.findIndex(b => b.id === id);
        if (bi > -1) return -(bi + 1);
        return null;
      }).filter(n => n !== null);
      if (nums.length) parts.push('o=' + nums.join(','));
    }
    const search = parts.length ? '?' + parts.join('&') : '';
    try { history.replaceState({}, '', location.pathname + search); } catch(e){}
  }
  function loadFromURL(){
    const sp = new URLSearchParams(location.search);
    if (sp.has('n')){
      const ni = parseInt(sp.get('n'), 10);
      if (!isNaN(ni) && NL[ni]) selectedNation = NL[ni];
    }
    if (sp.has('o')){
      const ids = sp.get('o').split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
      researchOrder = [];
      ids.forEach(n => {
        if (n >= 0 && TD.techs[n]) researchOrder.push(TD.techs[n].id);
        else if (n < 0 && TD.bonusTechs[-n - 1]) researchOrder.push(TD.bonusTechs[-n - 1].id);
      });
      rebuildDerived();
    }
  }

  // ---- mutations
  function toggleResearch(techId){
    if (isStarting(techId)) return;
    if (researchOrder.includes(techId)){
      // remove tech, dependent techs, and any bonus cards whose parent is being removed
      const toRemove = new Set([techId]);
      let changed = true;
      while (changed){
        changed = false;
        for (const oid of researchOrder){
          if (toRemove.has(oid)) continue;
          const t = techById.get(oid);
          if (t && (t.prereqs || []).some(p => toRemove.has(p))){
            toRemove.add(oid);
            changed = true;
          }
        }
      }
      const bonusOrphans = researchOrder.filter(id => {
        const b = bonusById.get(id);
        return b && b.parent && toRemove.has(b.parent);
      });
      bonusOrphans.forEach(id => toRemove.add(id));
      researchOrder = researchOrder.filter(id => !toRemove.has(id));
      completedTechs = completedTechs.filter(id => !toRemove.has(id));
    } else {
      const prereqs = [...getAllPrereqs(techId)]
        .filter(id => !researchOrder.includes(id) && !isStarting(id));
      prereqs.sort((a, b) => (techById.get(a)?.cost || 0) - (techById.get(b)?.cost || 0));
      researchOrder.push(...prereqs, techId);
    }
    saveState();
    render();
  }
  function toggleBonus(bonusId){
    const b = bonusById.get(bonusId);
    if (!b) return;
    const have = researchOrder.includes(bonusId);
    if (have){
      researchOrder = researchOrder.filter(id => id !== bonusId);
      completedTechs = completedTechs.filter(id => id !== bonusId);
    } else {
      // Pull in the parent tech (and its prereqs) if needed.
      if (b.parent && !researchOrder.includes(b.parent) && !isStarting(b.parent)){
        const prereqs = [...getAllPrereqs(b.parent)]
          .filter(id => !researchOrder.includes(id) && !isStarting(id));
        prereqs.sort((a, b2) => (techById.get(a)?.cost || 0) - (techById.get(b2)?.cost || 0));
        researchOrder.push(...prereqs, b.parent);
      }
      researchOrder.push(bonusId);
    }
    saveState();
    render();
  }
  function toggleCompleted(id){
    if (isStarting(id)) return;
    if (!researchOrder.includes(id)) return;
    const i = completedTechs.indexOf(id);
    if (i === -1) completedTechs.push(id);
    else completedTechs.splice(i, 1);
    saveState();
    render();
  }
  function clearPlan(){
    researchOrder = [];
    completedTechs = [];
    saveState();
    render();
  }
  function setNation(nid){
    selectedNation = nid || '';
    // Don't auto-clear plan — keep techs that are still valid
    saveState();
    render();
  }
  async function shareLink(){
    updateURL();
    const url = location.href;
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      flashButton(document.getElementById('planShare'), 'Copied!');
    } catch(e){
      flashButton(document.getElementById('planShare'), url);
    }
  }
  function flashButton(btn, text){
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1600);
  }

  // ---- long-press to toggle completed
  function attachLongPress(el, onLong){
    let timer = null, fired = false;
    const start = (e) => {
      fired = false;
      timer = setTimeout(() => { fired = true; onLong(); }, 500);
    };
    const cancel = () => { if (timer){ clearTimeout(timer); timer = null; } };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchmove', cancel);
    el.addEventListener('touchcancel', cancel);
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; start(e); });
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointermove', cancel);
    el.addEventListener('contextmenu', e => { e.preventDefault(); onLong(); });
    return () => fired;
  }

  // ---- render
  const $body = document.getElementById('body');
  const $totalPill = document.getElementById('totalPill');
  const $nationLabel = document.getElementById('nationLabel');
  const $nationCrest = document.getElementById('nationCrest');
  const $planSheet = document.getElementById('planSheet');
  const $planList = document.getElementById('planList');
  const $planCost = document.getElementById('planCost');
  const $planTechCount = document.getElementById('planTechCount');

  function techState(t){
    if (isStarting(t.id)) return 'starting';
    if (completedTechs.includes(t.id)) return 'completed';
    if (researchOrder.includes(t.id)) return 'on-path';
    const startingSet = new Set(selectedNation ? (ND.startingTechs[selectedNation] || []) : []);
    const have = new Set([...researchOrder, ...startingSet]);
    const prereqsMet = (t.prereqs || []).every(p => have.has(p));
    return prereqsMet ? 'available' : 'locked';
  }

  const tiers = (() => {
    const byTier = {};
    TD.techs.forEach(t => {
      (byTier[t.column] = byTier[t.column] || { cost: t.cost, items: [] }).items.push(t);
    });
    return Object.keys(byTier).map(Number).sort((a, b) => a - b).map(c => ({
      tier: c,
      cost: byTier[c].cost,
      items: byTier[c].items.slice().sort((a, b) => a.row - b.row),
    }));
  })();

  function bonusCardsForTier(tierItems){
    const tierIds = new Set(tierItems.map(t => t.id));
    return TD.bonusTechs.filter(b => {
      if (b.nation && b.nation !== selectedNation) return false; // hide other nations' cards
      if (b.parent) return tierIds.has(b.parent);
      return false; // nation-only (no-parent) cards handled separately
    });
  }
  function nationOnlyBonusCards(){
    if (!selectedNation) return [];
    return TD.bonusTechs.filter(b => b.nation === selectedNation && !b.parent);
  }

  function bonusState(b){
    if (completedTechs.includes(b.id)) return 'completed';
    if (researchOrder.includes(b.id)) return 'on-path';
    const have = new Set([
      ...researchOrder.filter(id => techById.has(id)),
      ...(selectedNation ? (ND.startingTechs[selectedNation] || []) : []),
    ]);
    const parentMet = b.cultureRequired ? true : (b.parent && have.has(b.parent));
    return parentMet ? 'available' : 'locked';
  }

  function makeTechRow(tech, orderIndex){
    const state = techState(tech);
    const idx = orderIndex[tech.id];
    const free = state === 'starting';
    const row = document.createElement('div');
    row.className = 'ow-tech ' + state;
    row.innerHTML = `
      <div class="ow-tech-icon"><img alt="" /></div>
      <div class="ow-tech-body">
        <p class="ow-tech-name"></p>
        <div class="ow-tech-unlocks"></div>
      </div>
      <div class="ow-tech-meta">
        ${idx ? `<span class="ow-tech-order">${idx}</span>` : ''}
        <span class="ow-tech-cost ${free ? 'is-free' : ''}">${free ? 'FREE' : fmt(tech.cost)}</span>
      </div>
    `;
    row.querySelector('.ow-tech-name').textContent = tech.name;
    row.querySelector('.ow-tech-unlocks').textContent = summarizeUnlocks(tech);
    const img = row.querySelector('.ow-tech-icon img');
    img.src = techIconPath(tech);
    img.onerror = () => {
      img.remove();
      const span = document.createElement('span');
      span.className = 'ow-tech-icon-fallback';
      span.textContent = tech.name[0];
      row.querySelector('.ow-tech-icon').appendChild(span);
    };
    row.addEventListener('click', () => toggleResearch(tech.id));
    attachLongPress(row, () => toggleCompleted(tech.id));
    return row;
  }

  function makeBonusRow(bonus, orderIndex){
    const state = bonusState(bonus);
    const idx = orderIndex[bonus.id];
    const row = document.createElement('div');
    row.className = 'ow-tech ow-bonus ' + state;
    row.innerHTML = `
      <div class="ow-tech-icon"><img alt="" /></div>
      <div class="ow-tech-body">
        <p class="ow-tech-name"></p>
        <div class="ow-tech-unlocks"></div>
      </div>
      <div class="ow-tech-meta">
        ${idx ? `<span class="ow-tech-order">${idx}</span>` : ''}
        <span class="ow-tech-cost">${fmt(bonus.cost)}</span>
      </div>
    `;
    row.querySelector('.ow-tech-name').textContent = '★ ' + bonus.name;
    row.querySelector('.ow-tech-unlocks').textContent = bonus.bonus || '';
    const img = row.querySelector('.ow-tech-icon img');
    img.src = bonusIconPath(bonus);
    img.onerror = () => {
      img.remove();
      const span = document.createElement('span');
      span.className = 'ow-tech-icon-fallback';
      span.textContent = '★';
      row.querySelector('.ow-tech-icon').appendChild(span);
    };
    row.addEventListener('click', () => toggleBonus(bonus.id));
    attachLongPress(row, () => toggleCompleted(bonus.id));
    return row;
  }

  function renderBody(){
    const orderIndex = {};
    researchOrder.forEach((id, i) => { orderIndex[id] = i + 1; });

    const frag = document.createDocumentFragment();
    tiers.forEach(t => {
      const section = document.createElement('section');
      section.className = 'ow-tier';
      section.innerHTML = `
        <header class="ow-tier-header">
          <h2 class="ow-tier-title"><small>Tier</small>${t.tier + 1}</h2>
          <span class="ow-tier-cost">${fmt(t.cost)} <img src="img/icons/yields/science.png" alt="" /></span>
        </header>
        <div class="ow-tier-list"></div>
      `;
      const list = section.querySelector('.ow-tier-list');
      t.items.forEach(tech => list.appendChild(makeTechRow(tech, orderIndex)));
      const bonuses = bonusCardsForTier(t.items);
      bonuses.forEach(b => list.appendChild(makeBonusRow(b, orderIndex)));
      frag.appendChild(section);
    });

    // Nation-only (culture-gated) bonus cards at the bottom
    const nationBonuses = nationOnlyBonusCards();
    if (nationBonuses.length){
      const section = document.createElement('section');
      section.className = 'ow-tier';
      const nationName = ND.nationNames.find(n => n.id === selectedNation)?.name || 'Nation';
      section.innerHTML = `
        <header class="ow-tier-header">
          <h2 class="ow-tier-title"><small>${nationName}</small>Unique bonuses</h2>
          <span class="ow-tier-cost" style="color:var(--text-muted)">culture-gated</span>
        </header>
        <div class="ow-tier-list"></div>
      `;
      const list = section.querySelector('.ow-tier-list');
      nationBonuses.forEach(b => list.appendChild(makeBonusRow(b, orderIndex)));
      frag.appendChild(section);
    }

    $body.replaceChildren(frag);
  }

  function renderTotals(){
    const startingSet = new Set(selectedNation ? (ND.startingTechs[selectedNation] || []) : []);
    let total = 0;
    researchOrder.forEach(id => {
      if (startingSet.has(id)) return;
      const t = techById.get(id) || bonusById.get(id);
      if (t) total += t.cost;
    });
    $totalPill.firstChild.textContent = fmt(total);
    $planCost.textContent = fmt(total);
    const count = researchOrder.length + startingSet.size;
    $planTechCount.textContent = `${count} item${count === 1 ? '' : 's'}`;
  }

  function renderPlan(){
    const startingSet = new Set(selectedNation ? (ND.startingTechs[selectedNation] || []) : []);
    const startingItems = [...startingSet].map(id => ({ id, t: techById.get(id), free: true, bonus: false }));
    const orderItems = researchOrder.map(id => {
      const t = techById.get(id);
      if (t) return { id, t, free: false, bonus: false };
      const b = bonusById.get(id);
      if (b) return { id, t: b, free: false, bonus: true };
      return null;
    }).filter(Boolean);
    const all = [...startingItems, ...orderItems];

    if (!all.length){
      $planList.innerHTML = '<div class="ow-sheet-empty">Tap any available tech to start a plan. Prerequisites pull in automatically.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    let orderNum = 0;
    all.forEach((it, i) => {
      const row = document.createElement('div');
      const done = completedTechs.includes(it.id) || it.free;
      row.className = 'ow-sheet-row' + (done ? ' is-completed' : '') + (it.bonus ? ' is-bonus' : '');
      const nameStr = (it.bonus ? '★ ' : '') + it.t.name;
      const costStr = it.free ? 'FREE' : fmt(it.t.cost);
      const numStr = it.free ? '' : (++orderNum).toString().padStart(2,'0');
      row.innerHTML = `
        <span class="ow-sheet-num">${numStr}</span>
        <span class="ow-sheet-name"></span>
        <span class="ow-sheet-cost ${it.free ? 'is-free' : ''}">${costStr}</span>
      `;
      row.querySelector('.ow-sheet-name').textContent = nameStr;
      if (!it.free){
        row.addEventListener('click', () => toggleCompleted(it.id));
      }
      frag.appendChild(row);
    });
    $planList.replaceChildren(frag);
  }

  // Paint a crest element from the nation's color data: a background-image
  // crest when one exists, falling back to the first-letter placeholder.
  function paintCrest(el, nationId, name){
    const theme = nationId && ND.colors ? ND.colors[nationId] : null;
    if (theme){
      el.style.backgroundImage = `url("img/crests/${theme.crest}.png")`;
      el.classList.add('has-img');
      el.classList.remove('is-empty');
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.classList.remove('has-img');
      el.textContent = name ? name[0] : '?';
    }
  }

  function renderNationLabel(){
    const bar = document.querySelector('.ow-topbar');
    const root = document.documentElement.style;
    const theme = selectedNation && ND.colors ? ND.colors[selectedNation] : null;
    if (theme){
      root.setProperty('--nation-color', theme.bg);
      root.setProperty('--nation-accent', theme.accent);
      bar.classList.add('is-nation');
    } else {
      root.removeProperty('--nation-color');
      root.removeProperty('--nation-accent');
      bar.classList.remove('is-nation');
    }
    if (!selectedNation){
      $nationLabel.textContent = 'Choose nation';
      paintCrest($nationCrest, '', null);
      $nationCrest.textContent = '?';
      $nationCrest.classList.remove('is-empty');
      return;
    }
    const n = ND.nationNames.find(x => x.id === selectedNation);
    $nationLabel.textContent = n ? n.name : selectedNation;
    paintCrest($nationCrest, selectedNation, n ? n.name : selectedNation);
    $nationCrest.classList.remove('is-empty');
  }

  function render(){
    renderNationLabel();
    renderBody();
    renderTotals();
    renderPlan();
  }

  // ---- nation picker
  function openNationSheet(){
    document.getElementById('nationScrim').classList.add('is-open');
    document.getElementById('nationSheet').classList.add('is-open');
    document.getElementById('nationSearch').value = '';
    renderNationList('');
    setTimeout(() => document.getElementById('nationSearch').focus(), 250);
  }
  function closeNationSheet(){
    document.getElementById('nationScrim').classList.remove('is-open');
    document.getElementById('nationSheet').classList.remove('is-open');
  }
  function renderNationList(q){
    const list = document.getElementById('nationList');
    const sorted = ND.nationNames.slice().sort((a, b) => a.name.localeCompare(b.name));
    const filtered = q.trim()
      ? sorted.filter(n => n.name.toLowerCase().includes(q.trim().toLowerCase()))
      : sorted;
    const frag = document.createDocumentFragment();

    const noneRow = document.createElement('div');
    noneRow.className = 'ow-nation-row' + (!selectedNation ? ' is-selected' : '');
    noneRow.innerHTML = `
      <span class="ow-nation-crest is-empty">—</span>
      <span>
        <div class="ow-nation-name">No nation</div>
        <div class="ow-nation-meta ow-nation-empty-meta">Browse without starting techs</div>
      </span>
      ${!selectedNation ? '<span class="ow-nation-check">✓</span>' : ''}
    `;
    noneRow.addEventListener('click', () => { setNation(''); closeNationSheet(); });
    frag.appendChild(noneRow);

    filtered.forEach(n => {
      const starts = (ND.startingTechs[n.id] || []).length;
      const row = document.createElement('div');
      row.className = 'ow-nation-row' + (n.id === selectedNation ? ' is-selected' : '');
      row.innerHTML = `
        <span class="ow-nation-crest"></span>
        <span>
          <div class="ow-nation-name"></div>
          <div class="ow-nation-meta">${starts ? `${starts} starting tech${starts === 1 ? '' : 's'}` : 'No starting bonuses'}</div>
        </span>
        ${n.id === selectedNation ? '<span class="ow-nation-check">✓</span>' : ''}
      `;
      paintCrest(row.querySelector('.ow-nation-crest'), n.id, n.name);
      row.querySelector('.ow-nation-name').textContent = n.name;
      row.addEventListener('click', () => { setNation(n.id); closeNationSheet(); });
      frag.appendChild(row);
    });

    if (!filtered.length){
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:24px 12px;text-align:center;color:var(--text-muted);font-size:12px;';
      empty.textContent = `No nations match “${q}”.`;
      frag.appendChild(empty);
    }
    list.replaceChildren(frag);
  }

  // ---- plan sheet
  function togglePlanSheet(){
    $planSheet.classList.toggle('is-open');
  }

  // ---- init
  function init(){
    loadState();
    const sp = new URLSearchParams(location.search);
    if (sp.has('n') || sp.has('o')) loadFromURL();

    document.getElementById('versionHint').textContent =
      `${window.gameVersion || 'Old World'} · ${TD.techs.length} techs · long-press a tile to toggle complete`;

    document.getElementById('nationTrigger').addEventListener('click', openNationSheet);
    document.getElementById('nationSheetClose').addEventListener('click', closeNationSheet);
    document.getElementById('nationScrim').addEventListener('click', closeNationSheet);
    document.getElementById('nationSearch').addEventListener('input', e => renderNationList(e.target.value));

    document.getElementById('fab').addEventListener('click', () => $planSheet.classList.add('is-open'));
    document.getElementById('planHandle').addEventListener('click', togglePlanSheet);
    document.getElementById('planSummary').addEventListener('click', togglePlanSheet);
    document.getElementById('planClear').addEventListener('click', e => {
      e.stopPropagation();
      if (researchOrder.length === 0 || confirm('Clear the entire plan?')) clearPlan();
    });
    document.getElementById('planShare').addEventListener('click', e => {
      e.stopPropagation();
      shareLink();
    });

    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
