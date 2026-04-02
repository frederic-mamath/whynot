import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";
import { removeToken } from "../lib/auth";
import { useEffect } from "react";

export function useDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      navigate("/");
    },
  });

  useEffect(() => {
    if (error) {
      navigate("/login");
    }
  }, [error, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return {
    t,
    user,
    isLoading,
    error,
    navigate,
    handleLogout,
  };
}
