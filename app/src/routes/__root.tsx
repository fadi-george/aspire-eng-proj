import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  const { user, logout } = useAuth();
  return (
    <>
      <Toaster richColors position="bottom-right" />
      <header className="flex justify-between items-center px-12 max-w-7xl m-auto pt-3">
        <img src="/aspire.png" alt="logo" className="h-6" />
        {user ? <Button onClick={logout}>Logout</Button> : null}
      </header>
      <main className="h-screen pt-20 p-12 max-w-7xl m-auto ">
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </main>
    </>
  );
}
