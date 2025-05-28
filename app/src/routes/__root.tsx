import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { AuthContextType } from "@/lib/auth-context";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

interface RouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});

function Root() {
  const { user, logout } = useAuth();
  return (
    <>
      <Toaster richColors position="bottom-right" />
      <header className="absolute right-0 left-0 m-auto flex min-h-[48px] max-w-7xl items-center justify-between px-3 pt-3 sm:px-12">
        <img src="/logo.svg" alt="logo" className="h-8" />
        {user ? <Button onClick={logout}>Logout</Button> : null}
      </header>
      <main className="m-auto h-screen max-w-7xl px-3 pt-20 pb-3 sm:px-12">
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </main>
    </>
  );
}
