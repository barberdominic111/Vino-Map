import { useState, useEffect, useRef, useCallback } from "react";

const BLEND_COMPOSITIONS = {
  "bordeaux-red":   "Cab Sauv · Merlot · Cab Franc · Petit Verdot",
  "bordeaux-white": "Sauv Blanc · Sémillon · Muscadelle",
  "gsm":            "Grenache · Syrah · Mourvèdre",
  "rhone-white":    "Viognier · Marsanne · Roussanne",
  "super-tuscan":   "Sangiovese · Cab Sauv · Merlot",
  "rioja-blend":    "Tempranillo · Garnacha · Graciano",
  "cotes-du-rhone": "Grenache · Syrah · Mourvèdre · Carignan",
  "meritage":       "Cab Sauv · Merlot · Cab Franc (New World Bordeaux-style)",
  "field-blend":    "Co-fermented mixed varietals (varies by producer)",
  "port-blend":     "Touriga Nacional · Touriga Franca · Tinta Roriz",
  "champagne-blend":"Chardonnay · Pinot Noir · Pinot Meunier",
  "white-blend":    "Chenin · Viognier · Grenache Blanc · others",
};

const WINE_NODES = [
  { id:"cab-sauv",    label:"Cabernet\nSauvignon", type:"red",       angle:0,   ring:2 },
  { id:"merlot",      label:"Merlot",               type:"red",       angle:30,  ring:2 },
  { id:"pinot-noir",  label:"Pinot\nNoir",           type:"red",       angle:60,  ring:2 },
  { id:"syrah",       label:"Syrah /\nShiraz",       type:"red",       angle:90,  ring:2 },
  { id:"malbec",      label:"Malbec",                type:"red",       angle:120, ring:2 },
  { id:"zinfandel",   label:"Zinfandel",             type:"red",       angle:150, ring:2 },
  { id:"sangiovese",  label:"Sangiovese",            type:"red",       angle:180, ring:2 },
  { id:"tempranillo", label:"Tempranillo",           type:"red",       angle:210, ring:2 },
  { id:"grenache",    label:"Grenache",              type:"red",       angle:240, ring:2 },
  { id:"nebbiolo",    label:"Nebbiolo",              type:"red",       angle:270, ring:2 },
  { id:"mourvedre",   label:"Mourvèdre",             type:"red",       angle:300, ring:2 },
  { id:"barbera",     label:"Barbera",               type:"red",       angle:330, ring:2 },
  { id:"chardonnay",  label:"Chardonnay",            type:"white",     angle:15,  ring:1 },
  { id:"sauv-blanc",  label:"Sauvignon\nBlanc",      type:"white",     angle:55,  ring:1 },
  { id:"riesling",    label:"Riesling",              type:"white",     angle:95,  ring:1 },
  { id:"pinot-grigio",label:"Pinot\nGrigio",         type:"white",     angle:135, ring:1 },
  { id:"viognier",    label:"Viognier",              type:"white",     angle:175, ring:1 },
  { id:"gewurz",      label:"Gewürz-\ntraminer",     type:"white",     angle:215, ring:1 },
  { id:"albarino",    label:"Albariño",              type:"white",     angle:255, ring:1 },
  { id:"gruner",      label:"Grüner\nVeltliner",     type:"white",     angle:295, ring:1 },
  { id:"chenin",      label:"Chenin\nBlanc",         type:"white",     angle:335, ring:1 },
  { id:"rose",        label:"Rosé",                  type:"rose",      angle:45,  ring:0 },
  { id:"champagne",   label:"Champagne /\nCava / Prosecco", type:"sparkling", angle:135, ring:0 },
  { id:"port",        label:"Port",                  type:"fortified", angle:225, ring:0 },
  { id:"sherry",      label:"Sherry",                type:"fortified", angle:315, ring:0 },
  { id:"bordeaux-red",   label:"Bordeaux\nRed Blend",    type:"blend", angle:15,  ring:3 },
  { id:"meritage",       label:"Meritage",               type:"blend", angle:50,  ring:3 },
  { id:"gsm",            label:"GSM\nBlend",             type:"blend", angle:85,  ring:3 },
  { id:"rhone-white",    label:"Rhône\nWhite Blend",     type:"blend", angle:118, ring:3 },
  { id:"bordeaux-white", label:"Bordeaux\nWhite Blend",  type:"blend", angle:151, ring:3 },
  { id:"super-tuscan",   label:"Super\nTuscan",          type:"blend", angle:184, ring:3 },
  { id:"rioja-blend",    label:"Rioja\nBlend",           type:"blend", angle:217, ring:3 },
  { id:"cotes-du-rhone", label:"Côtes du\nRhône",        type:"blend", angle:250, ring:3 },
  { id:"champagne-blend",label:"Champagne\nBlend",       type:"blend", angle:283, ring:3 },
  { id:"port-blend",     label:"Port\nBlend",            type:"blend", angle:316, ring:3 },
  { id:"white-blend",    label:"White\nBlend",           type:"blend", angle:349, ring:3 },
];

const TYPE_COLORS = {
  red:       { base:"#7B1D2E", heat:"#E8334A", label:"Red" },
  white:     { base:"#C9A84C", heat:"#FFF3A3", label:"White" },
  rose:      { base:"#C47B8A", heat:"#FFB3C8", label:"Rosé" },
  sparkling: { base:"#8BA7C7", heat:"#C8E6FF", label:"Sparkling" },
  fortified: { base:"#6B4E2A", heat:"#C8974E", label:"Fortified" },
  blend:     { base:"#7B1D2E", heat:"#E8334A", label:"Blend" }, // fallback only
};

