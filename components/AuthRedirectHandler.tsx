import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextValue";

const AuthRedirectHandler: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prevUserRef = useRef<typeof user>(null);

  useEffect(() => {
    // Only fire when user transitions from null -> non-null
    if (!prevUserRef.current && user) {
      // If user is admin, ensure they land in the admin dashboard
      if (isAdmin && !location.pathname.startsWith("/admin")) {
        navigate("/admin", { replace: true });
      }
    }

    prevUserRef.current = user;
  }, [user, isAdmin, navigate, location.pathname]);

  return null;
};

export default AuthRedirectHandler;
