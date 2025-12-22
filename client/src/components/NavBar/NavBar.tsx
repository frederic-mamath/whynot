import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { isAuthenticated, removeToken } from "../../lib/auth";

export default function NavBar() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const { data: user } = trpc.auth.me.useQuery(undefined, {
    enabled: authenticated,
  });

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  return (
    <nav>
      <div className="p-8">
        <Link to="/">NotWhat</Link>

        <div>
          {authenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/channels">Channels</Link>
              <button onClick={() => navigate("/create-channel")}>
                Create
              </button>

              {user && (
                <div>
                  <div>{user.email[0].toUpperCase()}</div>
                  <span>{user.email}</span>
                </div>
              )}

              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
