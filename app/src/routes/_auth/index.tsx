import { createFileRoute } from "@tanstack/react-router";
import { Search } from "./-home/search";
import { RepositoryList } from "./-home/trackedList";

function Index() {
  return (
    <>
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
