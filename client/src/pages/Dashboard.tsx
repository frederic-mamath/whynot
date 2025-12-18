import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { removeToken, isAuthenticated } from '../lib/auth';
import { useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="error-message">{error.message}</div>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="user-info">
          <h2>Your Profile</h2>
          <div className="user-info-item">
            <span className="user-info-label">User ID</span>
            <span className="user-info-value">{user?.id}</span>
          </div>
          <div className="user-info-item">
            <span className="user-info-label">Email</span>
            <span className="user-info-value">{user?.email}</span>
          </div>
          <div className="user-info-item">
            <span className="user-info-label">Status</span>
            <span className="user-info-value">
              {user?.isVerified ? '✅ Verified' : '⏳ Pending'}
            </span>
          </div>
          <div className="user-info-item">
            <span className="user-info-label">Member Since</span>
            <span className="user-info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
