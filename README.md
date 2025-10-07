# TeamPulse - Realtime SaaS Collaboration Platform

A complete production-ready SaaS platform built with React, Node.js, Socket.io, Firebase Auth, Stripe billing, and MongoDB.

## 🚀 Features

- **Authentication**: Firebase Auth with Google + Email/Password
- **Real-time Chat**: Socket.io powered instant messaging
- **Collaborative Editor**: Shared text editor with real-time sync
- **Stripe Billing**: Free and Pro plans with subscription management
- **Analytics Dashboard**: Pro-only insights and metrics
- **Multi-tenant Workspaces**: Team-based collaboration

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS for styling
- React Query for data fetching
- Socket.io client for real-time features
- Firebase Auth for authentication
- Stripe.js for payments

### Backend
- Node.js + Express
- Socket.io for real-time communication
- MongoDB with Mongoose
- Firebase Admin SDK
- Stripe for payment processing

### Deployment
- Frontend: Vercel (free tier)
- Backend: Render (free tier)
- Database: MongoDB Atlas (free tier)

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Stripe account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd teampulse
npm run install:all
```

### 2. Environment Setup

#### Backend (.env in server/ directory)
```bash
cp server/env.example server/.env
```

Fill in your environment variables:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teampulse
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env in client/ directory)
```bash
cp client/env.example client/.env
```

Fill in your environment variables:
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_API_URL=http://localhost:5000
```

### 3. Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🔧 Setup Instructions

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication and add Google + Email providers
3. Generate a service account key (Project Settings > Service Accounts)
4. Copy the config values to your environment files

### MongoDB Setup
1. Create a free cluster at https://cloud.mongodb.com
2. Get your connection string
3. Add to `MONGODB_URI` in server/.env

### Stripe Setup
1. Create a Stripe account at https://dashboard.stripe.com
2. Get your test keys from the dashboard
3. Create a webhook endpoint pointing to your backend `/webhook`
4. Add keys to your environment files

## 🚀 Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Backend (Render)
1. Push your code to GitHub
2. Connect your repo to Render
3. Create a new Web Service
4. Use the provided `render.yaml` configuration
5. Set environment variables in Render dashboard
6. Deploy!

### Environment Variables for Production

#### Vercel (Frontend)
- `VITE_API_URL` - Your Render backend URL
- All Firebase config variables
- `VITE_STRIPE_PUBLISHABLE_KEY`

#### Render (Backend)
- `MONGODB_URI`
- All Firebase Admin config
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLIENT_URL` - Your Vercel frontend URL

## 🎯 Demo Features

### Free Plan
- Create and join workspaces
- Real-time chat
- Collaborative editor
- Basic workspace management

### Pro Plan ($9.99/month)
- All free features
- Advanced analytics dashboard
- Detailed productivity metrics
- Team performance insights

## 📁 Project Structure

```
teampulse/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── config/         # Configuration files
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── socket/             # Socket.io handlers
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration files
│   ├── package.json
│   └── ...
├── vercel.json             # Vercel deployment config
├── render.yaml             # Render deployment config
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/verify-token` - Verify Firebase token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Workspaces
- `POST /api/workspace/create` - Create workspace
- `GET /api/workspace/my` - Get user's workspaces
- `GET /api/workspace/:slug` - Get workspace by slug
- `PUT /api/workspace/:slug` - Update workspace
- `POST /api/workspace/:slug/join` - Join workspace

### Stripe
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/create-portal` - Create billing portal
- `GET /api/stripe/subscription` - Get subscription status

### Analytics (Pro only)
- `GET /api/analytics/workspace/:id` - Workspace analytics
- `GET /api/analytics/user` - User analytics

### Webhooks
- `POST /webhook` - Stripe webhook handler

## 🔌 Socket.io Events

### Client → Server
- `authenticate` - Authenticate with Firebase token
- `join-room` - Join workspace room
- `chat-message` - Send chat message
- `editor-update` - Update editor content
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

### Server → Client
- `authenticated` - Authentication successful
- `recent-messages` - Recent chat messages
- `new-message` - New chat message
- `editor-content` - Current editor content
- `editor-updated` - Editor content updated
- `user-joined` - User joined workspace
- `user-left` - User left workspace
- `user-typing` - User typing indicator

## 🧪 Testing the Demo

1. **Sign up/Login**: Use Google auth or email/password
2. **Create Workspace**: Create your first workspace
3. **Chat**: Send messages in real-time
4. **Collaborate**: Use the shared editor
5. **Upgrade**: Test Stripe checkout flow
6. **Analytics**: View Pro-only analytics dashboard

## 🔒 Security Features

- Firebase token verification
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Webhook signature verification

## 📈 Scaling Considerations

- MongoDB Atlas auto-scaling
- Socket.io clustering (Redis adapter)
- CDN for static assets
- Load balancing for multiple instances
- Database indexing optimization

## 🐛 Troubleshooting

### Common Issues

1. **Socket connection fails**: Check CORS settings and client URL
2. **Firebase auth errors**: Verify service account credentials
3. **Stripe webhook fails**: Check webhook URL and secret
4. **MongoDB connection**: Verify connection string and network access

### Debug Mode
Set `NODE_ENV=development` for detailed error logging.

## 📄 License

MIT License - feel free to use this project as a starting point for your own SaaS!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ for the developer community. Ready to demo and deploy!



