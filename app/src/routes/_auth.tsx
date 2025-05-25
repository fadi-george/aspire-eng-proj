import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    const { auth } = context;
    if (auth.user) return;

    throw redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
    });
  },
  component: () => <Outlet />,
});
