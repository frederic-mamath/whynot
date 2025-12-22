import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { removeToken, isAuthenticated } from "../lib/auth";
import { useEffect } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div>
          <div>{error.message}</div>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div>
          <div>
            <h1>Dashboard</h1>
            <button onClick={handleLogout}>Logout</button>
          </div>

          <div>
            <h2>Your Profile</h2>

            <div>
              <div>
                <span>User ID</span>
                <span>{user?.id}</span>
              </div>

              <div>
                <span>Email</span>
                <span>{user?.email}</span>
              </div>

              <div>
                <span>Status</span>
                <span>{user?.isVerified ? "✅ Verified" : "⏳ Pending"}</span>
              </div>

              <div>
                <span>Member Since</span>
                <span>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
