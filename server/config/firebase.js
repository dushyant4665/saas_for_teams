const admin = require('firebase-admin');

// Use environment variable directly or fallback to service account object
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use service account file
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    // Use environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "saas-da1b9",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const auth = admin.auth();

module.exports = { admin, auth };
