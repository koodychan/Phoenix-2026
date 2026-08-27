/* Stands in for Vercel + Supabase: same routes, same status codes. */
const http=require('http'), fs=require('fs');
let DB={ state:{}, rev:0 };
let forceConflict=false;
const srv=http.createServer((req,res)=>{
  const send=(code,obj)=>{ res.writeHead(code,{'Content-Type':'application/json'}); res.end(JSON.stringify(obj)); };
  if(req.url==='/'||req.url.startsWith('/index.html')){
    res.writeHead(200,{'Content-Type':'text/html'});
    return res.end(fs.readFileSync('/home/user/Phoenix-2026/index.html'));
  }
  if(req.url==='/api/state') return send(200,{state:DB.state,rev:DB.rev});
  if(req.url==='/api/save'&&req.method==='POST'){
    let b=''; req.on('data',d=>b+=d); req.on('end',()=>{
      let j={}; try{ j=JSON.parse(b);}catch(e){}
      if(j.pw!=='josie') return send(403,{error:'denied'});         // db raises on bad password
      if(forceConflict){ forceConflict=false; return send(409,{error:'conflict'}); }
      if(j.baseRev!==DB.rev) return send(409,{error:'conflict'});
      DB.state=j.state; DB.rev=DB.rev+1;
      return send(200,{rev:DB.rev});
    });
    return;
  }
  if(req.url==='/__db') return send(200,DB);
  if(req.url==='/__conflict'){ forceConflict=true; return send(200,{ok:true}); }
  send(404,{error:'nf'});
});
srv.listen(8799,()=>console.log('mock on 8799'));
