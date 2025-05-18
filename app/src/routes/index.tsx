import { createFileRoute } from "@tanstack/react-router";
import { Search } from "../components/Search";

function Index() {
  return (
    <div className="p-10">
      <div className="flex justify-center items-center">
        <Search />
      </div>
      <div className="flex flex-1 pt-10">
        <div className="w-full">
          <h2>Repositories</h2>
          <hr />
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
});
