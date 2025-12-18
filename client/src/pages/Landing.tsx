import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../lib/auth';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="landing-container">
      <div className="container">
        <nav className="landing-nav">
          <div className="logo">NoWhat</div>
          <div className="nav-buttons">
            <button className="btn-outline" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn btn-white" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </div>
        </nav>
      </div>

      <div className="landing-hero">
        <h1>Welcome to NoWhat</h1>
        <p>
          A modern authentication system built with tRPC, React, and PostgreSQL.
          Secure, type-safe, and ready for production.
        </p>
        <div className="landing-cta">
          <button className="btn btn-white" onClick={() => navigate('/register')}>
            Get Started
          </button>
          <button className="btn-outline" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
