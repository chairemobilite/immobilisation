import { Navigate, Outlet } from "react-router";
import { authClient } from "./auth-client";

const ProtectedRoute: React.FC = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;