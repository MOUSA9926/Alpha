import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHEbnsd3IRXolILKNnyboaab2HIjdoPo8",
  authDomain: "movies-alpha.firebaseapp.com",
  projectId: "movies-alpha",
  storageBucket: "movies-alpha.firebasestorage.app",
  messagingSenderId: "852323558926",
  appId: "1:852323558926:web:489c38eeabddd46e343e5f",
  measurementId: "G-C3Y1Z7WLMG"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
