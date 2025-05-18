import { createFileRoute } from "@tanstack/react-router";
import { Search } from "./-home/search";
import { RepositoryList } from "./-home/trackedList";

function Index() {
  return (
    <div className="p-12 max-w-7xl m-auto">
      <div className="flex justify-center items-center">
        <Search />
      </div>
      <RepositoryList />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
});
