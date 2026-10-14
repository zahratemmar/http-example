'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
// Fixed credentials: edit here or set the environment variables before starting.
const USERNAME = process.env.APP_USERNAME || 'admin';
const PASSWORD = process.env.APP_PASSWORD || 'ChangeMe123!';
const sessions = new Map(); // Memory only: cleared when server restarts.
const SESSION_TTL = 8 * 60 * 60 * 1000;
const publicDir = path.join(__dirname, 'public');
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'application/javascript; charset=utf-8']
};
function json(res, status, value, extra = {}) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...extra});
  res.end(JSON.stringify(value));
}
function cookie(req, name) {
  const pair = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));
  return pair ? pair.slice(name.length+1) : '';
}
function session(req) {
  const token = cookie(req, 'sid');
  const exp = sessions.get(token);
  if (!exp) return false;
  if (exp <= Date.now()) { sessions.delete(token); return false; }
  return true;
}
function equal(a,b) {
  const x=crypto.createHash('sha256').update(String(a)).digest();
  const y=crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x,y);
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let raw='';
    req.on('data',chunk=>{raw+=chunk; if(raw.length>4096){reject(new Error('Request too large'));req.destroy();}});
    req.on('end',()=>{try{resolve(JSON.parse(raw || '{}'));}catch{reject(new Error('Invalid JSON'));}});
    req.on('error',reject);
  });
}
const server = http.createServer(async(req,res)=>{
  const url = new URL(req.url,'http://localhost');
  const pathname = url.pathname;
  const secure = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  const cookieOptions = `HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL/1000}${secure?'; Secure':''}`;
  if (pathname === '/api/me' && req.method==='GET') {
    return json(res,200,{authenticated:session(req),username:session(req)?USERNAME:null});
  }
  if (pathname === '/api/login' && req.method==='POST') {
    try {
      const {username,password}=await readBody(req);
      if (typeof username !== 'string' || typeof password !== 'string' || !equal(username,USERNAME) || !equal(password,PASSWORD)) {
        return json(res,401,{error:'Incorrect username or password.'});
      }
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token,Date.now()+SESSION_TTL);
      return json(res,200,{success:true,username:USERNAME},{'Set-Cookie':`sid=${token}; ${cookieOptions}`});
    } catch { return json(res,400,{error:'Invalid request.'}); }
  }
  if (pathname === '/api/logout' && req.method==='POST') {
    sessions.delete(cookie(req,'sid'));
    return json(res,200,{success:true},{'Set-Cookie':`sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure?'; Secure':''}`});
  }
  if (req.method === 'GET' && files[pathname]) {
    const [filename, type] = files[pathname];
    const file = path.join(publicDir, filename);
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    return fs.createReadStream(file).pipe(res);
  }
  return json(res,404,{error:'Not found'});
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});