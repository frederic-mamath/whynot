import { Navigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import Container from "./Container";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "SELLER" | "BUYER";
}

export default function ProtectedRoute({
  children,
  requireRole,
}: ProtectedRouteProps) {
  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = trpc.profile.me.useQuery(undefined, {
    retry: false,
  });

  const authenticated = !profileLoading && !error && !!profile;

  const { data: userRoles, isLoading: rolesLoading } =
    trpc.role.myRoles.useQuery(undefined, {
      enabled: authenticated && !!requireRole,
    });

  // Still determining auth state
  if (profileLoading) return null;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && rolesLoading) {
    return (
      <Container className="py-8">
        <p>Loading...</p>
      </Container>
    );
  }

  if (requireRole && !userRoles?.roles.includes(requireRole)) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need to be a seller to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Request seller access from the navigation menu.
          </p>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
