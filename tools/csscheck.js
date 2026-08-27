/* Every selector written in the <style> block must survive CSS parsing.
   A malformed rule silently swallows the rule that follows it, so compare
   the source against the browser's parsed CSSOM. */
const {chromium}=require('playwright');
const fs=require('fs');

function sourceSelectors(css){
  css=css.replace(/\/\*[\s\S]*?\*\//g,'');   // comments are not selectors
  const out=[]; let buf='', depth=0;
  for(const ch of css){
    if(ch==='{'){
      const sel=buf.trim();
      const step=/^(from|to|[\d.]+%)$/i.test(sel);   // @keyframes steps aren't selectorText
      if(sel && !sel.startsWith('@') && !sel.includes(';') && !step) out.push(sel);
      buf=''; depth++;
    } else if(ch==='}'){ buf=''; depth--; }
    else buf+=ch;
  }
  return out;
}
const norm=s=>s.replace(/\s+/g,'').toLowerCase();

(async()=>{
  const html=fs.readFileSync('index.html','utf8');
  const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const want=sourceSelectors(css);

  const b=await chromium.launch();
  const p=await (await b.newContext()).newPage();
  await p.addInitScript(()=>{ window.claude={use:async()=>({publish:async()=>({version:'v1'})})}; });
  await p.goto('file:///home/user/Phoenix-2026/index.html');
  await p.waitForTimeout(400);
  const got=await p.evaluate(()=>{
    const acc=[];
    const walk=rules=>{ for(const r of rules){
      if(r.selectorText) acc.push(r.selectorText);
      if(r.cssRules) walk(r.cssRules);
    }};
    for(const sh of document.styleSheets){
      try{ walk(sh.cssRules); }catch(e){}
    }
    return acc;
  });
  await b.close();

  const have=new Set(got.map(norm));
  const missing=want.filter(s=>!have.has(norm(s)));
  console.log(`selectors in source: ${want.length}   parsed by browser: ${got.length}`);
  if(missing.length){
    console.log('SWALLOWED BY A CSS PARSE ERROR:');
    missing.forEach(s=>console.log('   '+s));
    process.exit(1);
  }
  console.log('every source selector survived parsing');
})();
