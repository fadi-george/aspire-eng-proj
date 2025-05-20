import { MarkSeenButton } from "@/components/markSeenButton";
import { RefreshButton } from "@/components/refreshButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrackedRepository } from "@/lib/graphql";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/repo/$owner/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/repo/$owner/$name" });
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

  console.log("repository", repository);

  if (!owner || !name) {
    return <Navigate to="/" />;
  }

  if (!repository && !isLoading) {
    toast.error("Repository is not tracked.");
    return <Navigate to="/" />;
  }

  const { description } = repository ?? {
    description: " ",
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-2 [view-transition-name:repo-section-header]">
        <span className="flex items-center gap-2">
          <Button
            // className="w-fit h-fit"
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="!w-6 !h-6" />
          </Button>
          <h1>
            {owner} /{" "}
            <span className="view-transition-name:repository-name">{name}</span>
          </h1>
        </span>

        <span className="flex items-center gap-2">
          <MarkSeenButton name={name} owner={owner} />
          <RefreshButton isFetching={isFetching} onRefresh={refetch} />
        </span>
      </div>

      <span className="pb-3 pl-[44px] block text-gray-500 whitespace-pre-wrap">
        {description}
      </span>
      <hr />

      <Card>
        <CardHeader>
          <CardTitle>Latest Release</CardTitle>
        </CardHeader>
        <CardContent>
          {repository && (
            <>
              <p>{repository.body}</p>
              <p>{repository.commit}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
