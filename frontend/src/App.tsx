import { Suspense, lazy, useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import LoginCard from "@/components/examples/card/standard/login-card";
import RedirectIfAuthenticated from "@/auth/RedirectIfAuthenticated";
import RequireAuth from "@/auth/RequireAuth";
import { useAuth } from "@/auth/useAuth";

// The CoreUI admin shell pulls in Bootstrap's CSS, so it is code-split: the
// kiosk routes below never load it.
const AdminApp = lazy(() => import("@/admin/AdminApp"));

/** Centred shell for the customer-facing kiosk screens. */
function KioskLayout() {
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
            <Route element={<KioskLayout />}>
                <Route path="/" element={<Navigate replace to="/login" />} />
                <Route element={<RedirectIfAuthenticated />}>
                    <Route path="/login" element={<LoginCard />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
