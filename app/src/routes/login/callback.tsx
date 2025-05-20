import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
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
});

function LoginCallback() {
  const navigate = useNavigate();
  const { code, redirect } = Route.useSearch();

  useEffect(() => {
    if (!code) {
      navigate({ to: "/login" });
      return;
    }

    const getToken = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/auth/github", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (response.ok) {
          const { access_token } = await response.json();
          localStorage.setItem("github_token", access_token);
          navigate({ to: redirect || "/" });
          return;
        }
        throw new Error("Failed to exchange code for token");
      } catch (err) {
        console.error(err);
        toast.error("Failed to login");
        navigate({ to: "/login" });
      }
    };

    getToken();
  }, [navigate, code, redirect]);

  return null;
}
