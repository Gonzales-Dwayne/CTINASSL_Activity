import { useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import styles from './LoginPage.module.css';

const LoginPage = ({ onNavigate }) => {
  const { profile, login, register } = useProfile();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') {
      onNavigate('#/admin');
    } else if (profile) {
      onNavigate('#/');
    }
  }, [profile, onNavigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (mode === 'create' && name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const user =
        mode === 'create'
          ? await register({ name: name.trim(), email: trimmedEmail, password })
          : await login({ email: trimmedEmail, password });

      setPassword('');
      onNavigate(user.role === 'admin' ? '#/admin' : '#/');
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (profile) {
    return null;
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.brandPanel}>
          <button
            className={styles.brand}
            type="button"
            onClick={() => onNavigate('#/')}
            aria-label="ClackLabs home"
          >
            CL
          </button>
          <div className={styles.brandCopy}>
            <p className={styles.eyebrow}>ClackLabs account</p>
            <h1>Your setup, remembered.</h1>
            <p>
              Keep your orders, saved items, and preferred gear in one place.
              Sign in to pick up where you left off.
            </p>
          </div>
          <p className={styles.brandFooter}>Mechanical keyboards, carefully chosen.</p>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formInner}>
            <div className={styles.tabs} role="tablist" aria-label="Account mode">
              <button
                className={mode === 'signin' ? styles.tabActive : styles.tab}
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
              >
                Sign in
              </button>
              <button
                className={mode === 'create' ? styles.tabActive : styles.tab}
                type="button"
                role="tab"
                aria-selected={mode === 'create'}
                onClick={() => {
                  setMode('create');
                  setError('');
                }}
              >
                Create account
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.heading}>
                <h2>{mode === 'signin' ? 'Welcome back.' : 'Join ClackLabs.'}</h2>
                <p>
                  {mode === 'signin'
                    ? 'Sign in to continue to your account.'
                    : 'Create a profile to start saving your setup.'}
                </p>
              </div>

              {mode === 'create' ? (
                <label className={styles.field}>
                  <span>Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
              ) : null}

              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="At least 8 characters"
                />
              </label>

              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}

              <button
                className={styles.primaryButton}
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? mode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create profile'}
              </button>
            </form>

            <p className={styles.note}>
              Passwords are verified against the ClackLabs MongoDB account store.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
