# TeamPulse

TeamPulse is a small, clear example of a real‑time collaboration app. It lets a team create a workspace, chat in real time, and edit text together in one place. It uses a simple demo mode by default, and can switch to full production mode with Firebase, MongoDB, and Stripe when you add real keys.

## What you get
- Workspaces with invite code
- Real‑time chat (Socket.io)
- Collaborative text editor
- Basic analytics hooks (kept minimal in demo)
- Optional Stripe upgrade path (off by default in demo)

## How it is built
- Frontend: React + Vite, TailwindCSS, React Query, Socket.io client, Firebase Auth (web SDK)
- Backend: Node + Express, Socket.io, MongoDB (Mongoose), Firebase Admin, Stripe SDK

## How it works (short and practical)
1. Authentication
   - In demo mode, the server accepts a demo token and uses a demo user.
   - With real Firebase, the client sends a Firebase ID token over the socket. The server verifies it and uses the real user’s id, name, and photo.

2. Workspaces
   - Create a workspace from the dashboard. In demo mode, we generate an 8‑character invite code and keep it in memory so settings show the same code every time.
   - Join by invite code. For demo, we look up the workspace in memory by code.

3. Chat
   - Messages are broadcast to everyone in the workspace room.
   - The client also caches messages per workspace in sessionStorage so switching tabs does not clear history.

4. Collaborative editor
   - Server stores one editor state per workspace in memory (content, version, lastEditedBy, lastEditedAt).
   - When a user types, we send an update, increment the version, store it, and broadcast to all users including the sender. Simple “last write wins” keeps everyone in sync without heavy conflict logic.

5. Invites
   - The settings modal shows the workspace’s random invite code.
   - Invite by email (demo) logs the send with the correct invite link; plug in a mailer later to send real emails.

## Run it locally
1) Install dependencies
```bash
npm install --workspaces
```
2) Set environment files
- server/.env (you can copy from server/env)
- client/.env (set VITE_API_URL=http://localhost:5000 and Firebase web config if you have it)
3) Start both apps (dev)
```bash
npm run dev
```
Open:
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

## Build
Build the client for production:
```bash
cd client && npm run build
```
Artifacts are in client/dist. Run the backend:
```bash
cd server && npm run start
```
Serve client/dist from any static host or from a CDN.

## Switch to real services (optional)
- Firebase
  - Client: add Firebase web config in client/.env
  - Server: add Firebase Admin service account fields in server/.env
  - The socket will start authenticating with real tokens.
- MongoDB
  - Add MONGODB_URI to server/.env and wire real persistence where needed (models exist; demo keeps most data in memory).
- Stripe
  - Add keys in server/.env and client/.env, and enable the upgrade flow and webhook route.

## Scripts you will use
- npm run dev           start both apps in dev
- npm run dev:client    frontend only
- npm run dev:server    backend only
- npm run build         client build
- npm start (server)    production backend

## Minimal env examples
server/.env
```
PORT=5000
CLIENT_URL=http://localhost:5173
# Add Mongo, Firebase Admin, Stripe keys if you want full mode
```
client/.env
```
VITE_API_URL=http://localhost:5000
# Add Firebase web config and Stripe publishable key when needed
```

## Folder map
```
client/  React app (UI, sockets)
server/  API + sockets (auth, rooms, editor, invites)
```

## Troubleshooting
- Socket not connecting: check VITE_API_URL and CORS; ensure backend running on 5000.
- Seeing demo user: add Firebase keys to switch to real users.
- Invite code repeats: create workspace via demo‑create; each workspace gets its own code and is stored in memory.
- Messages disappear when switching tabs: we now cache per workspace in sessionStorage.

## License
MIT



