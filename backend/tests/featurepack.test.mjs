import test from "node:test"; import assert from "node:assert/strict";
import {filterRecords,toCSV,exportRecords,domainInsights,labelledSections} from "../featurepack.mjs";
const rows=[{id:1,title:"Alpha claim",status:"OPEN",risk:"High",amount:0,verified:false,note:""},{id:2,title:"Beta",status:"DONE",risk:"Low",amount:50,verified:true}];
test("search/filter preserves matches",()=>{ assert.equal(filterRecords(rows,{q:"alpha"}).length,1); assert.equal(filterRecords(rows,{status:"DONE"})[0].id,2); assert.equal(filterRecords(rows,{risk:"High"}).length,1); });
test("export csv/json",()=>{ assert.ok(toCSV(rows).includes("Alpha claim")); assert.equal(JSON.parse(exportRecords(rows,"json").body).length,2); assert.ok(exportRecords(rows,"csv").body.includes("false")); });
test("insights fallback labelled, preserves false/0/empty",()=>{ const ins=domainInsights(rows,"cyber"); assert.equal(ins.length,3); assert.ok(ins.every(i=>i.aiGenerated===false)); const s=labelledSections(rows[0]); assert.ok(s.find(x=>x.label==="amount"&&x.value==="0")); assert.ok(s.find(x=>x.label==="verified"&&x.value==="false")); assert.ok(s.find(x=>x.label==="note"&&x.value==="—")); });
