import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function SellerLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
