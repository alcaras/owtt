/* ============================================================
   Old World Tech Tree — Redesign · app logic
   ============================================================ */
(function(){
  'use strict';

  const TD = window.techData;
  const ND = window.nationData;
  const NL = window.nationLookup;

  // -------- icon mapping
  function techIconPath(tech){
    // TECH_LATEEN_SAIL -> lateen_sail.png
    const slug = tech.id.replace(/^TECH_/,'').toLowerCase();
    return `img/icons/techs/${slug}.png`;
  }
  // Bonus card icon: prefer the per-card sprite extracted from the game's
  // Unity bundle (img/icons/bonus/<iconName>.png). Falls back to the parent
  // tech's icon for anything missing.
  function bonusIconPath(bt){
    if (bt.iconName) return `img/icons/bonus/${bt.iconName.toLowerCase()}.png`;
    if (bt.parent){
      const parent = TD.techs.find(t => t.id === bt.parent);
      if (parent) return techIconPath(parent);
    }
    return 'img/icons/yields/science.png';
  }

  // -------- state
  let researchedTechs = [];
  let researchOrder = [];
  let researchedBonusTechs = [];
  let completedTechs = [];
  let selectedNation = '';
  let undoStack = [];
  let redoStack = [];

  // -------- helpers
  const techById = new Map(TD.techs.map(t=>[t.id,t]));
  const bonusById = new Map(TD.bonusTechs.map(b=>[b.id,b]));

  function getAllPrereqs(techId, acc = new Set()){
    const t = techById.get(techId);
    if (!t) return acc;
    for (const p of (t.prereqs||[])){
      if (!acc.has(p)){ acc.add(p); getAllPrereqs(p, acc); }
    }
    return acc;
  }
  function startingTechsForNation(){
    if (!selectedNation) return [];
    return ND.startingTechs[selectedNation] || [];
  }

  // children per tech — used by the "Branches" badge (deck pollution)
  const childTechCount = new Map();
  TD.techs.forEach(t => (t.prereqs||[]).forEach(p => childTechCount.set(p, (childTechCount.get(p)||0)+1)));

  function isStarting(techId){ return startingTechsForNation().includes(techId); }

  // Total science needed to reach `techId`: own cost + every unmet prereq.
  // "Unmet" = not in the user's research order, not completed, not free
  // (starting tech for the selected nation).
  function computeTotalCostToReach(techId, startingSet){
    const have = new Set([
      ...startingSet,
      ...researchedTechs,
      ...completedTechs,
    ]);
    const visited = new Set();
    let total = 0;
    function visit(id){
      if (visited.has(id) || have.has(id)) return;
      visited.add(id);
      const t = techById.get(id);
      if (!t) return;
      total += t.cost;
      (t.prereqs || []).forEach(visit);
    }
    visit(techId);
    return total;
  }

  function recordUndo(){
    undoStack.push(JSON.stringify({researchedTechs,researchOrder,researchedBonusTechs,completedTechs,selectedNation}));
    if (undoStack.length>30) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
  }
  function applyState(s){
    const o = JSON.parse(s);
    researchedTechs = o.researchedTechs;
    researchOrder = o.researchOrder;
    researchedBonusTechs = o.researchedBonusTechs;
    completedTechs = o.completedTechs;
    selectedNation = o.selectedNation;
    document.getElementById('nationSelect').value = selectedNation;
    renderAll();
  }
  function undo(){ if (!undoStack.length) return; redoStack.push(JSON.stringify({researchedTechs,researchOrder,researchedBonusTechs,completedTechs,selectedNation})); applyState(undoStack.pop()); updateUndoRedoButtons(); }
  function redo(){ if (!redoStack.length) return; undoStack.push(JSON.stringify({researchedTechs,researchOrder,researchedBonusTechs,completedTechs,selectedNation})); applyState(redoStack.pop()); updateUndoRedoButtons(); }
  function updateUndoRedoButtons(){
    document.getElementById('undoBtn').disabled = !undoStack.length;
    document.getElementById('redoBtn').disabled = !redoStack.length;
  }

  // -------- toggle research
  function findInsertionIndex(techId){
    const tech = techById.get(techId);
    if (!tech) return researchOrder.length;
    // insert after all prereqs that are already in order
    let last = -1;
    for (let i=0;i<researchOrder.length;i++){
      const id = researchOrder[i];
      const t = techById.get(id);
      if (!t) continue;
      if ((tech.prereqs||[]).includes(t.id) || (t.cost < tech.cost)) last = i;
    }
    return last + 1;
  }

  function toggleResearch(techId){
    if (isStarting(techId)) return;
    const t = techById.get(techId); if (!t) return;
    recordUndo();

    if (researchedTechs.includes(techId)){
      // remove this + any dependents
      const toRemove = new Set([techId]);
      let changed = true;
      while (changed){
        changed = false;
        for (const otherId of researchedTechs){
          const other = techById.get(otherId);
          if (!other || toRemove.has(otherId)) continue;
          if ((other.prereqs||[]).some(p=>toRemove.has(p))){ toRemove.add(otherId); changed = true; }
        }
      }
      // also remove bonus techs whose parent is gone
      const bonusToRemove = researchedBonusTechs.filter(bid=>{
        const b = bonusById.get(bid);
        return b && b.parent && toRemove.has(b.parent);
      });
      researchedTechs = researchedTechs.filter(id=>!toRemove.has(id));
      researchedBonusTechs = researchedBonusTechs.filter(id=>!bonusToRemove.includes(id));
      completedTechs = completedTechs.filter(id=>!toRemove.has(id) && !bonusToRemove.includes(id));
      researchOrder = researchOrder.filter(id=>!toRemove.has(id) && !bonusToRemove.includes(id));
    } else {
      // add prereqs + tech in order
      const allPrereqs = [...getAllPrereqs(techId)];
      // sort by cost ascending
      allPrereqs.sort((a,b)=>{ const ta=techById.get(a), tb=techById.get(b); return (ta?.cost||0)-(tb?.cost||0); });
      for (const pid of allPrereqs){
        if (!researchedTechs.includes(pid) && !isStarting(pid)){
          researchedTechs.push(pid);
          researchOrder.push(pid);
        }
      }
      researchedTechs.push(techId);
      researchOrder.push(techId);
    }
    saveState();
    renderAll();
  }

  function toggleBonus(bonusId){
    const b = bonusById.get(bonusId); if (!b) return;
    recordUndo();
    const idx = researchedBonusTechs.indexOf(bonusId);
    if (idx > -1){
      researchedBonusTechs.splice(idx,1);
      completedTechs = completedTechs.filter(id=>id!==bonusId);
      researchOrder = researchOrder.filter(id=>id!==bonusId);
    } else {
      // ensure parent tech researched (if parent specified)
      if (b.parent && !researchedTechs.includes(b.parent) && !isStarting(b.parent)){
        const allPrereqs = [...getAllPrereqs(b.parent)];
        allPrereqs.sort((a,b)=>{ const ta=techById.get(a), tb=techById.get(b); return (ta?.cost||0)-(tb?.cost||0); });
        for (const pid of allPrereqs){
          if (!researchedTechs.includes(pid) && !isStarting(pid)){
            researchedTechs.push(pid); researchOrder.push(pid);
          }
        }
        researchedTechs.push(b.parent); researchOrder.push(b.parent);
      }
      researchedBonusTechs.push(bonusId);
      researchOrder.push(bonusId);
    }
    saveState();
    renderAll();
  }

  function toggleCompleted(id){
    // toggle a tech or bonus as completed
    const isResearched = researchedTechs.includes(id) || researchedBonusTechs.includes(id);
    if (!isResearched && !isStarting(id)) return;
    if (isStarting(id)) return; // starting always completed
    recordUndo();
    const ci = completedTechs.indexOf(id);
    if (ci > -1) completedTechs.splice(ci,1);
    else completedTechs.push(id);
    saveState();
    renderAll();
  }

  function clearBuild(){
    recordUndo();
    researchedTechs = []; researchOrder = []; researchedBonusTechs = []; completedTechs = [];
    saveState();
    renderAll();
  }

  function selectNation(nid){
    recordUndo();
    selectedNation = nid;
    saveState();
    renderAll();
  }

  // -------- persistence
  function saveState(){
    const s = {researchedTechs,researchOrder,researchedBonusTechs,completedTechs,selectedNation};
    try { localStorage.setItem('owtt-redesign', JSON.stringify(s)); } catch(e){}
    updateURL();
  }
  function loadState(){
    try {
      const raw = localStorage.getItem('owtt-redesign');
      if (raw){
        const o = JSON.parse(raw);
        researchedTechs = o.researchedTechs||[];
        researchOrder = o.researchOrder||[];
        researchedBonusTechs = o.researchedBonusTechs||[];
        completedTechs = o.completedTechs||[];
        selectedNation = o.selectedNation||'';
      }
    } catch(e){}
  }
  function updateURL(){
    const parts = [];
    if (selectedNation){ const ni = NL.indexOf(selectedNation); if (ni>-1) parts.push('n='+ni); }
    if (researchOrder.length){
      const nums = researchOrder.map(id=>{
        const mi = TD.techs.findIndex(t=>t.id===id);
        if (mi>-1) return mi;
        const bi = TD.bonusTechs.findIndex(b=>b.id===id);
        if (bi>-1) return -(bi+1);
        return null;
      }).filter(n=>n!==null);
      if (nums.length) parts.push('o='+nums.join(','));
    }
    const search = parts.length ? '?' + parts.join('&') : '';
    history.replaceState({}, '', location.pathname + search);
  }

  // -------- rendering
  const $grid = document.getElementById('techGrid');
  const $costH = document.getElementById('costHeaders');
  const $bonus = document.getElementById('bonusGrid');
  const $orderList = document.getElementById('orderList');
  const $orderEmpty = document.getElementById('orderEmpty');
  const $orderCount = document.getElementById('orderCount');
  const $totalCost = document.getElementById('totalCost');
  const $totalLaws = document.getElementById('totalLaws');
  const $connections = document.getElementById('connections');

  function fmt(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,','); }

  function renderCostHeaders(){
    $costH.innerHTML = '';
    const costByCol = {};
    TD.techs.forEach(t=>{ if (costByCol[t.column]===undefined) costByCol[t.column] = t.cost; });
    const cols = Math.max(...Object.keys(costByCol).map(Number))+1;
    for (let c=0;c<cols;c++){
      const cost = costByCol[c];
      const div = document.createElement('div');
      div.className = 'cost-header';
      div.innerHTML = `<span class="cost-header-eyebrow">Tier ${c+1}</span><span class="cost-header-value">${cost?fmt(cost):'—'}<img src="img/icons/yields/science.png" alt="" /></span>`;
      $costH.appendChild(div);
    }
  }

  function renderTechGrid(){
    $grid.innerHTML = '';
    const startingSet = new Set(startingTechsForNation());

    TD.techs.forEach(tech=>{
      const node = document.createElement('div');
      node.className = 'tech-node';
      node.id = tech.id;
      node.dataset.id = tech.id;
      node.style.gridColumn = (tech.column+1);
      node.style.gridRow = (tech.row+1);

      node.innerHTML = `
        <div class="tech-icon"><img src="${techIconPath(tech)}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'tech-icon-fallback\\'>${tech.name[0]}</span>';" /></div>
        <div class="tech-name">${tech.name}</div>
      `;

      node.addEventListener('click', ()=>toggleResearch(tech.id));
      node.addEventListener('contextmenu', e=>{ e.preventDefault(); toggleCompleted(tech.id); });
      node.addEventListener('mouseenter', e=>showTooltip(e, tech));
      node.addEventListener('mouseleave', hideTooltip);
      node.addEventListener('mousemove', moveTooltip);

      $grid.appendChild(node);
    });
  }

  function renderBonus(){
    $bonus.innerHTML = '';
    const available = TD.bonusTechs.filter(b=>!b.nation || b.nation===selectedNation);
    const byCost = {};
    available.forEach(b=>{ (byCost[b.cost] = byCost[b.cost]||[]).push(b); });
    const costs = Object.keys(byCost).map(Number).sort((a,b)=>a-b);
    costs.forEach(cost=>{
      const col = document.createElement('div');
      col.className = 'bonus-col';
      col.innerHTML = `<div class="bonus-col-header">${fmt(cost)}<img src="img/icons/yields/science.png" alt="" /></div>`;
      byCost[cost].forEach(b=>{
        const card = document.createElement('div');
        card.className = 'bonus-card';
        card.id = b.id;
        card.innerHTML = `
          <div class="bonus-card-icon"><img src="${bonusIconPath(b)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='★';"/></div>
          <div class="bonus-card-body">
            <div class="bonus-card-name">${b.name}</div>
            <div class="bonus-card-desc">${decorateBonusText(b.bonus||'')}</div>
          </div>
        `;
        card.addEventListener('click', ()=>toggleBonus(b.id));
        card.addEventListener('contextmenu', e=>{ e.preventDefault(); toggleCompleted(b.id); });
        card.addEventListener('mouseenter', e=>showBonusTooltip(e,b));
        card.addEventListener('mouseleave', hideTooltip);
        card.addEventListener('mousemove', moveTooltip);
        col.appendChild(card);
      });
      $bonus.appendChild(col);
    });
  }

  function updateStates(){
    const startingSet = new Set(startingTechsForNation());
    // counter for order numbers from research order
    const orderIndexById = {};
    researchOrder.forEach((id,i)=>orderIndexById[id] = i+1);

    // bonus cards a tech feeds into the deck — nation cards only count when
    // playing that nation; culture-gated cards enter via culture, not research
    const bonusCardCount = new Map();
    TD.bonusTechs.forEach(b=>{
      if (!b.parent || b.cultureRequired) return;
      if (b.nation && b.nation !== selectedNation) return;
      bonusCardCount.set(b.parent, (bonusCardCount.get(b.parent)||0)+1);
    });

    TD.techs.forEach(tech=>{
      const node = document.getElementById(tech.id); if (!node) return;
      node.classList.remove('available','on-path','completed','starting','prereq-preview');
      const existingOrder = node.querySelector('.tech-order'); if (existingOrder) existingOrder.remove();
      const existingDelta = node.querySelector('.tech-delta'); if (existingDelta) existingDelta.remove();
      const existingBranch = node.querySelector('.tech-branch'); if (existingBranch) existingBranch.remove();

      const prereqsMet = (tech.prereqs||[]).every(p=>researchedTechs.includes(p) || startingSet.has(p)) || (tech.prereqs||[]).length===0;

      if (startingSet.has(tech.id)){
        node.classList.add('starting','completed');
      } else if (completedTechs.includes(tech.id)){
        node.classList.add('completed');
      } else if (researchedTechs.includes(tech.id)){
        node.classList.add('on-path');
      } else if (prereqsMet){
        node.classList.add('available');
      }

      if (orderIndexById[tech.id] && !startingSet.has(tech.id)){
        const badge = document.createElement('div');
        badge.className = 'tech-order';
        badge.textContent = orderIndexById[tech.id];
        node.appendChild(badge);
      }
      // Cost chip on techs that haven't been learned yet. Shows the *total*
      // science needed to reach this tech — including every unmet prereq —
      // not just the tech's own cost.
      const isStartingTech = startingSet.has(tech.id);
      const isResearched = researchedTechs.includes(tech.id) || completedTechs.includes(tech.id);
      if (!isResearched && !isStartingTech){
        const totalCost = computeTotalCostToReach(tech.id, startingSet);
        const delta = document.createElement('div');
        delta.className = 'tech-delta';
        delta.textContent = fmt(totalCost);
        if (totalCost > tech.cost) delta.title = `${fmt(tech.cost)} own · ${fmt(totalCost - tech.cost)} prereqs`;
        node.appendChild(delta);
      }
      // Branches chip: how many cards researching this tech adds to the deck.
      const kids = childTechCount.get(tech.id) || 0;
      const cards = bonusCardCount.get(tech.id) || 0;
      const branch = document.createElement('div');
      branch.className = 'tech-branch';
      branch.textContent = kids + cards;
      branch.title = `Adds ${kids} tech${kids===1?'':'s'}`
        + (cards ? ` + ${cards} bonus card${cards===1?'':'s'}` : '')
        + ' to the deck';
      node.appendChild(branch);
    });
    // bonus state
    TD.bonusTechs.forEach(b=>{
      const card = document.getElementById(b.id); if (!card) return;
      card.classList.remove('available','on-path','completed');
      const parentMet = b.cultureRequired ? true : (b.parent && (researchedTechs.includes(b.parent) || startingSet.has(b.parent)));
      if (researchedBonusTechs.includes(b.id)){
        if (completedTechs.includes(b.id)) card.classList.add('completed');
        else card.classList.add('on-path');
      } else if (parentMet) {
        card.classList.add('available');
      }
    });
  }

  function updateOrderList(){
    $orderList.innerHTML = '';
    const startingSet = new Set(startingTechsForNation());
    // List starting first
    const startingItems = [...startingSet].map(id=>{
      const t = techById.get(id); if (!t) return null;
      return {id, name: t.name, cost: t.cost, isBonus: false, free: true, completed: true};
    }).filter(Boolean);
    const orderItems = researchOrder.map(id=>{
      const t = techById.get(id);
      if (t) return {id, name: t.name, cost: t.cost, isBonus:false, free:false, completed:completedTechs.includes(id)};
      const b = bonusById.get(id);
      if (b) return {id, name: b.name, cost: b.cost, isBonus:true, free:false, completed:completedTechs.includes(id)};
      return null;
    }).filter(Boolean);
    const items = [...startingItems, ...orderItems];
    $orderCount.textContent = '·  ' + items.length;
    if (!items.length){ $orderEmpty.style.display = ''; return; }
    $orderEmpty.style.display = 'none';
    let lawCount = 0;
    let orderNum = 0;
    items.forEach((it,i)=>{
      const li = document.createElement('li');
      li.className = 'order-item';
      if (it.completed) li.classList.add('completed');
      if (it.isBonus) li.classList.add('bonus');
      const tech = !it.isBonus ? techById.get(it.id) : null;
      const bonus = it.isBonus ? bonusById.get(it.id) : null;
      const iconSrc = tech ? techIconPath(tech) : (bonus ? bonusIconPath(bonus) : '');
      const iconHtml = iconSrc
        ? `<img class="order-icon" src="${iconSrc}" alt="" onerror="this.style.display='none'" />`
        : '';
      const givesLaw = (tech?.unlocks?.laws?.length || 0) > 0;
      const lawHtml = givesLaw
        ? `<span class="order-law"><img class="order-law-icon" src="img/icons/yields/laws.png" alt="law" title="Unlocks a law" /><span class="order-law-num">${++lawCount}</span></span>`
        : '';
      const numHtml = it.free ? '' : (++orderNum).toString().padStart(2,'0');
      li.innerHTML = `
        <span class="order-num">${numHtml}</span>
        ${iconHtml}
        <span class="order-name">${it.name}${lawHtml}</span>
        <span class="order-cost ${it.free?'free':''}">${fmt(it.cost)}</span>
      `;
      li.addEventListener('click', ()=>{
        if (it.free) return;
        toggleCompleted(it.id);
      });
      $orderList.appendChild(li);
    });
  }

  function updateTotals(){
    let cost = 0, laws = 0;
    const startingSet = new Set(startingTechsForNation());
    researchedTechs.forEach(id=>{
      const t = techById.get(id); if (!t) return;
      if (!startingSet.has(id)) cost += t.cost;
      laws += (t.unlocks?.laws?.length||0);
    });
    researchedBonusTechs.forEach(id=>{
      const b = bonusById.get(id); if (!b) return;
      cost += b.cost;
    });
    $totalCost.textContent = fmt(cost);
    $totalLaws.textContent = laws;
  }

  // -------- connections (SVG)
  function drawConnections(){
    const wrap = document.getElementById('treeWrap');
    const rect = wrap.getBoundingClientRect();
    $connections.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    $connections.setAttribute('width', rect.width);
    $connections.setAttribute('height', rect.height);
    $connections.innerHTML = '';
    const startingSet = new Set(startingTechsForNation());

    TD.techs.forEach(tech=>{
      const childEl = document.getElementById(tech.id);
      if (!childEl) return;
      const cb = childEl.getBoundingClientRect();
      const x2 = cb.left - rect.left;
      const y2 = cb.top - rect.top + cb.height/2;
      (tech.prereqs||[]).forEach(pid=>{
        const parentEl = document.getElementById(pid);
        if (!parentEl) return;
        const pb = parentEl.getBoundingClientRect();
        const x1 = pb.right - rect.left;
        const y1 = pb.top - rect.top + pb.height/2;
        const dx = (x2-x1)/2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`);
        path.setAttribute('fill','none');
        path.setAttribute('class','connection-line');
        const childOn = researchedTechs.includes(tech.id) || completedTechs.includes(tech.id);
        const parentOn = researchedTechs.includes(pid) || completedTechs.includes(pid) || startingSet.has(pid);
        if (childOn && parentOn){
          if (completedTechs.includes(tech.id) || startingSet.has(tech.id)) path.classList.add('completed');
          else path.classList.add('on-path');
        }
        $connections.appendChild(path);
      });
    });
  }

  // -------- tooltip
  // Icon helpers for tooltip unlocks. Display names map to slugs by lowercasing
  // and converting non-alphanum to underscore.
  function _slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
  // Improvements where the game only ships variant icons (no canonical plain
  // sprite). Pick a representative variant by hand.
  const IMPROVEMENT_ALIAS = {
    baths: 'warm_baths',
  };
  // Units whose display name (from text-unit*.xml) doesn't slugify to the same
  // string as their zType (which is what extract_unlock_icons.py saves under).
  // Maps "Three Man Chariot" → "hittite_chariot_2" so the icon path resolves.
  const UNIT_NAME_ALIAS = {
    'heavy_chariot':        'hittite_chariot_1',
    'three_man_chariot':    'hittite_chariot_2',
    'elite_amazon_cavalry': 'amazon_cavalry_2',
    'elite_clubthrower':    'clubthrower_2',
    'elite_gaesata':        'gaesata_2',
    'elite_huscarl':        'huscarl_2',
    'elite_javelineer':     'javelineer_2',
    'elite_libyan_cavalry': 'libyan_cavalry_2',
    'elite_marauder':       'marauder_2',
    'elite_nomad_marauder': 'nomad_marauder_2',
    'elite_nomad_skirmisher': 'nomad_skirmisher_2',
    'elite_nomad_warlord':  'nomad_warlord_2_f',
    'elite_peltast':        'peltast_2',
    'elite_skirmisher':     'skirmisher_2',
    'elite_warlord':        'warlord_2_f',
    'gaesata':              'gaesata_1',
    'huscarl':              'huscarl_1',
    'javelineer':           'javelineer_1',
    'libyan_cavalry':       'libyan_cavalry_1',
    'marauder':             'marauder_1',
    'nomad_marauder':       'nomad_marauder_1',
    'nomad_skirmisher':     'nomad_skirmisher_1',
    'nomad_warlord':        'nomad_warlord_1_f',
    'peltast':              'peltast_1',
    'skirmisher':           'skirmisher_1',
    'warlord':              'warlord_1_f',
    'd_mt_warrior':         'dmt_warrior',
  };
  function _unitSlug(label){
    const s = _slug(label);
    return UNIT_NAME_ALIAS[s] || s;
  }
  // Build an <img> that walks a fallback chain via onerror — first path that
  // loads wins; if all fail the img hides itself.
  function fallbackImg(paths, cls){
    if (!paths.length) return '';
    const escaped = paths.map(p => JSON.stringify(p));
    const chain = escaped.slice(1).reverse().reduce(
      (next, p) => `this.onerror=function(){${next}};this.src=${p};`,
      `this.onerror=null;this.style.display='none';`
    );
    return `<img class="${cls}" src=${escaped[0]} alt="" onerror="${chain}" />`;
  }
  function unlockRow(kind, label){
    // For laws, render an icon per half of the "Slavery/Freedom" pair.
    if (kind === 'law'){
      const icons = label.split('/').map(p =>
        fallbackImg([`img/icons/law/law_${_slug(p)}.png`], 'tt-icon')
      ).join('');
      return `<span class="tt-row">${icons}<span class="tt-row-label">${label}</span></span>`;
    }
    const s = _slug(label);
    let paths = [], cls = 'tt-icon';
    // Units: prefer the white-silhouette glyph (UNIT_<NAME>'s small variant),
    // fall back to the BONUS_ card art when no glyph exists. Names like
    // "Three Man Chariot" don't slugify to their zType; UNIT_NAME_ALIAS
    // bridges those cases.
    if (kind === 'unit') {
      const us = _unitSlug(label);
      paths = [`img/icons/unit/unit_${us}.png`, `img/icons/bonus/bonus_${us}.png`];
      if (us !== s) paths.push(`img/icons/unit/unit_${s}.png`, `img/icons/bonus/bonus_${s}.png`);
      cls = 'tt-icon tt-icon-glyph';
    }
    else if (kind === 'imp')  {
      // A few improvements ship only as named variants (Baths → warm/cold/heated);
      // alias them to a canonical variant.
      const aliased = IMPROVEMENT_ALIAS[s] || s;
      paths = [`img/icons/improvement/improvement_${aliased}.png`];
    }
    else if (kind === 'proj') paths = [`img/icons/project/project_${s}.png`, `img/icons/project/project_${s}_1.png`];
    return `<span class="tt-row">${fallbackImg(paths, cls)}<span class="tt-row-label">${label}</span></span>`;
  }

  // Inject inline icons into a bonus-effect string like "+400 Iron, +400 Stone,
  // +2 Porcelain, +1 Court Scholar". We try yields → resources → units →
  // specialists/courtiers. Anything that doesn't resolve renders as plain text.
  const YIELD_ICON_FOR = {
    'Food':'food','Stone':'stone','Wood':'wood','Iron':'iron','Money':'money',
    'Civics':'civics','Training':'training','Orders':'orders','Science':'science',
    'Happiness':'happiness','Discontent':'discontent','Influence':'influence',
    'Growth':'growth','Culture':'culture','Maintenance':'maintenance',
    // Border Growth intentionally not iconified — there's no clean game sprite
    // for it and the culture icon was a misleading stand-in.
  };
  const RESOURCE_ICON_FOR = {
    'Porcelain':'porcelain','Perfume':'perfume','Exotic Fur':'exotic_fur',
    'Exotic Furs':'exotic_fur','Silk':'silk','Ebony':'ebony','Lavender':'lavender',
    'Wine':'wine','Gold':'gold','Silver':'silver','Salt':'salt','Olive':'olive',
    'Olives':'olive','Spices':'spices','Honey':'honey','Iron':'iron','Stone':'stone',
    'Pearls':'pearl','Pearl':'pearl','Jade':'jade','Gem':'gem','Gems':'gem',
    'Dye':'dye','Incense':'incense','Wootz Steel':'wootz_steel',
  };
  function iconForLabel(name){
    if (YIELD_ICON_FOR[name]) return `img/icons/yields/${YIELD_ICON_FOR[name]}.png`;
    if (RESOURCE_ICON_FOR[name]) return `img/icons/resources/${RESOURCE_ICON_FOR[name]}.png`;
    return null;
  }
  function decorateBonusText(text){
    if (!text) return '';
    // Match "+N <Label>" where <Label> is a Capitalized word(s). When we have
    // a yield or resource icon, render JUST the icon (no spelled-out label).
    // For other labels (units, courtiers, …) keep the text and try the unit
    // silhouette as the icon source.
    return text.replace(
      /\+([\d,]+)\s+([A-Z][A-Za-z]*(?:\s[A-Z][A-Za-z]*)*)\b/g,
      (m, amt, label) => {
        const icon = iconForLabel(label);
        if (icon){
          return `+${amt} <img class="tt-yield-ic" src="${icon}" alt="${label}" title="${label}" />`;
        }
        // No yield/resource match — try a unit silhouette via the alias
        // table, then the plain slug, then fall back to the label text.
        const us = _unitSlug(label);
        const primary = `img/icons/unit/unit_${us}.png`;
        const secondary = `img/icons/unit/unit_${_slug(label)}.png`;
        const onerr = us !== _slug(label)
          ? `this.onerror=function(){this.outerHTML=${JSON.stringify(label)}};this.src=${JSON.stringify(secondary)}`
          : `this.outerHTML=${JSON.stringify(label)}`;
        return `+${amt} <img class="tt-yield-ic tt-yield-glyph" src="${primary}" alt="${label}" title="${label}" onerror="${onerr}" />`;
      }
    );
  }

  const $tip = document.getElementById('tooltip');
  function showTooltip(e, tech){
    const startingSet = new Set(startingTechsForNation());
    const status = startingSet.has(tech.id) ? 'FREE — starting tech' :
                   completedTechs.includes(tech.id) ? 'Completed' :
                   researchedTechs.includes(tech.id) ? 'On research path' :
                   (tech.prereqs||[]).every(p=>researchedTechs.includes(p)||startingSet.has(p)) ? 'Available' : 'Locked';
    let html = `<h3><img src="${techIconPath(tech)}" alt=""/>${tech.name}</h3>`;
    let costLine = `${fmt(tech.cost)} science`;
    const isStartingTech = startingSet.has(tech.id);
    const isResearched = researchedTechs.includes(tech.id) || completedTechs.includes(tech.id);
    if (!isResearched && !isStartingTech){
      const total = computeTotalCostToReach(tech.id, startingSet);
      if (total > tech.cost){
        costLine = `${fmt(tech.cost)} own · ${fmt(total)} total with prereqs`;
      }
    }
    html += `<div class="tt-meta">${costLine} · ${status}</div>`;
    const u = tech.unlocks;
    const sections = [];
    if (u.units?.length) sections.push({h:'Units', kind:'unit', items:u.units});
    if (u.improvements?.length) sections.push({h:'Improvements', kind:'imp', items:u.improvements.filter(x=>x!=='Kushite Pyramids'||selectedNation==='NATION_KUSH')});
    if (u.laws?.length) sections.push({h:'Laws', kind:'law', headIcon:'img/icons/yields/laws.png', items:u.laws});
    if (u.projects?.length) sections.push({h:'Projects', kind:'proj', items:u.projects});
    sections.forEach(s=>{
      const heading = s.headIcon
        ? `<h4><img class="tt-section-ic" src="${s.headIcon}" alt="" /> ${s.h}</h4>`
        : `<h4>${s.h}</h4>`;
      html += `<div class="tt-section">${heading}<div class="tt-list">${
        s.items.map(label => unlockRow(s.kind, label)).join('')
      }</div></div>`;
    });
    const bs = TD.bonusTechs.filter(b=>b.parent===tech.id && (!b.nation||b.nation===selectedNation));
    if (bs.length){
      html += `<div class="tt-section"><h4>Bonus cards</h4><div class="tt-list">${
        bs.map(b => `<span class="tt-bonus-row"><strong>${b.name}</strong> — ${decorateBonusText(b.bonus||'')}</span>`).join('')
      }</div></div>`;
    }
    if (tech.prereqs?.length){
      html += `<div class="tt-section"><h4>Requires</h4><div class="tt-list">${
        tech.prereqs.map(pid => {
          const t = techById.get(pid);
          const nm = t ? t.name : pid;
          const icon = t ? fallbackImg([techIconPath(t)], 'tt-icon') : '';
          return `<span class="tt-row">${icon}<span class="tt-row-label">${nm}</span></span>`;
        }).join('')
      }</div></div>`;
    }
    $tip.innerHTML = html;
    $tip.classList.add('show');
    moveTooltip(e);
  }
  function showBonusTooltip(e, b){
    const html = `
      <h3><img src="${bonusIconPath(b)}" alt=""/>${b.name}</h3>
      <div class="tt-meta">${fmt(b.cost)} science · Bonus card</div>
      <div class="tt-section"><h4>Effect</h4><div class="tt-list"><span>${decorateBonusText(b.bonus||'')}</span></div></div>
      ${b.parent ? `<div class="tt-section"><h4>Drawn from</h4><div class="tt-list"><span>${techById.get(b.parent)?.name||b.parent}</span></div></div>` : ''}
      ${b.nation ? `<div class="tt-section"><h4>Nation</h4><div class="tt-list"><span>${(ND.nationNames.find(n=>n.id===b.nation)||{}).name||b.nation} · ${b.cultureRequired||''}</span></div></div>` : ''}
    `;
    $tip.innerHTML = html;
    $tip.classList.add('show');
    moveTooltip(e);
  }
  function moveTooltip(e){
    const pad = 14;
    let x = e.clientX + pad, y = e.clientY + pad;
    const r = $tip.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
    $tip.style.transform = `translate(${x}px, ${y}px)`;
  }
  function hideTooltip(){ $tip.classList.remove('show'); }

  // -------- nation dropdown
  function fillNationDropdown(){
    const sel = document.getElementById('nationSelect');
    ND.nationNames.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(n=>{
      const opt = document.createElement('option');
      opt.value = n.id; opt.textContent = n.name;
      sel.appendChild(opt);
    });
    sel.value = selectedNation;
    sel.addEventListener('change', e=>selectNation(e.target.value));
  }

  // -------- share
  function shareBuild(){
    updateURL();
    const url = location.href;
    navigator.clipboard?.writeText(url);
    const btn = document.getElementById('shareBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5 9-11"/></svg> Copied!';
    setTimeout(()=>btn.innerHTML = orig, 1600);
  }

  // -------- load from URL
  function loadFromURL(){
    const sp = new URLSearchParams(location.search);
    if (sp.has('n')){
      const ni = parseInt(sp.get('n')); if (NL[ni]) selectedNation = NL[ni];
    }
    if (sp.has('o')){
      const nums = sp.get('o').split(',').map(Number);
      researchOrder = []; researchedTechs = []; researchedBonusTechs = [];
      nums.forEach(n=>{
        if (n>=0 && TD.techs[n]){ researchOrder.push(TD.techs[n].id); researchedTechs.push(TD.techs[n].id); }
        else if (n<0){ const b = TD.bonusTechs[-n-1]; if (b){ researchOrder.push(b.id); researchedBonusTechs.push(b.id); } }
      });
    }
  }

  // -------- save import (completed-game .zip → plan)
  // Old World saves are zip archives holding a single XML document. The save
  // does not record research order, so a tier/cost order is synthesized.

  function readSaveZip(buf){
    const view = new DataView(buf);
    // end-of-central-directory record: scan backwards (allows a zip comment)
    let eocd = -1;
    const min = Math.max(0, buf.byteLength - 65557);
    for (let i = buf.byteLength - 22; i >= min; i--){
      if (view.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
    }
    if (eocd < 0) throw new Error('That file is not a zip archive.');
    const count = view.getUint16(eocd + 10, true);
    let off = view.getUint32(eocd + 16, true);
    const entries = [];
    for (let i = 0; i < count; i++){
      if (view.getUint32(off, true) !== 0x02014b50) break;
      const nameLen = view.getUint16(off + 28, true);
      entries.push({
        method: view.getUint16(off + 10, true),
        csize: view.getUint32(off + 20, true),
        localOff: view.getUint32(off + 42, true),
        name: new TextDecoder().decode(new Uint8Array(buf, off + 46, nameLen)),
      });
      off += 46 + nameLen + view.getUint16(off + 30, true) + view.getUint16(off + 32, true);
    }
    const entry = entries.find(e => /\.xml$/i.test(e.name)) || entries[0];
    if (!entry) throw new Error('That zip archive is empty.');
    if (view.getUint32(entry.localOff, true) !== 0x04034b50) throw new Error('Could not read the zip entry.');
    // sizes come from the central directory — local headers may be zeroed
    const dataStart = entry.localOff + 30
      + view.getUint16(entry.localOff + 26, true)
      + view.getUint16(entry.localOff + 28, true);
    const blob = new Blob([new Uint8Array(buf, dataStart, entry.csize)]);
    if (entry.method === 0) return blob.text();
    if (entry.method !== 8) throw new Error('Unsupported zip compression method.');
    return new Response(blob.stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  }

  function parseSave(xmlText){
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror') || doc.documentElement.nodeName !== 'Root'){
      throw new Error('That zip does not look like an Old World save.');
    }
    if (!doc.querySelector('Game > GameOver')){
      throw new Error('This save isn’t from a completed game. Finish the game (or pick a save from the Completed folder) and try again.');
    }
    const humans = new Set([...doc.querySelectorAll('Humans > PlayerHuman')].map(el => el.textContent.trim()));
    const players = [];
    for (const p of doc.querySelectorAll(':root > Player')){
      const nation = p.getAttribute('Nation');
      if (!nation || nation === 'NONE') continue;
      const tc = p.querySelector(':scope > TechCount');
      if (!tc) continue;
      const techIds = [...tc.children].filter(el => parseInt(el.textContent) > 0).map(el => el.tagName);
      if (!techIds.length) continue;
      // The permanent log records every research in chronological order
      // (TechCount alone is written in tech.xml definition order).
      const researchLog = [...p.querySelectorAll(':scope > PermanentLogList > LogData')]
        .filter(ld => [...ld.children].some(c => c.tagName === 'Type' && c.textContent === 'TECH_DISCOVERED'))
        .map(ld => ([...ld.children].find(c => c.tagName === 'Data1') || {}).textContent || '')
        .map(s => s.trim()).filter(Boolean);
      players.push({
        name: (p.getAttribute('Name') || '').trim(),
        nation,
        nationName: (ND.nationNames.find(n => n.id === nation) || {}).name || nation.replace('NATION_', ''),
        human: humans.has(p.getAttribute('ID')),
        techIds,
        researchLog,
      });
    }
    if (!players.length) throw new Error('No players with researched techs found in this save.');
    return { gameName: doc.documentElement.getAttribute('GameName') || '', players };
  }

  function buildPlanFromTechs(nation, techIds, researchLog){
    const starting = new Set(ND.startingTechs[nation] || []);
    const inSave = new Set(techIds);
    let ordered;
    if (researchLog && researchLog.length){
      // chronological order straight from the save's permanent log
      ordered = researchLog.filter(id => inSave.has(id));
      const seen = new Set(ordered);
      for (const id of techIds) if (!seen.has(id)) ordered.push(id);
    } else {
      // no log — synthesize: tier/cost order with bonus cards after their
      // parent (prereqs always sit in earlier columns)
      const mains = techIds.filter(id => techById.has(id) && !starting.has(id)).map(id => techById.get(id));
      mains.sort((a, b) => (a.column - b.column) || (a.cost - b.cost) || (a.row - b.row));
      const bonuses = techIds.filter(id => bonusById.has(id)).map(id => bonusById.get(id));
      const bonusFor = parent => bonuses.filter(b => b.parent === parent).map(b => b.id);
      ordered = [];
      for (const sid of starting) ordered.push(...bonusFor(sid));
      for (const t of mains){ ordered.push(t.id, ...bonusFor(t.id)); }
      const placed = new Set(ordered);
      for (const b of bonuses) if (!placed.has(b.id)) ordered.push(b.id);
    }
    const researchedTechs = [], researchedBonusTechs = [], order = [];
    for (const id of ordered){
      if (starting.has(id)) continue; // the planner grants these for free
      if (techById.has(id)){ researchedTechs.push(id); order.push(id); }
      else if (bonusById.has(id)){ researchedBonusTechs.push(id); order.push(id); }
      // anything else: tech from another game version — drop it
    }
    return { researchedTechs, researchedBonusTechs, researchOrder: order };
  }

  function applyImport(player){
    recordUndo();
    selectedNation = NL.includes(player.nation) ? player.nation : '';
    document.getElementById('nationSelect').value = selectedNation;
    const plan = buildPlanFromTechs(selectedNation, player.techIds, player.researchLog);
    researchedTechs = plan.researchedTechs;
    researchedBonusTechs = plan.researchedBonusTechs;
    researchOrder = plan.researchOrder;
    completedTechs = [];
    saveState();
    renderAll();
    closeImportModal();
  }

  function openImportModal(){
    const m = document.getElementById('importModal');
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
  }
  function closeImportModal(){
    const m = document.getElementById('importModal');
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
  }

  function showImportError(msg){
    document.getElementById('importTitle').textContent = 'Import failed';
    document.getElementById('importDesc').textContent = '';
    const body = document.getElementById('importBody');
    body.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'import-error';
    err.textContent = msg;
    body.appendChild(err);
    openImportModal();
  }

  function showImportPicker(save){
    document.getElementById('importTitle').textContent = 'Choose a player';
    document.getElementById('importDesc').textContent =
      (save.gameName ? `Completed game “${save.gameName}”. ` : '') +
      'Pick whose tech tree to load — it replaces your current plan (undoable).';
    const body = document.getElementById('importBody');
    body.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'player-list';
    for (const pl of save.players){
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'player-row';
      const colors = ND.colors && ND.colors[pl.nation];
      if (colors){
        const img = document.createElement('img');
        img.className = 'player-crest';
        img.src = `img/crests/${colors.crest}.png`;
        img.alt = '';
        row.appendChild(img);
      }
      const info = document.createElement('span');
      info.className = 'player-info';
      const nm = document.createElement('span');
      nm.className = 'player-name';
      nm.textContent = pl.name || pl.nationName;
      const meta = document.createElement('span');
      meta.className = 'player-meta';
      meta.textContent = `${pl.nationName} · ${pl.techIds.length} techs`;
      info.append(nm, meta);
      row.appendChild(info);
      const badge = document.createElement('span');
      badge.className = 'player-badge' + (pl.human ? ' is-human' : '');
      badge.textContent = pl.human ? 'Human' : 'AI';
      row.appendChild(badge);
      row.addEventListener('click', () => applyImport(pl));
      list.appendChild(row);
    }
    body.appendChild(list);
    openImportModal();
  }

  async function handleImportFile(file){
    try {
      const xml = await readSaveZip(await file.arrayBuffer());
      const save = parseSave(xml);
      if (save.players.length === 1) applyImport(save.players[0]);
      else showImportPicker(save);
    } catch (err){
      showImportError((err && err.message) || 'Could not read that file.');
    }
  }

  // -------- simulate modal (real Monte-Carlo, ported from legacy template.html)
  let simRunning = false;
  function openSimModal(){
    if (!researchOrder.length){
      alert('Add some techs to your plan before simulating.');
      return;
    }
    const modal = document.getElementById('simModal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    runSimulation();
  }
  function closeSimModal(){
    const modal = document.getElementById('simModal');
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    simRunning = false;
  }

  const SIM_VARIANTS = [
    {label:'Base',             scholar:false, oracle:false},
    {label:'Oracle only',      scholar:false, oracle:true },
    {label:'Scholar only',     scholar:true,  oracle:false},
    {label:'Scholar + Oracle', scholar:true,  oracle:true },
  ];
  const SIM_RUNS = 1000;

  async function runSimulation(){
    if (simRunning) return;
    simRunning = true;
    const container = document.getElementById('simResults');
    container.innerHTML = SIM_VARIANTS
      .map(v => `
        <div class="sim-row" data-variant="${v.label}">
          <div class="sim-row-head">
            <span class="sim-row-name">${v.label}</span>
            <span class="sim-row-status">running 0 / ${fmt(SIM_RUNS)}…</span>
          </div>
          <div class="sim-row-bar">
            <div class="sim-progress" style="width:0%"></div>
          </div>
        </div>`)
      .join('');

    const path = buildSimResearchPath();
    const results = {};
    // Sequentially run each variant so the UI can stream progress.
    for (const v of SIM_VARIANTS){
      if (!simRunning) return;
      const row = container.querySelector(`.sim-row[data-variant="${CSS.escape(v.label)}"]`);
      const status = row?.querySelector('.sim-row-status');
      const progressEl = row?.querySelector('.sim-progress');
      const runs = [];
      const batch = 100;
      for (let i = 0; i < SIM_RUNS; i += batch){
        if (!simRunning) return;
        await new Promise(r => setTimeout(r, 0));
        const n = Math.min(batch, SIM_RUNS - i);
        for (let j = 0; j < n; j++){
          runs.push(simulateSingleRun(path, v.scholar, v.oracle));
        }
        if (status) status.textContent = `running ${fmt(runs.length)} / ${fmt(SIM_RUNS)}…`;
        if (progressEl) progressEl.style.width = ((runs.length / SIM_RUNS) * 100) + '%';
      }
      results[v.label] = summarizeSimResults(runs);
    }

    if (!simRunning) return;

    // Global scale across successful variants — makes the bars comparable.
    const succ = SIM_VARIANTS.map(v => results[v.label]).filter(s => s.successRate > 0);
    const globalMin = succ.length ? Math.min(...succ.map(s => s.min)) : 0;
    const globalMax = succ.length ? Math.max(...succ.map(s => s.max)) : 0;
    const range = Math.max(globalMax - globalMin, 1);

    SIM_VARIANTS.forEach(v => {
      const row = container.querySelector(`.sim-row[data-variant="${CSS.escape(v.label)}"]`);
      if (!row) return;
      const s = results[v.label];
      if (!s || s.successRate === 0){
        row.innerHTML = `
          <div class="sim-row-head">
            <span class="sim-row-name">${v.label}</span>
            <span class="sim-row-status sim-fail">no successful runs · path unreachable</span>
          </div>`;
        return;
      }
      const avg = Math.round(s.avg);
      const sd = Math.round(s.stdDev);
      const minPct = ((s.min - globalMin) / range) * 100;
      const maxPct = ((s.max - globalMin) / range) * 100;
      const avgPct = ((s.avg - globalMin) / range) * 100;
      const sdLeftPct = ((Math.max(s.min, s.avg - s.stdDev) - globalMin) / range) * 100;
      const sdRightPct = ((Math.min(s.max, s.avg + s.stdDev) - globalMin) / range) * 100;
      const succNote = s.successRate < 1 ? ` · ${Math.round(s.successRate*100)}% success` : '';
      row.innerHTML = `
        <div class="sim-row-head">
          <span class="sim-row-name">${v.label}</span>
          <span class="sim-row-stats">
            <span class="sim-stat sim-stat-avg">${fmt(avg)}</span>
            <span class="sim-stat-sigma">±${fmt(sd)}</span>
            <span class="sim-stat-range">${fmt(s.min)}–${fmt(s.max)}${succNote}</span>
          </span>
        </div>
        <div class="sim-row-bar">
          <div class="sim-band-range" style="left:${minPct}%;width:${maxPct - minPct}%"></div>
          <div class="sim-band-sigma" style="left:${sdLeftPct}%;width:${sdRightPct - sdLeftPct}%"></div>
          <div class="sim-marker sim-marker-min" style="left:${minPct}%" title="min ${fmt(s.min)}"></div>
          <div class="sim-marker sim-marker-avg" style="left:${avgPct}%" title="avg ${fmt(avg)}"></div>
          <div class="sim-marker sim-marker-max" style="left:${maxPct}%" title="max ${fmt(s.max)}"></div>
        </div>
        <div class="sim-row-axis">
          <span class="sim-axis-tick" style="left:${minPct}%">${fmt(s.min)}</span>
          <span class="sim-axis-tick sim-axis-avg" style="left:${avgPct}%">${fmt(avg)}</span>
          <span class="sim-axis-tick" style="left:${maxPct}%">${fmt(s.max)}</span>
        </div>`;
    });

    simRunning = false;
  }

  function buildSimResearchPath(){
    return [
      ...researchedTechs.filter(id => !isStarting(id) && !completedTechs.includes(id)),
      ...researchedBonusTechs.filter(id => !completedTechs.includes(id)),
    ];
  }

  function summarizeSimResults(results){
    const succ = results.filter(r => !r.failed).map(r => r.cost);
    if (!succ.length) return {min:0,max:0,avg:0,stdDev:0,successRate:0};
    succ.sort((a,b)=>a-b);
    const min = succ[0], max = succ[succ.length-1];
    const avg = succ.reduce((s,c)=>s+c,0) / succ.length;
    const variance = succ.reduce((s,c)=>s + (c-avg)*(c-avg), 0) / succ.length;
    return {min, max, avg, stdDev: Math.sqrt(variance), successRate: succ.length / results.length};
  }

  // ---- core simulation engine
  function simIsSubset(sub, sup){
    for (const x of sub) if (!sup.has(x)) return false;
    return true;
  }
  function simShuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
  }
  function simGetAvailable(completedSet, removedBonusSet){
    const mains = TD.techs.filter(t =>
      !completedSet.has(t.id) && !isStarting(t.id) &&
      (t.prereqs || []).every(p => completedSet.has(p))
    );
    const bonuses = TD.bonusTechs
      .filter(b =>
        !completedSet.has(b.id) && !removedBonusSet.has(b.id) &&
        !(b.nation && b.nation !== selectedNation) &&
        (b.parent ? completedSet.has(b.parent) : true)
      )
      .map(b => ({...b, isBonus: true}));
    return [...mains, ...bonuses];
  }
  function simDrawFirstHand(drawPile){
    const hand = [];
    if (selectedNation){
      while (drawPile.length) hand.push(drawPile.pop());
    } else {
      for (let i = 0; i < 5 && drawPile.length; i++) hand.push(drawPile.pop());
    }
    return hand;
  }
  function simDrawHand(drawPile, discardPile, handSize){
    const hand = [];
    for (let i = 0; i < handSize; i++){
      if (drawPile.length === 0 && discardPile.length > 0){
        drawPile.push(...discardPile);
        discardPile.length = 0;
        simShuffle(drawPile);
      }
      if (drawPile.length) hand.push(drawPile.pop());
    }
    return hand;
  }
  function simShouldRedraw(targetSet, drawPile, discardPile){
    const all = [...drawPile, ...discardPile];
    return all.some(t => targetSet.has(t.id));
  }
  function simPickFromTargets(targets, isBonus){
    const order = isBonus ? researchedBonusTechs : researchedTechs;
    return targets.reduce((best, t) => {
      const ti = order.indexOf(t.id);
      const bi = order.indexOf(best.id);
      return (ti !== -1 && (bi === -1 || ti < bi)) ? t : best;
    });
  }
  function simResearchOneTurn(targetSet, drawPile, discardPile, completedSet, hasScholar, hasOracle, turn, removedBonusSet){
    let hand, handSize;
    if (turn === 1){
      hand = simDrawFirstHand(drawPile);
      handSize = hand.length;
    } else {
      handSize = hasOracle ? 5 : 4;
      hand = simDrawHand(drawPile, discardPile, handSize);
    }
    if (!hand.length) return {cost: 0};

    const inHand = hand.filter(t => targetSet.has(t.id));
    const bonusTargets = inHand.filter(t => t.isBonus);
    const mainTargets = inHand.filter(t => !t.isBonus);
    let pick = null;

    if (bonusTargets.length){
      pick = simPickFromTargets(bonusTargets, true);
    } else if (mainTargets.length){
      pick = simPickFromTargets(mainTargets, false);
    } else if (hasScholar && simShouldRedraw(targetSet, drawPile, discardPile)){
      hand.forEach(t => {
        if (t.isBonus) removedBonusSet.add(t.id);
        else discardPile.push(t);
      });
      hand = simDrawHand(drawPile, discardPile, handSize);
      const newIn = hand.filter(t => targetSet.has(t.id));
      const newBonus = newIn.filter(t => t.isBonus);
      const newMain = newIn.filter(t => !t.isBonus);
      if (newBonus.length) pick = simPickFromTargets(newBonus, true);
      else if (newMain.length) pick = simPickFromTargets(newMain, false);
      else if (hand.length) pick = hand.reduce((cheap, t) => t.cost < cheap.cost ? t : cheap);
    } else {
      pick = hand.reduce((cheap, t) => t.cost < cheap.cost ? t : cheap);
    }

    if (!pick) return {cost: 0};
    completedSet.add(pick.id);
    hand.forEach(t => {
      if (t.id !== pick.id){
        if (t.isBonus) removedBonusSet.add(t.id);
        else discardPile.push(t);
      }
    });
    return {cost: pick.cost};
  }

  const TIER1 = ['TECH_IRONWORKING','TECH_STONECUTTING','TECH_TRAPPING','TECH_DIVINATION','TECH_ADMINISTRATION'];

  function simulateSingleRun(researchPath, hasScholar, hasOracle){
    const completedSet = new Set();
    const removedBonusSet = new Set();
    const drawPile = [];
    const discardPile = [];
    const inDeck = new Set();
    let totalCost = 0;
    let turn = 0;

    if (selectedNation && ND.startingTechs[selectedNation]){
      ND.startingTechs[selectedNation].forEach(id => completedSet.add(id));
    }
    completedTechs.forEach(id => completedSet.add(id));

    const targetSet = new Set(researchPath);
    const bonusIds = new Set(TD.bonusTechs.map(b => b.id));
    const targetBonusIds = researchPath.filter(id => bonusIds.has(id));

    while (!simIsSubset(targetSet, completedSet) && turn < 500){
      turn++;
      if (targetBonusIds.some(id => removedBonusSet.has(id))){
        return {failed: true, reason: 'lost_bonus'};
      }
      let avail;
      if (turn === 1 && selectedNation){
        avail = TD.techs.filter(t =>
          TIER1.includes(t.id) && !completedSet.has(t.id) && !isStarting(t.id)
        );
        if (selectedNation === 'NATION_KUSH'){
          const sb = TD.bonusTechs.find(b => b.id === 'TECH_STONECUTTING_BONUS_STONE');
          if (sb && !removedBonusSet.has(sb.id)) avail.push({...sb, isBonus: true});
        }
      } else {
        avail = simGetAvailable(completedSet, removedBonusSet);
      }
      const newOnes = avail.filter(t => !inDeck.has(t.id));
      if (newOnes.length){
        newOnes.forEach(t => { inDeck.add(t.id); drawPile.push(t); });
        simShuffle(drawPile);
      }
      const r = simResearchOneTurn(targetSet, drawPile, discardPile, completedSet, hasScholar, hasOracle, turn, removedBonusSet);
      if (r.cost > 0) totalCost += r.cost;
      else if (!simIsSubset(targetSet, completedSet)) break; // no progress
    }
    return simIsSubset(targetSet, completedSet)
      ? {cost: totalCost, failed: false}
      : {failed: true, reason: 'incomplete'};
  }

  // -------- Tweaks panel
  function setupTweaks(){
    const panel = document.getElementById('tweaksPanel');
    const closeBtn = document.getElementById('tweaksClose');
    const directionHints = {
      editorial: 'Refined dark slate with gold-leaf accents and generous whitespace.',
      atlas: 'Cartographer feel — column bands, ink-drawn connections, warmer palette.',
      codex: 'Ultra-dense codex view — small icons, more techs visible at once.'
    };
    window.addEventListener('message', e=>{
      if (e.data?.type === '__activate_edit_mode'){ panel.hidden = false; }
      if (e.data?.type === '__deactivate_edit_mode'){ panel.hidden = true; }
    });
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    closeBtn.addEventListener('click', ()=>{
      panel.hidden = true;
      window.parent.postMessage({type:'__edit_mode_dismissed'}, '*');
    });
    panel.querySelectorAll('[data-tweak]').forEach(seg=>{
      const key = seg.dataset.tweak;
      seg.querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', ()=>{
          seg.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));
          b.classList.add('is-active');
          document.body.setAttribute('data-'+key, b.dataset.value);
          if (key==='direction'){
            document.getElementById('directionHint').textContent = directionHints[b.dataset.value]||'';
          }
          // redraw connections after layout change
          requestAnimationFrame(()=>drawConnections());
        });
      });
    });
  }

  function updatePageTitle(){
    const name = selectedNation ? (ND.nationNames.find(n=>n.id===selectedNation)||{}).name : '';
    document.title = name ? `${name} - Tech Tree - Old World` : 'Tech Tree - Old World';
  }

  function renderAll(){
    updatePageTitle();
    applyNationTheme();
    renderTechGrid();
    renderBonus();
    updateStates();
    updateOrderList();
    updateTotals();
    requestAnimationFrame(()=>{
      fitTechNames();
      drawConnections();
    });
  }

  // Tint the topbar and show the crest for the selected nation. Colors come
  // from window.nationData.colors (generated from the game's color.xml).
  function applyNationTheme(){
    const bar = document.querySelector('.topbar');
    const crest = document.getElementById('nationCrest');
    const theme = selectedNation && ND.colors ? ND.colors[selectedNation] : null;
    const root = document.documentElement.style;
    if (theme){
      root.setProperty('--nation-color', theme.bg);
      root.setProperty('--nation-accent', theme.accent);
      bar.classList.add('is-nation');
      crest.src = `img/crests/${theme.crest}.png`;
      crest.alt = (ND.nationNames.find(n=>n.id===selectedNation)||{}).name || '';
      crest.hidden = false;
    } else {
      root.removeProperty('--nation-color');
      root.removeProperty('--nation-accent');
      bar.classList.remove('is-nation');
      crest.hidden = true;
      crest.removeAttribute('src');
    }
  }

  // After layout, shrink any tech name that would wrap onto a second line so
  // most names ride the larger default font and only the long single-words
  // (Land Consolidation, Industrial Progress…) drop to a smaller size.
  function fitTechNames(){
    const names = $grid.querySelectorAll('.tech-name');
    names.forEach(el => el.classList.remove('is-shrunk', 'is-tiny'));
    names.forEach(el => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 16;
      if (el.scrollHeight > lh * 1.45){
        el.classList.add('is-shrunk');
      }
    });
    // Second pass: if the shrunk size still wraps, drop one more notch.
    names.forEach(el => {
      if (!el.classList.contains('is-shrunk')) return;
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 14;
      if (el.scrollHeight > lh * 1.45){
        el.classList.replace('is-shrunk', 'is-tiny');
      }
    });
  }

  // -------- init
  function init(){
    loadState();
    const sp = new URLSearchParams(location.search);
    if (sp.has('n') || sp.has('o')) loadFromURL();
    fillNationDropdown();
    renderCostHeaders();
    renderAll();
    document.getElementById('shareBtn').addEventListener('click', shareBuild);
    document.getElementById('clearBtn').addEventListener('click', clearBuild);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.getElementById('simulateBtn').addEventListener('click', openSimModal);
    document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click', ()=>{
      const modal = el.closest('.modal');
      if (!modal) return;
      if (modal.id === 'simModal') closeSimModal();
      else { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
    }));
    const importFile = document.getElementById('importFile');
    document.getElementById('importBtn').addEventListener('click', ()=>importFile.click());
    importFile.addEventListener('change', ()=>{
      const f = importFile.files && importFile.files[0];
      importFile.value = ''; // allow re-selecting the same file
      if (f) handleImportFile(f);
    });
    // Sidebar toggle. On mobile (sidebar is a bottom sheet) we use the
    // `.open` class; on desktop the same button collapses/expands the
    // right-hand panel via a class on <body>.
    const toggleSidebar = () => {
      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      if (isMobile){
        document.getElementById('sidebar').classList.toggle('open');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
        // Connection lines depend on board width — redraw after layout settles.
        requestAnimationFrame(()=>requestAnimationFrame(drawConnections));
        try { localStorage.setItem('owtt-sidebar-collapsed', document.body.classList.contains('sidebar-collapsed') ? '1' : '0'); } catch(e){}
      }
    };
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarClose').addEventListener('click', ()=>{
      document.getElementById('sidebar').classList.remove('open');
    });
    try {
      if (localStorage.getItem('owtt-sidebar-collapsed') === '1'){
        document.body.classList.add('sidebar-collapsed');
      }
    } catch(e){}

    // Per-card badges: costs (total science incl. unmet prereqs) or branches
    // (cards added to the deck). Off by default — they clutter the board until
    // you're actively planning. Persisted; migrates the old boolean costs pref.
    const badgeSelect = document.getElementById('badgeMode');
    function badgeModePref(){
      let m = null;
      try {
        m = localStorage.getItem('owtt-badge-mode');
        if (!m && localStorage.getItem('owtt-show-costs') === '1') m = 'costs';
      } catch(e){}
      return (m === 'costs' || m === 'branches') ? m : 'none';
    }
    function applyBadgeMode(mode){
      document.body.classList.toggle('show-costs', mode === 'costs');
      document.body.classList.toggle('show-branches', mode === 'branches');
      if (badgeSelect) badgeSelect.value = mode;
    }
    applyBadgeMode(badgeModePref());
    if (badgeSelect){
      badgeSelect.addEventListener('change', () => {
        applyBadgeMode(badgeSelect.value);
        try { localStorage.setItem('owtt-badge-mode', badgeSelect.value); } catch(e){}
      });
    }

    // On touch devices the hover tooltip can stick because mouseleave never
    // fires. Dismiss it on any tap outside a tech / bonus card, and on a
    // second tap on the same card.
    document.addEventListener('touchstart', (e) => {
      const inTech = e.target.closest('.tech-node, .bonus-card');
      if (!inTech) hideTooltip();
    }, { passive: true });
    updateUndoRedoButtons();
    setupTweaks();
    // version line
    const game = window.gameVersion || 'Old World';
    const v = `${game} · ${TD.techs.length} techs · ${TD.bonusTechs.length} bonus cards`;
    document.getElementById('versionLine').textContent = v;
    document.getElementById('sidebarVersion').textContent = v;
    window.addEventListener('resize', () => requestAnimationFrame(() => { fitTechNames(); drawConnections(); }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
