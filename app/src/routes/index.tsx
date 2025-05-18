import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "../components/Search";
import { Card } from "../components/ui/card";
import { getTrackedRepositories } from "../lib/graphql";

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

const RepositoryList = () => {
  const { data: repositories, isLoading } = useQuery({
    queryKey: ["trackedRepositories"],
    queryFn: getTrackedRepositories,
  });

  return (
    <div className="flex flex-1 pt-10">
      <div className="w-full">
        <h2>Tracked Repositories</h2>
        <hr />

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {repositories?.map((repository) => (
              <Card key={repository.name}>{repository.name}</Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
