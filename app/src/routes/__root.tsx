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
  console.log("Root", user);
  return (
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
      <header className="px-12 max-w-7xl m-auto pt-3">
        {user ? <Button onClick={logout}>Logout</Button> : null}
      </header>
      <main className="h-screen p-12 pt-8 max-w-7xl m-auto">
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </main>
    </>
  );
}
