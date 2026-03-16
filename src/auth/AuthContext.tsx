import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, googleProvider } from "../firebase/config";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  errorMessage: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultContextValue: AuthContextValue = {
  user: null,
  loading: true,
  isAuthenticated: false,
  errorMessage: null,
  signIn: async () => {
    throw new Error("AuthProvider is not mounted");
  },
  signOut: async () => {
    throw new Error("AuthProvider is not mounted");
  },
};

export const AuthContext = createContext<AuthContextValue>(defaultContextValue);

type AuthProviderProps = {
  children: ReactNode;
};

function toAuthErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "auth/configuration-not-found") {
      return "Google sign-in is not enabled in Firebase Authentication yet.";
    }

    if (error.code === "auth/unauthorized-domain") {
      return "This app domain is not authorized in Firebase Authentication.";
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Authentication failed. Please try again.";
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isRedirectResolved, setIsRedirectResolved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getRedirectResult(auth)
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(toAuthErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRedirectResolved(true);
        }
      });

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        if (!isMounted) {
          return;
        }

        setUser(nextUser);
        setIsAuthResolved(true);
      },
      (error: unknown) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(toAuthErrorMessage(error));
        setIsAuthResolved(true);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  function shouldUsePopupFlow() {
    if (typeof window === "undefined") {
      return false;
    }

    const { hostname } = window.location;

    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".app.github.dev");
  }

  async function signIn() {
    setErrorMessage(null);

    try {
      await setPersistence(auth, browserLocalPersistence);

      if (shouldUsePopupFlow()) {
        await signInWithPopup(auth, googleProvider);
        return;
      }

      await signInWithRedirect(auth, googleProvider);
    } catch (error: unknown) {
      setErrorMessage(toAuthErrorMessage(error));
      throw error;
    }
  }

  async function signOut() {
    setErrorMessage(null);

    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      const nextErrorMessage = toAuthErrorMessage(error);
      setErrorMessage(nextErrorMessage);
      throw error;
    }
  }

  const value: AuthContextValue = {
    user,
    loading: !isAuthResolved || !isRedirectResolved,
    isAuthenticated: user !== null,
    errorMessage,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
