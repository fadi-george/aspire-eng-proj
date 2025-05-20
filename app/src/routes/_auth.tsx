import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { AuthContextType } from "../lib/auth-context";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    const { auth } = context as { auth: AuthContextType };
    const user = await auth.getUser();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: () => <Outlet />,
});
