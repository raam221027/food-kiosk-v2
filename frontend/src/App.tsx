import { Suspense, lazy, useEffect } from "react";
import { Outlet, Route, Routes } from "react-router";
import LoginCard from "@/components/examples/card/standard/login-card";
import RedirectIfAuthenticated from "@/auth/RedirectIfAuthenticated";
import RequireAuth from "@/auth/RequireAuth";
import { useAuth } from "@/auth/useAuth";
import { KioskRoot, OrderInProgress } from "@/kiosk/KioskLayout";
import AttractScreen from "@/kiosk/screens/AttractScreen";
import ConfirmationScreen from "@/kiosk/screens/ConfirmationScreen";
import MenuScreen from "@/kiosk/screens/MenuScreen";
import OrderTypeScreen from "@/kiosk/screens/OrderTypeScreen";
import ReviewScreen from "@/kiosk/screens/ReviewScreen";

// The CoreUI admin shell pulls in Bootstrap's CSS, so it is code-split: the
// kiosk routes below never load it.
const AdminApp = lazy(() => import("@/admin/AdminApp"));

/** Centred shell for the staff login screen. */
function LoginLayout() {
    return (
        <div className="flex min-h-svh items-center justify-center p-6">
            <Outlet />
        </div>
    );
}

function App() {
    const bootstrap = useAuth((state) => state.bootstrap);

    // Restores an existing session cookie before the guards below run.
    useEffect(() => {
        void bootstrap();
    }, [bootstrap]);

    return (
        <Routes>
            {/* Every role shares the admin shell; per-view access is filtered
                inside it by AppSidebarNav and AppContent. */}
            <Route element={<RequireAuth />}>
                <Route
                    path="/admin/*"
                    element={
                        <Suspense fallback={null}>
                            <AdminApp />
                        </Suspense>
                    }
                />
            </Route>
            {/* Customer self-ordering flow. Staff sign in at /login. */}
            <Route element={<KioskRoot />}>
                <Route path="/" element={<AttractScreen />} />
                <Route path="/order" element={<OrderInProgress />}>
                    <Route index element={<OrderTypeScreen />} />
                    <Route path="menu" element={<MenuScreen />} />
                    <Route path="review" element={<ReviewScreen />} />
                </Route>
                <Route path="/order/complete" element={<ConfirmationScreen />} />
            </Route>
            <Route element={<LoginLayout />}>
                <Route element={<RedirectIfAuthenticated />}>
                    <Route path="/login" element={<LoginCard />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
