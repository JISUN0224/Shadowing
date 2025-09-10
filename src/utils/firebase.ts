import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 설정 디버깅 (프로덕션에서는 비활성화)
if (import.meta.env.DEV) {
  console.log('Firebase 설정 확인:', {
    apiKey: firebaseConfig.apiKey ? '✅ 설정됨' : '❌ 설정되지 않음',
    authDomain: firebaseConfig.authDomain ? '✅ 설정됨' : '❌ 설정되지 않음',
    projectId: firebaseConfig.projectId ? '✅ 설정됨' : '❌ 설정되지 않음',
    storageBucket: firebaseConfig.storageBucket ? '✅ 설정됨' : '❌ 설정되지 않음',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ 설정됨' : '❌ 설정되지 않음',
    appId: firebaseConfig.appId ? '✅ 설정됨' : '❌ 설정되지 않음'
  });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase 초기화 완료 로그 (프로덕션에서는 비활성화)
if (import.meta.env.DEV) {
  console.log('Firebase 초기화 완료');
}
