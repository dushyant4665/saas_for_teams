# TeamPulse

Simple real‑time teamwork app. Chat, edit text together, manage workspaces.

## What is inside
- Frontend: React + Vite, TailwindCSS, Socket.io client, Firebase Auth
- Backend: Node + Express, Socket.io, MongoDB (Mongoose), Firebase Admin, Stripe

## Quick start (local)
1) Install
```bash
npm install --workspaces
```
2) Env files
- server/.env (use server/env example values if needed)
- client/.env (set VITE_API_URL=http://localhost:5000 and Firebase keys)
3) Run dev (front + back)
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

## Build
```bash
cd client && npm run build
```
Output is in client/dist. Serve it with any static host. Backend runs with:
```bash
cd server && npm run start
```

## How features work (short)
- Workspaces: create or join by invite code.
- Chat: messages go to everyone in the workspace room. We keep history in memory (demo) and cache on the client so tab changes do not lose messages.
- Collaborative editor: last write wins. Server stores current text and version per workspace and broadcasts each save to all, including the sender.
- Auth: Firebase ID token. If token missing, demo user is used.
- Invites (demo): random 8‑char code. Invite by email logs a send with the invite link.

## Common scripts
- npm run dev           start both apps
- npm run dev:client    frontend only
- npm run dev:server    backend only
- npm run build         client build
- npm start (server)    production backend

## Minimal env (examples)
server/.env
```
PORT=5000
CLIENT_URL=http://localhost:5173
# add Mongo, Firebase Admin, Stripe keys for full mode
```
client/.env
```
VITE_API_URL=http://localhost:5000
# add Firebase web config and Stripe publishable key
```

## Folders
```
client/  React app
server/  API + sockets
```

## Troubleshoot
- Socket not connecting: check VITE_API_URL and CORS.
- No auth: ensure Firebase keys; demo still works without.
- Invite code same: create via demo-create; each workspace gets its own code.

## License
MIT



