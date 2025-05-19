import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            // success: "!bg-green-50",
            // error: "!bg-red-100",
          },
        }}
        duration={Infinity}
      />
      <main className="h-screen">
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </main>
    </>
  ),
});
