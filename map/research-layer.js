import * as THREE from 'three';
import { remainingResearchReferences } from '../src/presentation/approved-map-sites.ts';
import {
  researchLocations,
  clusterResearchLocations,
} from '../src/presentation/research-markers.ts';

export async function createResearchLayer(
  project,
  surfaceHeight,
  promotedCandidateIds = new Set(),
  navigation = {},
) {
  const response = await fetch('/data/research-locations.json');
  if (!response.ok) throw Error('Research reference layer missing');
  const source = await response.json(),
    audit = researchLocations(
      remainingResearchReferences(source.records, promotedCandidateIds),
    );
  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden';
  document.querySelector('#map').appendChild(root);
  root.id = 'historical-locations';
  // One SVG path keeps every visible coordinate on the map; DOM buttons provide
  // accessible hit targets and labels for nearby groups without hundreds of labels.
  const dots = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  dots.setAttribute('class', 'research-points');
  dots.setAttribute('aria-hidden', 'true');
  root.append(dots);
  const pointPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pointPath.setAttribute('fill', '#c3e8df');
  pointPath.setAttribute('stroke', '#142f33');
  pointPath.setAttribute('stroke-width', '1.2');
  dots.append(pointPath);
  const status = document.querySelector('#research-status');
  const popup = document.createElement('div');
  popup.className = 'research-cluster-list';
  popup.hidden = true;
  root.append(popup);
  const points = audit.locations.map((location) => {
    const [x, z] = project(location.lon, location.lat);
    return {
      location,
      point: new THREE.Vector3(
        x,
        surfaceHeight(location.lon, location.lat) + 0.003,
        z,
      ),
    };
  });
  const toggle = document.querySelector('#research-markers');
  let enabled = toggle.checked,
    last = -Infinity,
    visible = 0,
    represented = 0,
    visiblePoints = 0,
    visibleNames = 0;
  const nodes = [];
  toggle.addEventListener('change', () => {
    enabled = toggle.checked;
    last = -Infinity;
    root.hidden = !enabled;
    popup.hidden = true;
  });
  function inspect(location) {
    popup.hidden = true;
    toggle.checked = true;
    enabled = true;
    last = -Infinity;
    navigation.focus?.(location.lon, location.lat, 70);
    navigation.inspect?.(location);
  }
  const search = document.querySelector('#settlement-search');
  const results = document.querySelector('#settlement-search-results');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const catalog = [
    ...(navigation.sites ?? []).map(s => ({...s, approved:true, alternateNames:s.alternateNames ?? []})),
    ...audit.locations.map(s => ({...s, approved:false})),
  ].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  search.addEventListener('input', () => {
    const query = normalize(search.value.trim());
    results.replaceChildren();
    if (!query) return;
    const score=s=>Math.min(...[s.name,...s.alternateNames].map(n=>normalize(n)===query?0:normalize(n).startsWith(query)?1:2));
    const matches = catalog.filter(s=>[s.name,...s.alternateNames].some(n=>normalize(n).includes(query)))
      .sort((a,b)=>score(a)-score(b)||Number(b.approved)-Number(a.approved)||a.name.localeCompare(b.name));
    for (const s of matches.slice(0,8)) {
      const button = document.createElement('button'), detail = document.createElement('small');
      button.type='button';
      button.textContent=s.name;
      detail.textContent=s.approved ? 'Approved geographic site' : `Research reference · ${s.uncertainty}`;
      button.append(detail);
      button.addEventListener('click',()=> {
        if(s.approved) navigation.select?.(s.key);
        else inspect(s);
      });
      results.append(button);
    }
    if (!matches.length) results.textContent='No located settlement matches.';
    else if(matches.length>8) {
      const more=document.createElement('small');
      more.textContent=`${matches.length} matches; refine the name to see more.`;
      results.append(more);
    }
  });
  search.addEventListener('keydown',e=> {
    if(e.key==='Enter') { e.preventDefault(); results.querySelector('button')?.click(); }
    if(e.key==='Escape') { search.value='';results.replaceChildren();search.blur(); }
  });
  function diagnostics() {
    return {
      enabled,
      available: audit.locations.length,
      excluded: audit.excluded,
      duplicates: audit.duplicates,
      possibleDuplicates: audit.possibleDuplicates,
      visible,
      represented,
      instantiated: points.length,
      visiblePoints,
      visibleNames,
      authoritative: false,
      suppressedPromoted: source.records.filter((r) =>
        promotedCandidateIds.has(r.proposedId),
      ).length,
    };
  }
  return {
    diagnostics,
    update(camera, now, blockers, distance) {
      if (!enabled) {
        root.hidden = true;
        visible = represented = visiblePoints = visibleNames = 0;
        status.textContent = `${points.length} historical locations · layer hidden`;
        return;
      }
      root.hidden = false;
      if (now - last < 150) return;
      last = now;
      const screen = [];
      for (const entry of points) {
        entry.point.y = surfaceHeight(entry.location.lon, entry.location.lat) + 0.003;
        const p = entry.point.clone().project(camera);
        if (p.z <= -1 || p.z >= 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;
        const x = (p.x * 0.5 + 0.5) * innerWidth,
          y = (-p.y * 0.5 + 0.5) * innerHeight;
        if (
          blockers.some(
            (b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom,
          )
        )
          continue;
        screen.push({ location: entry.location, x, y });
      }
      // Grow cells instead of dropping sparse locations when the DOM budget is
      // exceeded. All projected coordinates remain visible in the batched path.
      let cellSize = 56;
      let clusters;
      do {
        clusters = clusterResearchLocations(screen, innerWidth, innerHeight, true, cellSize, points.length);
        cellSize *= 1.2;
      } while (clusters.length > 180);
      dots.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      pointPath.setAttribute('d', screen.map(p=>`M${p.x.toFixed(1)},${(p.y-2.5).toFixed(1)}l2.5,2.5 -2.5,2.5 -2.5,-2.5Z`).join(''));
      visiblePoints = screen.length;
      visible = clusters.length;
      represented = clusters.reduce((n, c) => n + c.members.length, 0);
      status.textContent = `${points.length} historical locations · ${represented} in view`;
      const labelBoxes = [];
      const markerBoxes = clusters.map(c=>({left:c.x-10,right:c.x+10,top:c.y-10,bottom:c.y+10}));
      for (let i = 0; i < Math.max(nodes.length, clusters.length); i++) {
        let node = nodes[i];
        if (!node) {
          node = document.createElement('button');
          node.type = 'button';
          node.className = 'research-reference';
          root.appendChild(node);
          nodes.push(node);
        }
        const c = clusters[i];
        node.hidden = !c;
        if (!c) continue;
        const disputed = c.members.some((m) => m.uncertainty === 'disputed');
        node.classList.toggle('disputed', disputed);
        node.classList.toggle('cluster', c.members.length > 1);
        node.style.cssText = `left:${c.x}px;top:${c.y}px`;
        node.textContent =
          c.members.length > 1 ? String(c.members.length) : '◆';
        node.dataset.count = String(c.members.length);
        node.dataset.ids = c.members.map(m=>m.id).join('|');
        node.title =
          c.members
            .slice(0, 12)
            .map((m) => `${m.name} — ${m.uncertainty}. ${m.note}`)
            .join('\n') +
          (c.members.length > 12 ? '\nZoom in for more references.' : '');
        node.setAttribute('aria-label', node.title);
        node.onclick = () => {
          if(c.members.length===1) inspect(c.members[0]);
          else {
            popup.replaceChildren();
            const close = document.createElement('button');
            close.textContent = 'Close locations ×';
            close.onclick = () => { popup.hidden = true; };
            popup.append(close);
            for (const location of [...c.members].sort((a,b)=>a.name.localeCompare(b.name))) {
              const choice = document.createElement('button');
              choice.textContent = `${location.name} · ${location.uncertainty}`;
              choice.onclick = () => inspect(location);
              popup.append(choice);
            }
            const zoom = document.createElement('button');
            zoom.textContent = 'Zoom to these locations';
            zoom.onclick = () => {
              popup.hidden = true;
              navigation.focus?.(
                c.members.reduce((n,m)=>n+m.lon,0)/c.members.length,
                c.members.reduce((n,m)=>n+m.lat,0)/c.members.length,
                Math.max(8, distance*0.42),
              );
            };
            popup.append(zoom);
            popup.style.left = `${Math.max(12,Math.min(innerWidth-290,c.x+16))}px`;
            popup.style.top = `${Math.max(135,Math.min(innerHeight-350,c.y-40))}px`;
            popup.hidden = false;
          }
        };
        if (
          labelBoxes.length < (distance > 7000 ? 20 : 36)
        ) {
          // Representative name is chosen alphabetically, not by invented rank.
          const first = [...c.members].sort((a,b)=>a.name.localeCompare(b.name))[0];
          const name = first.name + (c.members.length > 1 ? ` +${c.members.length-1}` : '');
          const width = Math.min(180, name.length * 7 + 12);
          const box = {
            left: c.x - width / 2,
            right: c.x + width / 2,
            top: c.y + 24,
            bottom: c.y + 42,
          };
          if (
            box.left > 0 &&
            box.right < innerWidth &&
            box.bottom < innerHeight &&
            ![...blockers, ...labelBoxes, ...markerBoxes].some(
              (b) =>
                box.left < b.right &&
                box.right > b.left &&
                box.top < b.bottom &&
                box.bottom > b.top,
            )
          ) {
            const label = document.createElement('span');
            label.textContent = name;
            label.className = 'research-name';
            label.style.width = `${width}px`;
            node.appendChild(label);
            labelBoxes.push(box);
          }
        }
        // Geographic inspection only; no simulation dispatch.
      }
      visibleNames = labelBoxes.length;
    },
  };
}
