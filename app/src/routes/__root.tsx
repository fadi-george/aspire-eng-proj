import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster
        richColors
        position="bottom-right"
        // toastOptions={{
        //   classNames: {
        //     error: "!bg-red-500 !text-white",
        //   },
        // }}
      />
      <main className="h-screen p-12 max-w-7xl m-auto">
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </main>
    </>
  ),
});
