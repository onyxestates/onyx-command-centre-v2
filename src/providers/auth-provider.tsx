"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { logError } from "@/lib/monitoring/logger";
import type { UserProfile, Workspace, WorkspaceMember } from "@/types/app";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  member: WorkspaceMember | null;
  workspace: Workspace | null;
  workspaceId: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const FALLBACK_WORKSPACE_ID = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID ?? "ws_northbridge_demo";
const SESSION_HEARTBEAT_MS = 25 * 60 * 1000;

async function readSessionStatus() {
  const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" });
  return response.ok;
}

async function upsertSessionCookieForUser(user: User, forceRefresh = false) {
  const idToken = await user.getIdToken(forceRefresh);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Unable to create server session." }))) as { error?: string };
    throw new Error(payload.error ?? "Unable to create server session.");
  }
}

async function clearSessionCookie() {
  await fetch("/api/auth/session", { method: "DELETE" });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);
  const sessionSyncRef = useRef<{ uid: string | null; token: string | null }>({ uid: null, token: null });
  const sessionSyncInFlightRef = useRef(false);

  useEffect(() => {
    const syncServerSession = async (nextUser: User, forceRefresh = false) => {
      if (sessionSyncInFlightRef.current) return;
      sessionSyncInFlightRef.current = true;
      try {
        const token = await nextUser.getIdToken(forceRefresh);
        if (!forceRefresh && sessionSyncRef.current.uid === nextUser.uid && sessionSyncRef.current.token === token) {
          return;
        }
        await upsertSessionCookieForUser(nextUser, forceRefresh);
        sessionSyncRef.current = { uid: nextUser.uid, token };
      } catch (error) {
        logError("Unable to refresh server session cookie", error, { uid: nextUser.uid, forceRefresh });
      } finally {
        sessionSyncInFlightRef.current = false;
      }
    };

    const ensureServerSession = async (forceRefresh = false) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const hasServerSession = await readSessionStatus();
        if (!hasServerSession || forceRefresh) {
          await syncServerSession(currentUser, forceRefresh);
        }
      } catch (error) {
        logError("Unable to validate server session state", error, { uid: currentUser.uid, forceRefresh });
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setUser(nextUser);
      setProfile(null);
      setMember(null);
      setWorkspace(null);

      if (!nextUser) {
        sessionSyncRef.current = { uid: null, token: null };
        setLoading(false);
        return;
      }

      const unsubscribers: Array<() => void> = [];
      const unsubscribeUser = onSnapshot(
        doc(db, "users", nextUser.uid),
        (snapshot) => {
          const nextProfile = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null;
          setProfile(nextProfile);
          const nextWorkspaceId = nextProfile?.defaultWorkspaceId ?? FALLBACK_WORKSPACE_ID;
          unsubscribers.push(
            onSnapshot(
              doc(db, "workspaces", nextWorkspaceId),
              (workspaceSnapshot) => {
                setWorkspace(workspaceSnapshot.exists() ? ({ id: workspaceSnapshot.id, ...workspaceSnapshot.data() } as Workspace) : null);
                setLoading(false);
              },
              (error) => {
                logError("Unable to load workspace snapshot", error, { workspaceId: nextWorkspaceId });
                setLoading(false);
              }
            ),
            onSnapshot(
              doc(db, "workspaces", nextWorkspaceId, "members", nextUser.uid),
              (memberSnapshot) => {
                setMember(memberSnapshot.exists() ? ({ id: memberSnapshot.id, ...memberSnapshot.data() } as WorkspaceMember) : null);
                setLoading(false);
              },
              (error) => {
                logError("Unable to load workspace member snapshot", error, { workspaceId: nextWorkspaceId, uid: nextUser.uid });
                setLoading(false);
              }
            )
          );
        },
        (error) => {
          logError("Unable to load user profile snapshot", error, { uid: nextUser.uid });
          setLoading(false);
        }
      );

      unsubscribers.push(unsubscribeUser);
      cleanupRef.current = () => unsubscribers.forEach((fn) => fn());
    });

    const unsubscribeIdToken = onIdTokenChanged(auth, async (nextUser) => {
      if (!nextUser) {
        sessionSyncRef.current = { uid: null, token: null };
        return;
      }
      await syncServerSession(nextUser, false);
    });

    const interval = window.setInterval(() => {
      void ensureServerSession(true);
    }, SESSION_HEARTBEAT_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void ensureServerSession(false);
      }
    };

    const onFocus = () => {
      void ensureServerSession(false);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      unsubscribeAuth();
      unsubscribeIdToken();
      cleanupRef.current?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      member,
      workspace,
      workspaceId: profile?.defaultWorkspaceId ?? workspace?.id ?? FALLBACK_WORKSPACE_ID,
      loading,
      signInWithEmail: async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await upsertSessionCookieForUser(credential.user, true);
      },
      signUpWithEmail: async (name, email, password) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            displayName: name,
            email,
            defaultWorkspaceId: FALLBACK_WORKSPACE_ID,
            preferences: { darkMode: true, emailNotifications: true, pushNotifications: true, timezone: "Europe/London" },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        await upsertSessionCookieForUser(credential.user, true);
      },
      sendReset: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
        try {
          await clearSessionCookie();
        } finally {
          sessionSyncRef.current = { uid: null, token: null };
          await signOut(auth);
        }
      },
    }),
    [user, profile, member, workspace, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
