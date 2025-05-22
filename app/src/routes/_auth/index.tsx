import { useAuth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "./-home/search";
import { RepositoryList } from "./-home/trackedList";

function Index() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0];
  return (
    <>
      <h1 className="text-1xl font-normal pb-2">Welcome, {firstName}</h1>
      <div className="flex justify-center items-center">
        <Search />
      </div>
      <RepositoryList />
    </>
  );
}

export const Route = createFileRoute("/_auth/")({
  component: Index,
});
