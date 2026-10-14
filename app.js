const login = document.querySelector('#login');
const dashboard = document.querySelector('#dashboard');
const form = document.querySelector('#login-form');
const error = document.querySelector('#error');
const submit = document.querySelector('#submit');
const password = document.querySelector('#password');
function showDashboard(username) {
  document.querySelector('#current-user').textContent = username;
  login.hidden = true;
  dashboard.hidden = false;
}
function showLogin() { dashboard.hidden = true; login.hidden = false; }
async function request(url, options={}) {
  const res = await fetch(url, {credentials:'same-origin',...options});
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Something went wrong.');
  return body;
}
(async()=>{
  try { const data=await request('/api/me'); data.authenticated ? showDashboard(data.username) : showLogin(); }
  catch { showLogin(); }
})();
form.addEventListener('submit',async(event)=>{
  event.preventDefault(); error.textContent=''; submit.disabled=true;submit.firstChild.textContent='Signing in ';
  try {
    const data = await request('/api/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username.value,password:password.value})});
    form.reset(); showDashboard(data.username);
  } catch(e) { error.textContent=e.message; }
  finally {submit.disabled=false;submit.firstChild.textContent='Sign in ';}
});
document.querySelector('#logout').addEventListener('click',async()=>{
  try { await request('/api/logout',{method:'POST'});showLogin(); } catch(e) { alert(e.message); }
});
document.querySelector('#toggle-password').addEventListener('click',(e)=>{
  const visible=password.type==='text';password.type=visible?'password':'text';e.currentTarget.textContent=visible?'Show':'Hide';e.currentTarget.setAttribute('aria-label',visible?'Show password':'Hide password');
});
