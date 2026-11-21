import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { ProfileContext } from './ProfileContext';

const SESSION_KEY = 'clacklabs-session';
const LEGACY_PROFILE_KEY = 'clacklabs-profile';

function readSession() {
  try {
    window.localStorage.removeItem(LEGACY_PROFILE_KEY);
    const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null');
    if (!stored || typeof stored.token !== 'string' || !stored.user?.email) {
      return null;
    }
    return {
      token: stored.token,
      user: {
        id: String(stored.user.id || ''),
        name: String(stored.user.name || stored.user.email.split('@')[0]),
        email: String(stored.user.email),
        role: String(stored.user.role || 'customer'),
      },
    };
  } catch {
    return null;
  }
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Authentication failed. Please try again.');
  }
  return payload;
}

export function ProfileProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [authLoading, setAuthLoading] = useState(Boolean(session?.token));

  useEffect(() => {
    if (!session?.token) return undefined;

    let active = true;

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((response) => readResponse(response))
      .then((payload) => {
        if (active) setSession({ token: session.token, user: payload.user });
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.token]);

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  const value = useMemo(() => {
    const requestAuth = async (endpoint, body) => {
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {
        throw new Error('Unable to reach the ClackLabs server.');
      }

      const payload = await readResponse(response);
      setSession({ token: payload.token, user: payload.user });
      setAuthLoading(false);
      return payload.user;
    };

    return {
      profile: session?.user || null,
      token: session?.token || null,
      authLoading,
      login: ({ email, password }) => requestAuth('login', { email, password }),
      register: ({ name, email, password }) =>
        requestAuth('register', { name, email, password }),
      signOut: () => {
        setSession(null);
        window.localStorage.removeItem(SESSION_KEY);
        window.localStorage.removeItem(LEGACY_PROFILE_KEY);
      },
      updateProfile: (user) => {
        setSession((current) =>
          current
            ? { token: current.token, user: { ...current.user, ...user } }
            : current,
        );
      },
    };
  }, [session, authLoading]);

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
