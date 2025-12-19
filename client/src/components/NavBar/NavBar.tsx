import { Link, useLocation, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpc';
import { isAuthenticated, removeToken } from '../../lib/auth';
import styles from './NavBar.module.scss';

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    enabled: authenticated,
  });

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? styles.active : '';
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <Link to="/" className={styles.navbarLogo}>
          <span>🎥</span>
          NotWhat
        </Link>

        <div className={styles.navbarLinks}>
          {authenticated ? (
            <>
              <Link to="/dashboard" className={`${styles.navLink} ${isActive('/dashboard')}`}>
                <span>🏠</span>
                Dashboard
              </Link>
              <Link to="/channels" className={`${styles.navLink} ${isActive('/channels')}`}>
                <span>📺</span>
                Channels
              </Link>
              <button 
                onClick={() => navigate('/create-channel')}
                className={`${styles.navButton} ${styles.primary}`}
              >
                <span>➕</span>
                Create
              </button>
              
              {user && (
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.email[0].toUpperCase()}
                  </div>
                  <span>{user.email}</span>
                </div>
              )}

              <button 
                onClick={handleLogout}
                className={styles.navButton}
              >
                <span>🚪</span>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>
                Login
              </Link>
              <Link to="/register" className={`${styles.navButton} ${styles.primary}`}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
