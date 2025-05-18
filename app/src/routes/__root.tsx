import { createRootRoute, Outlet } from "@tanstack/react-router";

// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <main className="h-screen">
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </main>
  ),
});
