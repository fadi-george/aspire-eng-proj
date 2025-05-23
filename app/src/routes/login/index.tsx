import BackgroundImg from "@/assets/pattern-1.jpeg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/login/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { getUser, login, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getUser()
      .then((user) => {
        if (user) {
          navigate({ to: "/" });
        }
      })
      .catch(() => {
        logout();
      });
  }, [getUser, logout, navigate]);

  return (
    <div className="flex flex-col items-center h-full">
      <div
        className="fixed top-0 left-0 w-full h-full z-[-1] bg-no-repeat bg-[position:50%_10%] bg-[size:auto_50%]"
        style={{
          backgroundImage: `url(${BackgroundImg})`,
        }}
      />
      <div className="relative top-[30%] max-w-[400px] flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4">Git Tracker</h1>
        <p className="text-xl font-medium mb-6 text-center text-gray-500 [text-wrap-style:balance]">
          Track your favorite repositories and stay up to date with releases.
        </p>

        {/* Login button */}
        <Button className="w-full max-w-[320px] mx-auto" onClick={login}>
          <SiGithub fill="white" className="shrink-0 mr-2" />
          Login with GitHub
        </Button>
      </div>
    </div>
  );
}
