import * as admin from 'firebase-admin'

function initAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newlines in private key securely
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    } catch (error) {
      console.error('Firebase admin initialization error', error)
    }
  }
}

// Export a getter function so it doesn't crash Next.js build time static analysis
export function getAdminAuth() {
  initAdmin()
  return admin.auth()
}
