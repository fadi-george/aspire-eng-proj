import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/login/callback")({
  component: LoginCallback,
  validateSearch: (search) => {
    return z
      .object({
        code: z.string(),
        redirect: z.string().optional(),
      })
      .parse(search);
  },
  beforeLoad: async ({ search, context }) => {
    const { code } = search;
    if (!code) {
      throw redirect({
        to: "/login",
      });
    }

    await context.auth.getCookie(code);
    throw redirect({ to: "/login", search: { redirect: search.redirect } });
  },
});

function LoginCallback() {
  return "Loading...";
}
