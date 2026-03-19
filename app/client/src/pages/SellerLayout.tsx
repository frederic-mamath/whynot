import { Outlet } from "react-router-dom";

export default function SellerLayout() {
  return (
    <div className="min-h-[calc(100vh - 160px)] bg-background">
      <Outlet />
    </div>
  );
}
