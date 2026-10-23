// Feature pack: search/filter, export, deterministic domain insights (offline, no provider calls).
export function displayValue(v){ if(v===false) return "false"; if(v===0||v==="0") return "0"; if(v===""||v==null) return "—"; return String(v); }
export function filterRecords(rows=[],{q="",status="",risk="",workflow=""}={}){
  const needle=String(q).trim().toLowerCase();
  return rows.filter(r=>{
    if(status && String(r.status??"")!==status) return false;
    if(risk && String(r.risk??"")!==risk) return false;
    if(workflow && String(r.workflow_id??r.workflowId??r.feature_id??"")!==workflow) return false;
    if(!needle) return true;
    return Object.values(r??{}).some(v=>v!=null && String(v).toLowerCase().includes(needle));
  });
}
function esc(v){ const s=displayValue(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
export function toCSV(rows=[]){
  const cols=[...new Set(rows.flatMap(r=>Object.keys(r??{})))];
  if(!cols.length) return "id\n";
  return [cols.join(","),...rows.map(r=>cols.map(c=>esc(r?.[c])).join(","))].join("\n")+"\n";
}
export function exportRecords(rows=[],format="json"){
  return format==="csv" ? {contentType:"text/csv",filename:"records.csv",body:toCSV(rows)} : {contentType:"application/json",filename:"records.json",body:JSON.stringify(rows,null,2)};
}
export function labelledSections(record={}){
  return Object.entries(record??{}).map(([label,value])=>({label,value:displayValue(value),raw:value??null}));
}
export function domainInsights(records=[],kind="general"){
  const n=records.length;
  const open=records.filter(r=>!["DONE","Closed","Approved","CANCELLED"].includes(String(r.status??""))).length;
  const high=records.filter(r=>["High","Critical"].includes(String(r.risk??""))).length;
  const amount=records.reduce((s,r)=>s+(Number(r.amount)||0),0);
  const sum=(label,value)=>({label,value:displayValue(value)});
  const mk=(id,title,sections)=>({id,title,aiGenerated:false,source:"deterministic-fallback",sections});
  if(kind==="customs") return [
    mk("drawback-exposure","Drawback exposure summary",[sum("Records reviewed",n),sum("Open claims",open),sum("High-risk claims",high),sum("Total claim amount",amount)]),
    mk("match-readiness","Import–export match readiness",[sum("Records reviewed",n),sum("High-risk claims",high),sum("Requires evidence review",open>0?"Yes":"No")]),
    mk("recovery-priority","Recovery priority queue",[sum("Open claims",open),sum("Total claim amount",amount),sum("Next step",open?"Assign owner and validate entry/export evidence":"No open claims")])];
  if(kind==="cyber") return [
    mk("claim-exposure","Claim exposure summary",[sum("Records reviewed",n),sum("Open claims",open),sum("High/Critical risk",high),sum("Total amount",amount)]),
    mk("incident-readiness","Incident readiness gaps",[sum("Records reviewed",n),sum("Open claims",open),sum("Requires review",high>0?"Yes":"No")]),
    mk("recovery-priority","Recovery priority queue",[sum("High/Critical risk",high),sum("Total amount",amount),sum("Next step",open?"Triaging open claims by risk and due date":"No open claims")])];
  if(kind==="dairy") return [
    mk("settlement-exposure","Settlement exposure summary",[sum("Records reviewed",n),sum("Open settlements",open),sum("High-risk audits",high),sum("Total amount",amount)]),
    mk("component-variance","Milk component variance watch",[sum("Records reviewed",n),sum("High-risk audits",high),sum("Requires lab review",open>0?"Yes":"No")]),
    mk("payment-priority","Producer payment priority",[sum("Open settlements",open),sum("Total amount",amount),sum("Next step",open?"Reconcile weights, tests and deductions":"No open settlements")])];
  return [mk("overview","Records overview",[sum("Records reviewed",n),sum("Open",open),sum("High risk",high)])];
}
export function mountFeaturePack(app,{pool,auth,kind,table="workflow_cases"}){
  const guard=typeof auth==="function"?auth:(_r,_s,n)=>n();
  app.get("/api/records/export",guard,async(req,res)=>{
    const rows=(await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 10000`)).rows;
    const out=exportRecords(filterRecords(rows,req.query),String(req.query.format||"json"));
    res.setHeader("Content-Type",out.contentType); res.setHeader("Content-Disposition",`attachment; filename="${out.filename}"`); res.send(out.body);
  });
  app.get("/api/insights/domain",guard,async(_req,res)=>{
    const rows=(await pool.query(`SELECT * FROM ${table} LIMIT 10000`)).rows;
    res.json({aiGenerated:false,insights:domainInsights(rows,kind)});
  });
}
