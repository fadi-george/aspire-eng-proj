import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster position="bottom-right" />
      <main className="h-screen">
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </main>
    </>
  ),
});
