import {useEffect,useState} from "react";
export default function FeaturePack(){
 const token=localStorage.getItem('portfolio_token')||localStorage.getItem('domain_recovery_token')||'';
 const [insights,setInsights]=useState([]); const [q,setQ]=useState("");
 useEffect(()=>{ if(!token) return; fetch("/api/insights/domain",{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setInsights(d.insights||[])).catch(()=>setInsights([])); },[token]);
 const dl=(f)=>{ fetch(`/api/records/export?format=${f}&q=${encodeURIComponent(q)}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.blob()).then(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`records.${f}`;a.click();}); };
 return <section aria-label="Insights and export"><h2>Insights (deterministic fallback)</h2><p>aiGenerated: false — computed from your records, no provider call.</p>
 <label>Search records <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search main list"/></label>
 <button type="button" onClick={()=>dl("csv")}>Export CSV</button><button type="button" onClick={()=>dl("json")}>Export JSON</button>
 {insights.map(i=><article key={i.id}><h3>{i.title}</h3><p>aiGenerated: false</p><dl>{i.sections.map(s=><div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl></article>)}
 </section>;
}
