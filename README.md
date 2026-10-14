# Lightweight Login App

A tiny web app using Node.js built-in modules and vanilla HTML/CSS/JavaScript. No database, npm install, or external packages required.

## Requirements
- Node.js 18 or newer

## Run
```bash
node server.js
```
Open http://127.0.0.1:3000

## Demo credentials
- Username: `admin`
- Password: `ChangeMe123!`

The credentials are configured at the top of `server.js`. Alternatively, provide `APP_USERNAME` and `APP_PASSWORD` environment variables when launching the server.

On Windows PowerShell:
```powershell
$env:APP_USERNAME="myuser"
$env:APP_PASSWORD="a-new-strong-password"
node server.js
```

## How it works
The browser posts credentials to the server. The server validates them and sets an HttpOnly session cookie. Sessions live only in server memory and expire after 8 hours; restarting the server logs everyone out.

**Security note:** Demo credentials are for local development. Change them before sharing or deploying. Use HTTPS for any public deployment. This is a lightweight single-user demo, not a production-ready authentication system (it does not provide persistent sessions or rate limiting). Never put your real password in client-side JavaScript.
