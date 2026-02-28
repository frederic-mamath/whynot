import { Navigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { isAuthenticated } from "../lib/auth";
import Container from "./Container";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'SELLER' | 'BUYER';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const authenticated = isAuthenticated();

  const { data: userRoles, isLoading } = trpc.role.myRoles.useQuery(undefined, {
    enabled: authenticated && !!requireRole,
  });

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && isLoading) {
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
