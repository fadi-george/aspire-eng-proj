import { useAuth } from "@/lib/auth";
import { usePromptForNotifications } from "@/lib/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "./-home/search";
import { RepositoryList } from "./-home/trackedList";

function Index() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0];

  usePromptForNotifications();

  return (
    <>
      <h1 className="text-1xl pb-2 font-normal">Welcome, {firstName}</h1>
      <div className="flex items-center justify-center">
        <Search />
      </div>
      <RepositoryList />
    </>
  );
}

export const Route = createFileRoute("/_auth/")({
  component: Index,
});
