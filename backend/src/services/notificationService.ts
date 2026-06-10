import * as admin from 'firebase-admin';
import prisma from '../config/database';

let firebaseApp: admin.app.App | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const isConfigured = 
  projectId && 
  clientEmail && 
  privateKey && 
  projectId !== 'your-project-id' && 
  clientEmail !== 'your-client-email' && 
  privateKey !== 'your-private-key';

if (isConfigured) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Handle escaped newlines in private key
        privateKey: privateKey!.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
} else {
  console.log('⚠️ Firebase credentials not configured or using placeholders. Push notifications will run in mock mode.');
}

export const sendPushNotification = async (
  userId: string,
  payload: { title: string; body: string; link?: string }
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, username: true },
    });

    if (!user) return;

    // Log the notification to the server console (acts as mock output if Firebase not configured)
    console.log(`[Push Notification Alert] to @${user.username}: "${payload.title} - ${payload.body}"`);

    if (user.fcmToken && firebaseApp) {
      const message: admin.messaging.Message = {
        token: user.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.link ? { link: payload.link } : {},
      };

      await admin.messaging().send(message);
      console.log(`🚀 Push notification successfully sent to user ${userId}`);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
