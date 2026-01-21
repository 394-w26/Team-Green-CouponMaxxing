import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAuMS1zSqDZvPBKURAIcs-gGSf9NVHW5k8",
  authDomain: "couponmax-12529.firebaseapp.com",
  databaseURL: "https://couponmax-12529-default-rtdb.firebaseio.com",
  projectId: "couponmax-12529",
  storageBucket: "couponmax-12529.appspot.com",
  messagingSenderId: "956673193933",
  appId: "1:956673193933:web:9e43f62c616b7884f0b684",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
