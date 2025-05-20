import { RefreshButton } from "@/components/refreshButton";
import { getTrackedRepository } from "@/lib/graphql";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/repo/$owner/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const { owner, name } = useParams({
    from: "/repo/$owner/$name",
  });
  const {
    data: repository,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["repository", owner, name],
    queryFn: () => getTrackedRepository(owner, name),
    enabled: !!owner && !!name,
  });

  if (!owner || !name) {
    return <Navigate to="/" />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!repository) {
    toast.error("Repository is not tracked.");
    return <Navigate to="/" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-2">
        <h1>
          {repository.owner} / {repository.name}
        </h1>
        <RefreshButton isFetching={isFetching} onRefresh={refetch} />
      </div>
      <hr />
    </div>
  );
}
