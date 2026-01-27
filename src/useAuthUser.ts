import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Provide more specific error messages
      if (error.code === 'auth/popup-closed-by-user') {
        alert("Sign-in cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Pop-up blocked by browser. Please allow pop-ups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized. Please check Firebase Console > Authentication > Settings > Authorized domains");
      } else if (error.code === 'auth/operation-not-allowed') {
        alert("Google sign-in is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method");
      } else {
        alert(`Failed to sign in: ${error.message}`);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { user, loading, signInWithGoogle, signOut };
}