// Per-blend color pairs: [darkHalf, lightHalf] at rest; both shift toward heat colors when logged.
// "dark" = dominant/base tone, "light" = secondary/brighter tone of the same family.
// Red family: deep burgundy → ruby red
// White/gold family: dark gold → pale gold
// Mixed red+white: one half each
const BLEND_COLORS = {
  "bordeaux-red":    { a:{ base:"#5C1020", heat:"#C0253D" }, b:{ base:"#8B2035", heat:"#E8334A" } }, // deep + ruby red
  "meritage":        { a:{ base:"#5C1020", heat:"#C0253D" }, b:{ base:"#8B2035", heat:"#E8334A" } }, // same family
  "gsm":             { a:{ base:"#6B1525", heat:"#D4293F" }, b:{ base:"#9B3020", heat:"#E85030" } }, // red + brick-red
  "rhone-white":     { a:{ base:"#8B6B10", heat:"#D4A830" }, b:{ base:"#C9A84C", heat:"#FFF3A3" } }, // dark gold + pale gold
  "bordeaux-white":  { a:{ base:"#8B6B10", heat:"#D4A830" }, b:{ base:"#C9A84C", heat:"#FFF3A3" } }, // dark gold + pale gold
  "super-tuscan":    { a:{ base:"#5C1020", heat:"#C0253D" }, b:{ base:"#8B2035", heat:"#E8334A" } }, // red family
  "rioja-blend":     { a:{ base:"#6B1525", heat:"#D4293F" }, b:{ base:"#8B2035", heat:"#E8334A" } }, // red family
  "cotes-du-rhone":  { a:{ base:"#6B1525", heat:"#D4293F" }, b:{ base:"#9B3020", heat:"#E85030" } }, // red + warm red
  "champagne-blend": { a:{ base:"#8B6B10", heat:"#D4A830" }, b:{ base:"#C9A84C", heat:"#FFF3A3" } }, // gold family (mostly white grapes)
  "port-blend":      { a:{ base:"#4A0E1A", heat:"#A01E30" }, b:{ base:"#7B1D2E", heat:"#C0253D" } }, // very deep + dark red
  "white-blend":     { a:{ base:"#8B6B10", heat:"#D4A830" }, b:{ base:"#C9A84C", heat:"#FFF3A3" } }, // gold family
  "field-blend":     { a:{ base:"#7B1D2E", heat:"#E8334A" }, b:{ base:"#C9A84C", heat:"#FFF3A3" } }, // red + gold (mixed)
};

// Yin-yang rendered in SVG at (cx,cy) with given radius.
// colorA = "dark" half (top/right S-lobe), colorB = "light" half (bottom/left S-lobe).
// Each is { base, heat } hex; heat 0–1 lerps between them together.
function YinYang({ cx, cy, r, heat, selected, colorA, colorB }) {
  const ca = lerpColor(colorA.base, colorA.heat, heat);
  const cb = lerpColor(colorB.base, colorB.heat, heat);
  const clipId = `clip-yy-${Math.round(cx)}-${Math.round(cy)}`;
  const sr = r / 2; // small lobe radius

  // Path for the A-half (top lobe of S):
  // Start at top (cx, cy-r), arc right semicircle to (cx, cy+r),
  // then S-curve back up through center via two small arcs.
  const dA = [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 1 ${cx} ${cy + r}`,   // right outer semicircle
    `A ${sr} ${sr} 0 0 1 ${cx} ${cy}`,      // lower small arc (upward)
    `A ${sr} ${sr} 0 0 0 ${cx} ${cy - r}`,  // upper small arc (upward)
  ].join(" ");

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* Glow — blend of both heat colors */}
      {heat > 0 && <>
        <circle cx={cx} cy={cy} r={r + 10} fill={ca} opacity={heat * 0.18} />
        <circle cx={cx} cy={cy} r={r + 10} fill={cb} opacity={heat * 0.12} />
      </>}
      {/* Selection ring */}
      {selected && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#C9A84C" strokeWidth={2} opacity={0.9} />
      )}
      {/* B half — full circle background */}
      <circle cx={cx} cy={cy} r={r} fill={cb} clipPath={`url(#${clipId})`} opacity={0.95} />
      {/* A half — S-lobe path on top */}
      <path d={dA} fill={ca} clipPath={`url(#${clipId})`} opacity={0.95} />
      {/* Small dot in A-half: B color */}
      <circle cx={cx} cy={cy - sr} r={sr * 0.42} fill={cb} />
      {/* Small dot in B-half: A color */}
      <circle cx={cx} cy={cy + sr} r={sr * 0.42} fill={ca} />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={selected ? "#C9A84C" : "#1A0A0F"}
        strokeWidth={selected ? 2 : 0.8} opacity={0.7} />
    </g>
  );
}

const RING_RADII = [90, 165, 230, 295];

function toXY(angle, radius, cx, cy) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function getHeatLevel(entries, nodeId) {
  const w = entries.filter((e) => e.wineId === nodeId);
  if (!w.length) return 0;
  const avg = w.reduce((s,e)=>s+e.rating,0)/w.length;
  return Math.min(1, (w.length/10)*0.5 + (avg/5)*0.5);
}

function lerp(a,b,t){ return a+(b-a)*t; }

function lerpColor(h1,h2,t){
  const p=(h)=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const [r1,g1,b1]=p(h1); const [r2,g2,b2]=p(h2);
  return `rgb(${Math.round(lerp(r1,r2,t))},${Math.round(lerp(g1,g2,t))},${Math.round(lerp(b1,b2,t))})`;
}

function StarRating({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map((s)=>(
        <button key={s} onClick={()=>onChange(s)}
          onMouseEnter={()=>setHov(s)} onMouseLeave={()=>setHov(0)}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:22,
            color:s<=(hov||value)?"#C9A84C":"#3D1A24",transition:"color 0.15s",padding:"0 1px"}}>
          ★
        </button>
      ))}
    </div>
  );
}

