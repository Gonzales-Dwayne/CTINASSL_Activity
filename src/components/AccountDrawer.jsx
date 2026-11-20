import { useEffect } from 'react'
import styles from './Drawers.module.css'

function AccountDrawer({ user, onClose, onLogin, onLogout, onDashboard }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Account</h2>
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Close account"
          >
            ×
          </button>
        </div>

        {user ? (
          <>
            <div className={styles.accountHead}>
              <span className={styles.accountAvatar}>
                {user.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span className={styles.accountInfo}>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
                <span className={styles.accountRole}>{user.role}</span>
              </span>
            </div>

            {user.role === 'admin' ? (
              <button
                className={styles.viewAll}
                type="button"
                onClick={onDashboard}
              >
                Open admin dashboard
              </button>
            ) : null}

            <button className={styles.linkButton} type="button" onClick={onLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className={styles.hint}>
              You are not signed in. Sign in to track orders and manage the store.
            </p>
            <button className={styles.viewAll} type="button" onClick={onLogin}>
              Sign in
            </button>
            <p className={styles.empty}>
              Demo admin: admin@clacklabs.dev / admin123
            </p>
          </>
        )}
      </aside>
    </div>
  )
}

export default AccountDrawer
