const {chromium}=require('playwright');
const OUT=process.env.SP+'/';
let fails=0;
const ok=(cond,msg)=>{ console.log((cond?'ok   ':'FAIL ')+msg); if(!cond) fails++; };
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await ctx.addInitScript(()=>{ window.claude={use:async()=>({publish:async()=>({version:'v1'})})}; });
 const p=await ctx.newPage();
 p.on('pageerror',e=>{ console.log('PAGEERROR:',e.message); fails++; });
 await p.goto('file:///home/user/Phoenix-2026/index.html');
 await p.waitForTimeout(600);

 await p.click('[data-tab="setup"]'); await p.waitForTimeout(250);
 ok(await p.locator('.lock').count()===1, 'setup opens locked');
 ok(await p.locator('[data-pn="0"]').count()===0, 'player fields not in the DOM while locked');
 ok(await p.locator('[data-reset]').count()===0, 'clear-all-scores is behind the lock');
 await p.screenshot({path:OUT+'20-lock.png',fullPage:true});

 // wrong password
 await p.fill('#pw','hunter2'); await p.click('[data-unlock]'); await p.waitForTimeout(150);
 ok(await p.locator('.lock').count()===1, 'wrong password stays locked');
 ok((await p.locator('#pwerr').textContent()).includes('not the password'), 'wrong password explains itself');
 ok(await p.inputValue('#pw')==='', 'field clears after a wrong try');

 // capitalised, as a phone keyboard would produce
 await p.fill('#pw','Josie'); await p.click('[data-unlock]'); await p.waitForTimeout(250);
 ok(await p.locator('.lock').count()===0, 'auto-capitalised "Josie" is accepted');
 ok(await p.locator('[data-pn="0"]').count()===1, 'setup fields render once unlocked');
 await p.screenshot({path:OUT+'21-unlocked.png',fullPage:true});

 // other tabs were never gated
 await p.click('[data-tab="rounds"]'); await p.waitForTimeout(200);
 ok(await p.locator('[data-p="r1|p1"]').count()===1, 'scoring stays open to everyone');

 // persists across reload
 await p.reload(); await p.waitForTimeout(600);
 await p.click('[data-tab="setup"]'); await p.waitForTimeout(250);
 ok(await p.locator('.lock').count()===0, 'stays unlocked after a reload');

 // lock again
 await p.click('[data-lock]'); await p.waitForTimeout(250);
 ok(await p.locator('.lock').count()===1, 'Lock button re-locks');

 // a different device starts locked
 const ctx2=await b.newContext({viewport:{width:390,height:844}});
 await ctx2.addInitScript(()=>{ window.claude={use:async()=>({publish:async()=>({version:'v1'})})}; });
 const p2=await ctx2.newPage();
 await p2.goto('file:///home/user/Phoenix-2026/index.html'); await p2.waitForTimeout(600);
 await p2.click('[data-tab="setup"]'); await p2.waitForTimeout(250);
 ok(await p2.locator('.lock').count()===1, 'another browser starts locked');
 // enter key works there
 await p2.fill('#pw','josie'); await p2.press('#pw','Enter'); await p2.waitForTimeout(250);
 ok(await p2.locator('.lock').count()===0, 'Enter key submits the password');

 await b.close();
 console.log(fails? '\n'+fails+' FAILED' : '\nAll lock tests passed');
 process.exit(fails?1:0);
})();