function WineWheel({ entries, onNodeClick, selectedNode }) {
  const SIZE=620, CX=310, CY=310;
  const blendFirst = [...WINE_NODES.filter(n=>n.ring===3), ...WINE_NODES.filter(n=>n.ring!==3)];
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{maxWidth:620,display:"block",margin:"0 auto"}}>
      {[0,1,2,3].map((i)=>(
        <circle key={i} cx={CX} cy={CY} r={RING_RADII[i]} fill="none" stroke="#3D0C11"
          strokeWidth={i===3?1.5:1} strokeOpacity={i===3?0.5:0.3}
          strokeDasharray={i===3?"4 3":"none"} />
      ))}
      <circle cx={CX} cy={CY} r={RING_RADII[3]+22} fill="none" stroke="#5A4080" strokeWidth={0.5} strokeOpacity={0.2}/>
      <circle cx={CX} cy={CY} r={50} fill="#1A0A0F" stroke="#3D0C11" strokeWidth={1.5}/>
      <text x={CX} y={CY-8} textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize={12} fill="#C9A84C" letterSpacing={2}>WINE</text>
      <text x={CX} y={CY+10} textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize={12} fill="#C9A84C" letterSpacing={2}>MAP</text>
      {WINE_NODES.filter(n=>n.ring===2).map((n)=>{
        const o=toXY(n.angle,RING_RADII[2]+28,CX,CY), i=toXY(n.angle,50,CX,CY);
        return <line key={n.id+"-sp"} x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke="#3D0C11" strokeWidth={0.5} strokeOpacity={0.25}/>;
      })}
      <text x={CX} y={CY-RING_RADII[3]-8} textAnchor="middle" fontFamily="'Cormorant Garamond',serif"
        fontSize={9} fill="#5A4080" letterSpacing={3} opacity={0.7}>BLENDS</text>
      {blendFirst.map((node)=>{
        const heat=getHeatLevel(entries,node.id);
        const pos=toXY(node.angle,RING_RADII[node.ring],CX,CY);
        const tc=TYPE_COLORS[node.type];
        const col=heat>0?lerpColor(tc.base,tc.heat,heat):tc.base;
        const br=node.ring===3?12:node.ring===0?18:14;
        const nr=br+heat*(node.ring===3?8:12);
        const isSel=selectedNode===node.id;
        const cnt=entries.filter(e=>e.wineId===node.id).length;
        const lines=node.label.split("\n");
        const lr=RING_RADII[node.ring]+nr+(node.ring===3?10:12);
        const lp=toXY(node.angle,lr,CX,CY);
        const dx=lp.x-CX;
        const anc=Math.abs(dx)<12?"middle":dx>0?"start":"end";
        const isBlend=node.type==="blend";
        return (
          <g key={node.id} onClick={()=>onNodeClick(node)} style={{cursor:"pointer"}}>
            {isBlend ? (
              (() => {
                const bc = BLEND_COLORS[node.id] || {
                  a: { base:"#7B1D2E", heat:"#E8334A" },
                  b: { base:"#C9A84C", heat:"#FFF3A3" },
                };
                return <YinYang cx={pos.x} cy={pos.y} r={nr} heat={heat} selected={isSel} colorA={bc.a} colorB={bc.b} />;
              })()
            ) : (
              <>
                {heat>0&&<circle cx={pos.x} cy={pos.y} r={nr+8} fill={col} opacity={heat*0.25}/>}
                {isSel&&<circle cx={pos.x} cy={pos.y} r={nr+5} fill="none" stroke="#C9A84C" strokeWidth={2} opacity={0.9}/>}
                <circle cx={pos.x} cy={pos.y} r={nr} fill={col} opacity={heat>0?0.92:0.55}
                  stroke={isSel?"#C9A84C":"#1A0A0F"} strokeWidth={1}/>
              </>
            )}
            {/* Count badge — only for non-blends to keep yin-yang clean */}
            {cnt>0&&!isBlend&&<text x={pos.x} y={pos.y+1} textAnchor="middle" dominantBaseline="middle"
              fontFamily="Inter,sans-serif" fontSize={8} fontWeight="600" fill="#F2E8D9" opacity={0.9}>{cnt}</text>}
            {/* Count badge for blends — small number below symbol */}
            {cnt>0&&isBlend&&<text x={pos.x} y={pos.y+nr+9} textAnchor="middle"
              fontFamily="Inter,sans-serif" fontSize={7} fill="#AAA" opacity={0.8}>{cnt}×</text>}
            <text x={lp.x} y={lp.y-((lines.length-1)*5)} textAnchor={anc}
              fontFamily="'Cormorant Garamond',serif"
              fontSize={node.ring===3?8.5:node.ring===0?9.5:9}
              fill={heat>0.3?"#F2E8D9":node.ring===3?"#999":"#A07080"}
              style={{pointerEvents:"none"}}>
              {lines.map((l,i)=><tspan key={i} x={lp.x} dy={i===0?0:10}>{l}</tspan>)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Legend() {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:"8px 16px",justifyContent:"center",marginTop:6}}>
      {Object.entries(TYPE_COLORS).map(([type,{base,label}])=>(
        <div key={type} style={{display:"flex",alignItems:"center",gap:5}}>
          {type === "blend" ? (
            <svg width={10} height={10} viewBox="-5 -5 10 10">
              <defs><clipPath id="leg-yy"><circle cx={0} cy={0} r={4.5}/></clipPath></defs>
              <circle cx={0} cy={0} r={4.5} fill="#C9A84C" clipPath="url(#leg-yy)"/>
              <path d="M 0 -4.5 A 4.5 4.5 0 0 1 0 4.5 A 2.25 2.25 0 0 1 0 0 A 2.25 2.25 0 0 0 0 -4.5" fill="#7B1D2E" clipPath="url(#leg-yy)"/>
              <circle cx={0} cy={-2.25} r={0.95} fill="#C9A84C"/>
              <circle cx={0} cy={2.25} r={0.95} fill="#7B1D2E"/>
              <circle cx={0} cy={0} r={4.5} fill="none" stroke="#1A0A0F" strokeWidth={0.5}/>
            </svg>
          ) : (
            <div style={{width:9,height:9,borderRadius:"50%",background:base}}/>
          )}
          <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#A07080",letterSpacing:0.5}}>{label}</span>
        </div>
      ))}
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <div style={{width:9,height:9,borderRadius:"50%",background:"linear-gradient(135deg,#7B1D2E,#E8334A)"}}/>
        <span style={{fontFamily:"Inter,sans-serif",fontSize:10,color:"#A07080",letterSpacing:0.5}}>heat = freq × rating</span>
      </div>
    </div>
  );
}

// ─── Wrapped helpers ──────────────────────────────────────────────────────────

function getMonthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function getYearKey(iso) { return String(new Date(iso).getFullYear()); }

function labelMonth(key) {
  const [y,m] = key.split("-");
  return new Date(y, m-1, 1).toLocaleDateString("en-US",{month:"long",year:"numeric"});
}

// Build cumulative entries up to (and including) a period key
function entriesUpTo(entries, key, mode) {
  return entries.filter(e => {
    const k = mode==="month" ? getMonthKey(e.date) : getYearKey(e.date);
    return k <= key;
  });
}

// Get sorted period keys present in entries
function getPeriodKeys(entries, mode) {
  const keys = new Set(entries.map(e => mode==="month" ? getMonthKey(e.date) : getYearKey(e.date)));
  return [...keys].sort();
}

// Stats for a slice of entries
function computeStats(slice) {
  if (!slice.length) return null;
  const byWine = {};
  slice.forEach(e => {
    if (!byWine[e.wineId]) byWine[e.wineId] = { count:0, ratingSum:0 };
    byWine[e.wineId].count++;
    byWine[e.wineId].ratingSum += e.rating;
  });
  const sorted = Object.entries(byWine).sort((a,b)=>b[1].count-a[1].count);
  const topWineId = sorted[0]?.[0];
  const topNode = WINE_NODES.find(n=>n.id===topWineId);
  const avgRating = (slice.reduce((s,e)=>s+e.rating,0)/slice.length).toFixed(1);
  const byType = {};
  slice.forEach(e=>{
    const node=WINE_NODES.find(n=>n.id===e.wineId);
    if(node){ byType[node.type]=(byType[node.type]||0)+1; }
  });
  const favType = Object.entries(byType).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topRated = Object.entries(byWine)
    .map(([id,v])=>({id,avg:v.ratingSum/v.count,count:v.count}))
    .filter(x=>x.count>=1)
    .sort((a,b)=>b.avg-a.avg)[0];
  const topRatedNode = topRated ? WINE_NODES.find(n=>n.id===topRated.id) : null;
  return { total:slice.length, unique:Object.keys(byWine).length, avgRating,
    topNode, topRatedNode, topRated, favType, byType, sorted };
}

function MiniWineWheel({ entries }) {
  const SIZE=320, CX=160, CY=160;
  const blendFirst=[...WINE_NODES.filter(n=>n.ring===3),...WINE_NODES.filter(n=>n.ring!==3)];
  const MINI_RADII=[48,88,124,158];
  function mXY(angle,radius){
    const rad=((angle-90)*Math.PI)/180;
    return {x:CX+radius*Math.cos(rad),y:CY+radius*Math.sin(rad)};
  }
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{maxWidth:320,display:"block",margin:"0 auto"}}>
      {[0,1,2,3].map(i=>(
        <circle key={i} cx={CX} cy={CY} r={MINI_RADII[i]} fill="none" stroke="#3D0C11"
          strokeWidth={i===3?1:0.7} strokeOpacity={i===3?0.5:0.25}
          strokeDasharray={i===3?"3 2":"none"}/>
      ))}
      <circle cx={CX} cy={CY} r={26} fill="#1A0A0F" stroke="#3D0C11" strokeWidth={1}/>
      <text x={CX} y={CY-4} textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize={7} fill="#C9A84C" letterSpacing={1}>WINE</text>
      <text x={CX} y={CY+6} textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize={7} fill="#C9A84C" letterSpacing={1}>MAP</text>
      {blendFirst.map(node=>{
        const heat=getHeatLevel(entries,node.id);
        const pos=mXY(node.angle,MINI_RADII[node.ring]);
        const tc=TYPE_COLORS[node.type];
        const col=heat>0?lerpColor(tc.base,tc.heat,heat):tc.base;
        const br=node.ring===3?5:node.ring===0?8:6;
        const nr=br+heat*(node.ring===3?4:6);
        const isBlend=node.type==="blend";
        if(isBlend){
          const bc=BLEND_COLORS[node.id]||{a:{base:"#7B1D2E",heat:"#E8334A"},b:{base:"#C9A84C",heat:"#FFF3A3"}};
          return <YinYang key={node.id} cx={pos.x} cy={pos.y} r={nr} heat={heat} selected={false} colorA={bc.a} colorB={bc.b}/>;
        }
        return (
          <g key={node.id}>
            {heat>0&&<circle cx={pos.x} cy={pos.y} r={nr+4} fill={col} opacity={heat*0.2}/>}
            <circle cx={pos.x} cy={pos.y} r={nr} fill={col} opacity={heat>0?0.9:0.4} stroke="#1A0A0F" strokeWidth={0.5}/>
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({label, value, sub, color="#C9A84C"}) {
  return (
    <div style={{background:"#1A0A0F",border:"1px solid #2A0D15",borderRadius:10,
      padding:"14px 16px",flex:"1 1 130px",minWidth:0}}>
      <p style={{fontSize:9,color:"#6B3A4A",letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>{label}</p>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color,lineHeight:1}}>{value}</p>
      {sub&&<p style={{fontSize:10,color:"#7A5060",marginTop:4,lineHeight:1.3}}>{sub}</p>}
    </div>
  );
}

function TypeBar({byType, total}) {
  const order=["red","white","rose","sparkling","fortified","blend"];
  return (
    <div style={{background:"#1A0A0F",border:"1px solid #2A0D15",borderRadius:10,padding:"14px 16px"}}>
      <p style={{fontSize:9,color:"#6B3A4A",letterSpacing:1.5,marginBottom:10,textTransform:"uppercase"}}>By Type</p>
      {order.filter(t=>byType[t]).map(t=>{
        const pct=Math.round((byType[t]/total)*100);
        const tc=TYPE_COLORS[t];
        return (
          <div key={t} style={{marginBottom:7}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:10,color:"#A07080"}}>{tc.label}</span>
              <span style={{fontSize:10,color:"#C9A84C"}}>{byType[t]} ({pct}%)</span>
            </div>
            <div style={{height:4,background:"#0D0508",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:tc.base,
                transition:"width 0.6s ease",borderRadius:2}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WrappedTab({ entries }) {
  const [mode, setMode]       = useState("month"); // "month" | "year"
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame]     = useState(0);
  const intervalRef           = useRef(null);

  const allKeys   = getPeriodKeys(entries, mode);
  const hasData   = allKeys.length > 0;
  const curKey    = allKeys[frame] || null;
  const curLabel  = curKey ? (mode==="month" ? labelMonth(curKey) : curKey) : "—";

  // entries for the current period only (for "what happened this period")
  const periodEntries = curKey
    ? entries.filter(e=>(mode==="month"?getMonthKey(e.date):getYearKey(e.date))===curKey)
    : [];
  // cumulative entries up to current frame (for map heat)
  const cumulEntries  = curKey ? entriesUpTo(entries, curKey, mode) : [];
  const periodStats   = computeStats(periodEntries);
  const cumulStats    = computeStats(cumulEntries);

  const stop = useCallback(()=>{
    clearInterval(intervalRef.current);
    setPlaying(false);
  },[]);

  const play = useCallback(()=>{
    if(!allKeys.length) return;
    setPlaying(true);
    setFrame(0);
    intervalRef.current = setInterval(()=>{
      setFrame(f=>{
        if(f>=allKeys.length-1){ clearInterval(intervalRef.current); setPlaying(false); return f; }
        return f+1;
      });
    }, 1400);
  },[allKeys.length]);

  useEffect(()=>()=>clearInterval(intervalRef.current),[]);
  // Reset frame when mode or entries change
  useEffect(()=>{ stop(); setFrame(0); },[mode, entries.length]);

  if(!hasData) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      minHeight:300,gap:12,padding:32}}>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#3D1A24"}}>No tastings yet</p>
      <p style={{fontSize:12,color:"#2A0D15",textAlign:"center"}}>
        Log some wines first — your Wrapped will appear here.
      </p>
    </div>
  );

  return (
    <div style={{padding:"20px 16px",maxWidth:900,margin:"0 auto"}}>
      {/* Mode + playback controls */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {["month","year"].map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{
            background:mode===m?"#3D0C11":"none",
            border:`1px solid ${mode===m?"#C9A84C":"#2A0D15"}`,
            borderRadius:20,padding:"5px 14px",cursor:"pointer",
            color:mode===m?"#C9A84C":"#6B3A4A",
            fontFamily:"Inter,sans-serif",fontSize:11,letterSpacing:1,textTransform:"uppercase"}}>
            {m==="month"?"Monthly":"Yearly"}
          </button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={playing?stop:play} style={{
          background:"#7B1D2E",border:"1px solid #C9A84C",borderRadius:20,
          padding:"6px 18px",cursor:"pointer",color:"#C9A84C",
          fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:600,letterSpacing:1}}>
          {playing?"⏹ Stop":"▶ Play"}
        </button>
      </div>

      {/* Timeline scrubber */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#C9A84C",fontWeight:600}}>
            {curLabel}
          </span>
          <span style={{fontSize:11,color:"#6B3A4A",alignSelf:"flex-end"}}>
            {frame+1} / {allKeys.length}
          </span>
        </div>
        <input type="range" min={0} max={allKeys.length-1} value={frame}
          onChange={e=>{stop();setFrame(Number(e.target.value));}}
          style={{width:"100%",accentColor:"#C9A84C",cursor:"pointer"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
          <span style={{fontSize:9,color:"#3D1A24"}}>{mode==="month"?labelMonth(allKeys[0]):allKeys[0]}</span>
          <span style={{fontSize:9,color:"#3D1A24"}}>{mode==="month"?labelMonth(allKeys[allKeys.length-1]):allKeys[allKeys.length-1]}</span>
        </div>
      </div>

      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        {/* Left: mini map */}
        <div style={{flex:"0 0 320px",minWidth:0}}>
          <p style={{fontSize:9,color:"#6B3A4A",letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>
            Cumulative Heat Map
          </p>
          <MiniWineWheel entries={cumulEntries}/>
        </div>

        {/* Right: stats */}
        <div style={{flex:"1 1 260px",display:"flex",flexDirection:"column",gap:12,minWidth:0}}>
          {/* This period */}
          <p style={{fontSize:9,color:"#6B3A4A",letterSpacing:1.5,textTransform:"uppercase"}}>
            This {mode==="month"?"Month":"Year"}
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <StatCard label="Tastings" value={periodEntries.length} sub={`${periodStats?.unique||0} varieties`}/>
            <StatCard label="Avg Rating" value={periodStats?.avgRating||"—"} sub="out of 5"/>
            <StatCard label="Top Wine"
              value={periodStats?.topNode?.label.replace("\n"," ")||"—"}
              sub={periodStats?.sorted[0]?`${periodStats.sorted[0][1].count}×`:""}
              color="#E8334A"/>
          </div>
          {periodStats?.byType && <TypeBar byType={periodStats.byType} total={periodEntries.length}/>}

          {/* All time */}
          <p style={{fontSize:9,color:"#6B3A4A",letterSpacing:1.5,textTransform:"uppercase",marginTop:4}}>
            All Time (through {curLabel})
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <StatCard label="Total" value={cumulEntries.length} sub={`${cumulStats?.unique||0} varieties tried`}/>
            <StatCard label="Favourite" value={cumulStats?.topNode?.label.replace("\n"," ")||"—"}
              sub={cumulStats?.sorted[0]?`${cumulStats.sorted[0][1].count} tastings`:""} color="#E8334A"/>
            <StatCard label="Highest Rated" value={cumulStats?.topRatedNode?.label.replace("\n"," ")||"—"}
              sub={cumulStats?.topRated?`avg ${cumulStats.topRated.avg.toFixed(1)} ★`:""} color="#C9A84C"/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function WineApp() {
  const [entries, setEntries] = useState(()=>{
    try{return JSON.parse(localStorage.getItem("wine-entries")||"[]");}catch{return [];}
  });
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState("");
  const [vintage, setVintage] = useState("");
  const [activeTab, setActiveTab] = useState("map");
  const [toast, setToast] = useState(null);

  useEffect(()=>{localStorage.setItem("wine-entries",JSON.stringify(entries));},[entries]);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),2500);};

  // Map tap: toggle single node (still single-select on map for info card)
  const [mapSelected, setMapSelected] = useState(null);
  const handleNodeClick=(node)=>setMapSelected(n=>n===node.id?null:node.id);

  // Log tab: toggle a wine in/out of the multi-select set
  const toggleWine=(id)=>setSelectedNodes(prev=>{
    const next=new Set(prev);
    next.has(id)?next.delete(id):next.add(id);
    return next;
  });

  const handleLog=()=>{
    if(!selectedNodes.size)return;
    const now=new Date().toISOString();
    const newEntries=[...selectedNodes].map((wineId,i)=>({
      id: Date.now()+i,
      wineId,
      rating,
      note,
      vintage,
      date: now,
    }));
    setEntries(p=>[...p,...newEntries]);
    const count=selectedNodes.size;
    showToast(count===1
      ? `Logged ${WINE_NODES.find(n=>n.id==[...selectedNodes][0])?.label.replace("\n"," ")}!`
      : `Logged ${count} wines!`
    );
    setNote("");setVintage("");setRating(3);setSelectedNodes(new Set());
  };
  const handleDelete=(id)=>setEntries(p=>p.filter(e=>e.id!==id));

  const selNode=WINE_NODES.find(n=>n.id===mapSelected);
  const selEntries=entries.filter(e=>e.wineId===mapSelected);
  const total=entries.length;
  const unique=new Set(entries.map(e=>e.wineId)).size;
  const avg=entries.length?(entries.reduce((s,e)=>s+e.rating,0)/entries.length).toFixed(1):"—";
  const recent=[...entries].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);
  const blendNodes=WINE_NODES.filter(n=>n.type==="blend");
  const singleNodes=WINE_NODES.filter(n=>n.type!=="blend");

  return (
    <div style={{minHeight:"100vh",background:"#0D0508",color:"#F2E8D9",fontFamily:"Inter,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#1A0A0F;}::-webkit-scrollbar-thumb{background:#3D0C11;border-radius:2px;}
        textarea{resize:vertical;}
        select option{background:#1A0A0F;color:#F2E8D9;}
        select optgroup{background:#0D0508;color:#6B3A4A;}
      `}</style>

      <header style={{borderBottom:"1px solid #2A0D15",padding:"14px 24px",display:"flex",
        alignItems:"center",justifyContent:"space-between",background:"#0D0508"}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:"#C9A84C",letterSpacing:2}}>VINO MAP</h1>
          <p style={{fontSize:11,color:"#6B3A4A",letterSpacing:1,marginTop:1}}>YOUR PERSONAL WINE HEAT MAP</p>
        </div>
        <div style={{display:"flex",gap:20,textAlign:"center"}}>
          {[["Tastings",total],["Varieties",unique],["Avg Rating",avg]].map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:"#C9A84C",fontWeight:600}}>{v}</div>
              <div style={{fontSize:10,color:"#6B3A4A",letterSpacing:0.5}}>{l}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{display:"flex",borderBottom:"1px solid #2A0D15",background:"#0D0508"}}>
        {["map","log","wrapped"].map((tab)=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{
            flex:1,padding:"10px",background:"none",border:"none",cursor:"pointer",
            color:activeTab===tab?"#C9A84C":"#6B3A4A",
            borderBottom:activeTab===tab?"2px solid #C9A84C":"2px solid transparent",
            fontFamily:"Inter,sans-serif",fontSize:12,letterSpacing:1,textTransform:"uppercase",fontWeight:500}}>
            {tab==="map"?"🍷 Wine Map":tab==="log"?"📋 Log & History":"✨ Wrapped"}
          </button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"row",maxWidth:1200,margin:"0 auto"}}>

        {/* Map */}
        <div style={{display:activeTab==="map"?"flex":"none",flexDirection:"column",
          flex:"1 1 620px",padding:"20px 16px 16px",gap:10}}>
          <WineWheel entries={entries} onNodeClick={handleNodeClick} selectedNode={mapSelected}/>
          <Legend/>
          {selNode && (
            <div style={{marginTop:6,background:"#1A0A0F",border:"1px solid #3D0C11",borderRadius:8,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    {selNode.type === "blend" ? (
                      <svg width={13} height={13} viewBox="-6 -6 12 12" style={{flexShrink:0}}>
                        <defs><clipPath id="inf-yy"><circle cx={0} cy={0} r={5.5}/></clipPath></defs>
                        <circle cx={0} cy={0} r={5.5} fill="#C9A84C" clipPath="url(#inf-yy)"/>
                        <path d="M 0 -5.5 A 5.5 5.5 0 0 1 0 5.5 A 2.75 2.75 0 0 1 0 0 A 2.75 2.75 0 0 0 0 -5.5" fill="#7B1D2E" clipPath="url(#inf-yy)"/>
                        <circle cx={0} cy={-2.75} r={1.15} fill="#C9A84C"/>
                        <circle cx={0} cy={2.75} r={1.15} fill="#7B1D2E"/>
                        <circle cx={0} cy={0} r={5.5} fill="none" stroke="#1A0A0F" strokeWidth={0.7}/>
                      </svg>
                    ) : (
                      <div style={{width:10,height:10,borderRadius:"50%",flexShrink:0,
                        background:TYPE_COLORS[selNode.type].base}}/>
                    )}
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#C9A84C",fontWeight:600}}>
                      {selNode.label.replace("\n"," ")}
                    </h3>
                  </div>
                  <p style={{fontSize:11,color:"#6B3A4A",letterSpacing:0.5,marginBottom:selNode.type==="blend"?8:0}}>
                    {TYPE_COLORS[selNode.type].label} · {selEntries.length} tasting{selEntries.length!==1?"s":""}
                  </p>
                  {selNode.type==="blend"&&BLEND_COMPOSITIONS[selNode.id]&&(
                    <div style={{background:"#0D0508",borderRadius:6,padding:"8px 10px",border:"1px solid #2A1A40"}}>
                      <p style={{fontSize:10,color:"#888",letterSpacing:1,marginBottom:3}}>CLASSIC COMPOSITION</p>
                      <p style={{fontSize:12,color:"#BBB",fontStyle:"italic"}}>{BLEND_COMPOSITIONS[selNode.id]}</p>
                    </div>
                  )}
                </div>
                <button onClick={()=>setActiveTab("log")} style={{
                  background:"#3D0C11",border:"1px solid #7B1D2E",borderRadius:6,
                  color:"#C9A84C",padding:"6px 14px",cursor:"pointer",
                  fontSize:12,fontFamily:"Inter,sans-serif",fontWeight:500,flexShrink:0}}>
                  Log Tasting →
                </button>
              </div>
            </div>
          )}
          {!mapSelected&&(
            <p style={{textAlign:"center",color:"#3D1A24",fontSize:12,letterSpacing:0.5,marginTop:4}}>
              Tap any variety or blend · outer dashed ring = blends
            </p>
          )}
        </div>

        {/* Log */}
        <div style={{display:activeTab==="log"?"flex":"none",flexDirection:"column",
          flex:"0 0 340px",borderLeft:"1px solid #2A0D15",background:"#0D0508",
          padding:"20px 16px",gap:0,overflowY:"auto",maxHeight:"calc(100vh - 100px)"}}>
          <div style={{background:"#1A0A0F",borderRadius:10,border:"1px solid #2A0D15",padding:16,marginBottom:16}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#C9A84C",marginBottom:12}}>Log a Tasting</h3>

            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                <label style={{fontSize:10,color:"#6B3A4A",letterSpacing:1}}>SELECT WINES</label>
                {selectedNodes.size>0&&(
                  <button onClick={()=>setSelectedNodes(new Set())}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#5A2030",padding:0}}>
                    clear all
                  </button>
                )}
              </div>
              {/* Selected pills */}
              {selectedNodes.size>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                  {[...selectedNodes].map(id=>{
                    const n=WINE_NODES.find(x=>x.id===id);
                    const isBlend=n?.type==="blend";
                    const tc=n?TYPE_COLORS[n.type]:null;
                    return (
                      <div key={id} style={{display:"flex",alignItems:"center",gap:4,
                        background:"#2A0D15",border:"1px solid #7B1D2E",borderRadius:20,
                        padding:"3px 8px 3px 6px",fontSize:11,color:"#F2E8D9"}}>
                        {isBlend?(
                          <svg width={8} height={8} viewBox="-4 -4 8 8">
                            <defs><clipPath id={`pill-${id}`}><circle cx={0} cy={0} r={3.5}/></clipPath></defs>
                            <circle cx={0} cy={0} r={3.5} fill="#C9A84C" clipPath={`url(#pill-${id})`}/>
                            <path d="M 0 -3.5 A 3.5 3.5 0 0 1 0 3.5 A 1.75 1.75 0 0 1 0 0 A 1.75 1.75 0 0 0 0 -3.5" fill="#7B1D2E" clipPath={`url(#pill-${id})`}/>
                          </svg>
                        ):(
                          <div style={{width:6,height:6,borderRadius:"50%",background:tc?.base,flexShrink:0}}/>
                        )}
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12}}>
                          {n?.label.replace("\n"," ")}
                        </span>
                        <button onClick={()=>toggleWine(id)}
                          style={{background:"none",border:"none",cursor:"pointer",color:"#5A2030",
                            fontSize:12,padding:"0 0 0 2px",lineHeight:1}}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Grouped pill buttons */}
              {[
                {label:"Reds",    nodes:singleNodes.filter(n=>n.type==="red")},
                {label:"Whites",  nodes:singleNodes.filter(n=>n.type==="white")},
                {label:"Rosé",    nodes:singleNodes.filter(n=>n.type==="rose")},
                {label:"Sparkling",nodes:singleNodes.filter(n=>n.type==="sparkling")},
                {label:"Fortified",nodes:singleNodes.filter(n=>n.type==="fortified")},
                {label:"Blends",  nodes:blendNodes},
              ].map(({label,nodes})=>(
                <div key={label} style={{marginBottom:8}}>
                  <p style={{fontSize:9,color:"#3D1A24",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>{label}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {nodes.map(n=>{
                      const on=selectedNodes.has(n.id);
                      const isBlend=n.type==="blend";
                      const tc=TYPE_COLORS[n.type];
                      return (
                        <button key={n.id} onClick={()=>toggleWine(n.id)} style={{
                          display:"flex",alignItems:"center",gap:4,
                          background: on?"#3D0C11":"#130508",
                          border:`1px solid ${on?"#C9A84C":"#2A0D15"}`,
                          borderRadius:20,padding:"4px 9px",cursor:"pointer",
                          color: on?"#C9A84C":"#7A5060",
                          fontSize:11,fontFamily:"Inter,sans-serif",
                          transition:"all 0.15s",
                        }}>
                          {isBlend?(
                            <svg width={7} height={7} viewBox="-3.5 -3.5 7 7" style={{flexShrink:0}}>
                              <defs><clipPath id={`btn-${n.id}`}><circle cx={0} cy={0} r={3}/></clipPath></defs>
                              <circle cx={0} cy={0} r={3} fill={on?"#D4A830":"#8B6B10"} clipPath={`url(#btn-${n.id})`}/>
                              <path d="M 0 -3 A 3 3 0 0 1 0 3 A 1.5 1.5 0 0 1 0 0 A 1.5 1.5 0 0 0 0 -3" fill={on?"#C0253D":"#5C1020"} clipPath={`url(#btn-${n.id})`}/>
                            </svg>
                          ):(
                            <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                              background: on ? tc.heat : tc.base, opacity: on?1:0.7}}/>
                          )}
                          {n.label.replace("\n"," ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectedNodes.size>0&&BLEND_COMPOSITIONS[[...selectedNodes].find(id=>BLEND_COMPOSITIONS[id])]&&(
                <p style={{fontSize:10,color:"#888",marginTop:4,fontStyle:"italic",lineHeight:1.4}}>
                  {BLEND_COMPOSITIONS[[...selectedNodes].find(id=>BLEND_COMPOSITIONS[id])]}
                </p>
              )}
            </div>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,color:"#6B3A4A",letterSpacing:1,display:"block",marginBottom:5}}>RATING</label>
              <StarRating value={rating} onChange={setRating}/>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,color:"#6B3A4A",letterSpacing:1,display:"block",marginBottom:5}}>VINTAGE (OPTIONAL)</label>
              <input type="text" placeholder="e.g. 2019" value={vintage} onChange={(e)=>setVintage(e.target.value)} maxLength={4}
                style={{width:"100%",background:"#0D0508",border:"1px solid #3D0C11",borderRadius:6,
                  color:"#F2E8D9",padding:"8px 10px",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none"}}/>
            </div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,color:"#6B3A4A",letterSpacing:1,display:"block",marginBottom:5}}>TASTING NOTE (OPTIONAL)</label>
              <textarea placeholder="Dark fruit, hint of oak..." value={note} onChange={(e)=>setNote(e.target.value)} rows={3}
                style={{width:"100%",background:"#0D0508",border:"1px solid #3D0C11",borderRadius:6,
                  color:"#F2E8D9",padding:"8px 10px",fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",minHeight:72}}/>
            </div>

            <button onClick={handleLog} disabled={!selectedNodes.size} style={{
              width:"100%",padding:"10px",
              background:selectedNodes.size?"#7B1D2E":"#2A0D15",
              border:"1px solid",borderColor:selectedNodes.size?"#C9A84C":"#2A0D15",
              borderRadius:7,color:selectedNodes.size?"#C9A84C":"#3D1A24",
              cursor:selectedNodes.size?"pointer":"not-allowed",
              fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,letterSpacing:1}}>
              {selectedNodes.size>1?`Record ${selectedNodes.size} Tastings`:"Record Tasting"}
            </button>
          </div>

          <div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#6B3A4A",letterSpacing:1,marginBottom:10}}>
              RECENT TASTINGS
            </h3>
            {recent.length===0&&(
              <p style={{color:"#3D1A24",fontSize:12,textAlign:"center",padding:"20px 0"}}>
                No tastings logged yet. Start exploring the map!
              </p>
            )}
            {recent.map((entry)=>{
              const node=WINE_NODES.find(n=>n.id===entry.wineId);
              const tc=node?TYPE_COLORS[node.type]:null;
              const isBlend=node?.type==="blend";
              return (
                <div key={entry.id} style={{background:"#1A0A0F",border:"1px solid #2A0D15",borderRadius:8,
                  padding:"10px 12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      {tc&&(isBlend ? (
                        <svg width={9} height={9} viewBox="-4.5 -4.5 9 9" style={{flexShrink:0}}>
                          <defs><clipPath id={`h-yy-${entry.id}`}><circle cx={0} cy={0} r={4}/></clipPath></defs>
                          <circle cx={0} cy={0} r={4} fill="#C9A84C" clipPath={`url(#h-yy-${entry.id})`}/>
                          <path d="M 0 -4 A 4 4 0 0 1 0 4 A 2 2 0 0 1 0 0 A 2 2 0 0 0 0 -4" fill="#7B1D2E" clipPath={`url(#h-yy-${entry.id})`}/>
                          <circle cx={0} cy={-2} r={0.85} fill="#C9A84C"/>
                          <circle cx={0} cy={2} r={0.85} fill="#7B1D2E"/>
                          <circle cx={0} cy={0} r={4} fill="none" stroke="#1A0A0F" strokeWidth={0.5}/>
                        </svg>
                      ) : (
                        <div style={{width:7,height:7,borderRadius:"50%",background:tc.base,flexShrink:0}}/>
                      ))}
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,
                        color:isBlend?"#BBB":"#C9A84C",fontWeight:600,
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {node?.label.replace("\n"," ")} {entry.vintage&&`'${entry.vintage.slice(-2)}`}
                      </span>
                    </div>
                    <div style={{color:"#C9A84C",fontSize:12,marginBottom:2}}>
                      {"★".repeat(entry.rating)}{"☆".repeat(5-entry.rating)}
                    </div>
                    {entry.note&&<p style={{fontSize:11,color:"#7A5060",fontStyle:"italic",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.note}</p>}
                    <p style={{fontSize:10,color:"#3D1A24",marginTop:3}}>
                      {new Date(entry.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                    </p>
                  </div>
                  <button onClick={()=>handleDelete(entry.id)}
                    style={{background:"none",border:"none",color:"#3D1A24",cursor:"pointer",fontSize:14,padding:"0 0 0 8px",flexShrink:0}}
                    onMouseEnter={(e)=>e.target.style.color="#7B1D2E"}
                    onMouseLeave={(e)=>e.target.style.color="#3D1A24"}>✕</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wrapped */}
        {activeTab==="wrapped" && (
          <div style={{flex:1}}>
            <WrappedTab entries={entries}/>
          </div>
        )}
      </div>

      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
          background:"#7B1D2E",border:"1px solid #C9A84C",borderRadius:8,padding:"10px 20px",
          color:"#C9A84C",fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,
          letterSpacing:0.5,zIndex:100,pointerEvents:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          {toast}
        </div>
      )}
    </div>
  );
}
