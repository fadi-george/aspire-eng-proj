import BackgroundImg from "@/assets/pattern-1.jpeg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/login/")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  beforeLoad: async ({ context, search }) => {
    const { auth } = context;

    let user = auth.user;
    if (!user) {
      user = await auth.getUser();
    }

    if (user) {
      throw redirect({ to: search.redirect || "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { login } = useAuth();
  return (
    <div className="flex h-full flex-col items-center">
      <div
        className="fixed top-0 left-0 z-[-1] h-full w-full bg-[size:auto_50%] bg-[position:50%_10%] bg-no-repeat"
        style={{
          backgroundImage: `url(${BackgroundImg})`,
        }}
      />
      <div className="relative top-[30%] flex max-w-[400px] flex-col items-center">
        <h1 className="mb-4 text-4xl font-bold">Git Tracker</h1>
        <p className="mb-6 text-center text-xl font-medium text-gray-500 [text-wrap-style:balance]">
          Track your favorite repositories and stay up to date with releases.
        </p>

        {/* Login button */}
        <Button className="mx-auto w-full max-w-[320px]" onClick={login}>
          <SiGithub fill="white" className="mr-2 shrink-0" />
          Login with GitHub
        </Button>
      </div>
    </div>
  );
}
