import { useState } from 'react'
import { authenticate, register } from './auth'
import styles from './LoginPage.module.css'

function LoginPage({ onNavigate, onLogin }) {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const user = isRegister
        ? await register({ name, email, password })
        : await authenticate(email, password)
      onLogin(user)
    } catch (authError) {
      setError(authError.message)
      setBusy(false)
    }
  }

  function switchMode() {
    setMode((current) => (current === 'register' ? 'signin' : 'register'))
    setError('')
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <button
          className={styles.brand}
          type="button"
          onClick={() => onNavigate('home')}
        >
          <span className={styles.brandMark}>C</span>
          <span className={styles.brandMark}>L</span>
          <span className={styles.brandName}>ClackLabs</span>
        </button>
        <button
          className={styles.back}
          type="button"
          onClick={() => onNavigate('catalogue')}
        >
          Continue shopping
        </button>
      </header>

      <main className={styles.main}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>
            {isRegister ? 'Create account' : 'Sign in'}
          </h1>
          <p className={styles.subtitle}>
            {isRegister
              ? 'Your cart, orders and details are saved to the database.'
              : 'Access your orders, wishlist and the admin dashboard.'}
          </p>

          {isRegister ? (
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mika Santos"
                required
              />
            </label>
          ) : null}

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@clacklabs.dev"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <span className={styles.passwordRow}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                minLength={isRegister ? 8 : undefined}
                required
              />
              <button
                className={styles.reveal}
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button className={styles.submit} type="submit" disabled={busy}>
            {busy
              ? isRegister
                ? 'Creating account…'
                : 'Signing in…'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
          </button>

          <button
            className={styles.switchMode}
            type="button"
            onClick={switchMode}
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default LoginPage
