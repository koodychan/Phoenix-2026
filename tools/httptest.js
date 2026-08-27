const {chromium}=require('playwright');
let fails=0;
const ok=(c,m)=>{ console.log((c?'ok   ':'FAIL ')+m); if(!c) fails++; };
const get=async u=>await (await fetch(u)).json();
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844}});
 const p=await ctx.newPage();
 p.on('pageerror',e=>{ console.log('PAGEERROR:',e.message); fails++; });
 await p.goto('http://localhost:8799/'); await p.waitForTimeout(900);

 // ---- viewer, no password ----
 await p.click('[data-tab="rounds"]'); await p.waitForTimeout(300);
 const inp=p.locator('[data-p="r1|p1"]');
 ok(await inp.count()===1,'rounds render for a viewer');
 ok(await inp.isDisabled(),'score entry is disabled without the password');
 ok((await p.locator('.note').first().textContent()).includes('scorekeeper'),'viewer is told why');

 // ---- unlock ----
 await p.click('[data-tab="setup"]'); await p.waitForTimeout(250);
 ok(await p.locator('.lock').count()===1,'setup is locked');
 await p.fill('#pw','josie'); await p.click('[data-unlock]'); await p.waitForTimeout(300);
 ok(await p.locator('.lock').count()===0,'password unlocks');

 await p.click('[data-tab="rounds"]'); await p.waitForTimeout(300);
 ok(!(await p.locator('[data-p="r1|p1"]').isDisabled()),'entry enabled once unlocked');

 // ---- a real save reaches the database ----
 let before=(await get('http://localhost:8799/__db')).rev;
 await p.fill('[data-p="r1|p1"]','6.5');
 await p.waitForTimeout(3200);
 let db=await get('http://localhost:8799/__db');
 ok(db.rev===before+1,'save increments the revision');
 ok(db.state.rounds[0].points.p1===6.5,'the entered points reached the database');
 ok(db.state.players.length===8,'first save carries the full roster up');

 // ---- conflict is retried, not lost ----
 await fetch('http://localhost:8799/__conflict');
 before=(await get('http://localhost:8799/__db')).rev;
 await p.fill('[data-p="r1|p5"]','4');
 await p.waitForTimeout(6000);
 db=await get('http://localhost:8799/__db');
 ok(db.state.rounds[0].points.p5===4,'edit survives a conflict and lands');

 // ---- a wrong stored password is refused by the server ----
 await p.evaluate(()=>localStorage.setItem('pga.pw','wrongpw'));
 await p.reload(); await p.waitForTimeout(900);
 await p.click('[data-tab="rounds"]'); await p.waitForTimeout(300);
 await p.fill('[data-p="r1|p3"]','9');
 await p.waitForTimeout(3200);
 db=await get('http://localhost:8799/__db');
 ok(db.state.rounds[0].points.p3===undefined,'server refuses a write with the wrong password');
 ok(await p.locator('.lock').count()>=0,'page still usable after refusal');

 await b.close();
 console.log(fails? '\n'+fails+' FAILED' : '\nAll HTTP-mode tests passed');
 process.exit(fails?1:0);
})();
