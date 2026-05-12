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
  // bonus card icon: use yields / specialists / units fallback
  function bonusIconPath(bt){
    const n = bt.name.toLowerCase();
    if (n.includes('scientist') || n.includes('philosopher')) return 'img/icons/specialists/philosopher.png';
    if (n.includes('minister')) return 'img/icons/specialists/magistrate.png';
    if (n.includes('court soldier')) return 'img/icons/specialists/officer.png';
    if (n.includes('merchant')) return 'img/icons/specialists/shopkeeper.png';
    if (n.includes('settler') || n.includes('worker')) return 'img/icons/specialists/laborer.png';
    if (n.includes('food')) return 'img/icons/yields/food.png';
    if (n.includes('stone')) return 'img/icons/yields/stone.png';
    if (n.includes('money')) return 'img/icons/yields/money.png';
    if (n.includes('training')) return 'img/icons/yields/training.png';
    if (n.includes('civics')) return 'img/icons/yields/civics.png';
    if (n.includes('orders')) return 'img/icons/yields/orders.png';
    if (n.includes('happiness')) return 'img/icons/yields/happiness.png';
    if (n.includes('porcelain')) return 'img/icons/resources/porcelain.png';
    if (n.includes('perfume')) return 'img/icons/resources/perfume.png';
    if (n.includes('exotic fur')) return 'img/icons/resources/exotic_fur.png';
    if (n.includes('border')) return 'img/icons/yields/culture.png';
    // unit-themed (use parent tech icon as fallback)
    if (bt.parent){
      const parent = TD.techs.find(t=>t.id===bt.parent);
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

  function isStarting(techId){ return startingTechsForNation().includes(techId); }

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
  const $sideCost = document.getElementById('sideCost');
  const $sideLaws = document.getElementById('sideLaws');
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

      // Count unlocks so we can render a tiny summary chip (units / buildings / laws / projects / bonus cards).
      // Detail lives in the tooltip; this is just an at-a-glance shape.
      const counts = {
        u: (tech.unlocks.units || []).length,
        b: (tech.unlocks.improvements || []).filter(x => x !== 'Kushite Pyramids' || selectedNation === 'NATION_KUSH').length,
        l: (tech.unlocks.laws || []).length,
        p: (tech.unlocks.projects || []).length,
        s: TD.bonusTechs.filter(b => b.parent === tech.id && (!b.nation || b.nation === selectedNation)).length,
      };
      const summary = [
        counts.u && `<span data-kind="unit">U${counts.u > 1 ? counts.u : ''}</span>`,
        counts.b && `<span data-kind="imp">I${counts.b > 1 ? counts.b : ''}</span>`,
        counts.l && `<span data-kind="law">L${counts.l > 1 ? counts.l : ''}</span>`,
        counts.p && `<span data-kind="proj">P${counts.p > 1 ? counts.p : ''}</span>`,
        counts.s && `<span data-kind="bonus">★${counts.s > 1 ? counts.s : ''}</span>`,
      ].filter(Boolean).join('');

      node.innerHTML = `
        <div class="tech-head">
          <div class="tech-icon"><img src="${techIconPath(tech)}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'tech-icon-fallback\\'>${tech.name[0]}</span>';" /></div>
          <div class="tech-name">${tech.name}</div>
        </div>
        ${summary ? `<div class="tech-summary">${summary}</div>` : ''}
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
          <div class="bonus-card-head">
            <div class="bonus-card-icon"><img src="${bonusIconPath(b)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='★';"/></div>
            <div class="bonus-card-name">${b.name}</div>
          </div>
          <div class="bonus-card-desc">${b.bonus||''}</div>
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

    TD.techs.forEach(tech=>{
      const node = document.getElementById(tech.id); if (!node) return;
      node.classList.remove('available','on-path','completed','starting','prereq-preview');
      const existingOrder = node.querySelector('.tech-order'); if (existingOrder) existingOrder.remove();
      const existingDelta = node.querySelector('.tech-delta'); if (existingDelta) existingDelta.remove();

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
      // cost chip on techs that haven't been learned yet — shows what it would cost to add
      const isStartingTech = startingSet.has(tech.id);
      const isResearched = researchedTechs.includes(tech.id) || completedTechs.includes(tech.id);
      if (!isResearched && !isStartingTech){
        const delta = document.createElement('div');
        delta.className = 'tech-delta';
        delta.textContent = fmt(tech.cost);
        node.appendChild(delta);
      }
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
    items.forEach((it,i)=>{
      const li = document.createElement('li');
      li.className = 'order-item';
      if (it.completed) li.classList.add('completed');
      if (it.isBonus) li.classList.add('bonus');
      li.innerHTML = `
        <span class="order-num">${(i+1).toString().padStart(2,'0')}</span>
        <span class="order-name">${it.name}</span>
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
    $sideCost.textContent = fmt(cost);
    $sideLaws.textContent = laws;
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
  const $tip = document.getElementById('tooltip');
  function showTooltip(e, tech){
    const startingSet = new Set(startingTechsForNation());
    const status = startingSet.has(tech.id) ? 'FREE — starting tech' :
                   completedTechs.includes(tech.id) ? 'Completed' :
                   researchedTechs.includes(tech.id) ? 'On research path' :
                   (tech.prereqs||[]).every(p=>researchedTechs.includes(p)||startingSet.has(p)) ? 'Available' : 'Locked';
    let html = `<h3><img src="${techIconPath(tech)}" alt=""/>${tech.name}</h3>`;
    html += `<div class="tt-meta">${fmt(tech.cost)} science · ${status}</div>`;
    const u = tech.unlocks;
    const sections = [];
    if (u.units?.length) sections.push({h:'Units', items:u.units});
    if (u.improvements?.length) sections.push({h:'Improvements', items:u.improvements.filter(x=>x!=='Kushite Pyramids'||selectedNation==='NATION_KUSH')});
    if (u.laws?.length) sections.push({h:'Laws', items:u.laws});
    if (u.projects?.length) sections.push({h:'Projects', items:u.projects});
    const bs = TD.bonusTechs.filter(b=>b.parent===tech.id && (!b.nation||b.nation===selectedNation));
    if (bs.length) sections.push({h:'Bonus cards', items:bs.map(b=>b.name+' — '+(b.bonus||''))});
    sections.forEach(s=>{
      html += `<div class="tt-section"><h4>${s.h}</h4><div class="tt-list">${s.items.map(i=>`<span>${i}</span>`).join('')}</div></div>`;
    });
    if (tech.prereqs?.length){
      html += `<div class="tt-section"><h4>Requires</h4><div class="tt-list">${tech.prereqs.map(p=>{const t=techById.get(p); return `<span>${t?t.name:p}</span>`;}).join('')}</div></div>`;
    }
    $tip.innerHTML = html;
    $tip.classList.add('show');
    moveTooltip(e);
  }
  function showBonusTooltip(e, b){
    const html = `
      <h3><img src="${bonusIconPath(b)}" alt=""/>${b.name}</h3>
      <div class="tt-meta">${fmt(b.cost)} science · Bonus card</div>
      <div class="tt-section"><h4>Effect</h4><div class="tt-list"><span>${b.bonus||''}</span></div></div>
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

  function renderAll(){
    renderTechGrid();
    renderBonus();
    updateStates();
    updateOrderList();
    updateTotals();
    requestAnimationFrame(()=>drawConnections());
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
    document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click', closeSimModal));
    document.getElementById('sidebarToggle').addEventListener('click', ()=>{
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebarClose').addEventListener('click', ()=>{
      document.getElementById('sidebar').classList.remove('open');
    });
    updateUndoRedoButtons();
    setupTweaks();
    // version line
    const game = window.gameVersion || 'Old World';
    const v = `${game} · ${TD.techs.length} techs · ${TD.bonusTechs.length} bonus cards`;
    document.getElementById('versionLine').textContent = v;
    document.getElementById('sidebarVersion').textContent = v;
    window.addEventListener('resize', ()=>requestAnimationFrame(drawConnections));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
