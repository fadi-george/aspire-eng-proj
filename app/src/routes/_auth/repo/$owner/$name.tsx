import { MarkSeenButton } from "@/components/markSeenButton";
import { PackageTag } from "@/components/packageTag";
import { RefreshButton } from "@/components/refreshButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrackedRepository, refreshRepository } from "@/lib/graphql";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft, GitCommitVertical } from "lucide-react";
import { useEffect } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/repo/$owner/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: "/repo/$owner/$name" });
  const { owner, name } = useParams({
    from: "/_auth/repo/$owner/$name",
  });
  const routerState = useRouterState();
  const state = routerState.location.state;

  // get repo info
  const {
    data: repository,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["repository", owner, name],
    queryFn: () => getTrackedRepository(owner, name),
    enabled: !!owner && !!name,
  });

  // refresh repo info
  const { mutate: refreshRepo, isPending: isRefreshing } = useMutation({
    mutationFn: () => {
      if (repository?.repoId) {
        return refreshRepository(repository.repoId);
      }
      throw new Error("Repository not found");
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["repository", owner, name], () => response);
    },
    onError: () => {
      toast.error("Failed to refresh repository.");
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Repository is not tracked.");
      navigate({ to: "/" });
    }
  }, [error, navigate]);

  if (!owner || !name) {
    return <Navigate to="/" />;
  }
  const {
    description,
    repoId,
    last_seen_at,
    published_at,
    release_tag,
    release_commit,
  } = repository ?? {
    description: " ",
    repoId: state.repoId ?? "",
    last_seen_at: state.last_seen_at ?? null,
    published_at: state.published_at ?? null,
    release_tag: "",
    release_commit: "",
  };

  const release_notes = repository?.release_notes ?? "";

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-1 mt-[-10px] bg-slate-50 pt-[10px] [view-transition-name:repo-section-header]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          {/* Back button */}
          <span className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="!h-6 !w-6" />
            </Button>
            <h1>
              {owner} /{" "}
              <span className="view-transition-name:repository-name">
                {name}
              </span>
            </h1>
          </span>

          {/* Mark as seen and refresh latest button */}
          <span className="flex items-center gap-2">
            <MarkSeenButton
              last_seen_at={last_seen_at}
              name={name}
              owner={owner}
              published_at={published_at}
              repoId={repoId}
            />
            <RefreshButton isFetching={isRefreshing} onRefresh={refreshRepo} />
          </span>
        </div>
        <span className="block pb-3 pl-[44px] whitespace-pre-wrap text-gray-500">
          {isLoading ? <Skeleton className="h-4 w-[200px]" /> : description}
        </span>
        <hr />
      </div>

      <Card
        className={cn("mx-auto mt-4 max-w-5xl")}
        style={{
          viewTransitionName: `card-${owner}-${name}`,
        }}
      >
        <CardHeader>
          <CardTitle className="flex flex-wrap justify-between gap-2">
            <h2>Latest Release</h2>
            <span className="flex flex-row items-center gap-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </>
              ) : (
                <>
                  {/* Release metadata */}
                  {release_commit && (
                    <span className="ml-[-8px] flex items-center gap-1">
                      <GitCommitVertical /> {release_commit.slice(0, 7)}
                    </span>
                  )}
                  <PackageTag
                    release_tag={release_tag}
                    published_at={published_at}
                    last_seen_at={last_seen_at}
                  />
                </>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <hr />
        <CardContent>
          {/* Release notes */}
          {isLoading ? (
            <div className="flex flex-col gap-5">
              <Skeleton className="h-[20px] w-1/4" />
              <Skeleton className="h-[20px] w-5/6" />
              <Skeleton className="h-[20px] w-full" />
              <Skeleton className="h-[20px] w-3/4" />
              <Skeleton className="h-[20px] w-4/6" />
            </div>
          ) : (
            <>
              {release_notes ? (
                <div className="prose markdown-body max-w-full">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {repository?.release_notes ?? ""}
                  </Markdown>
                </div>
              ) : (
                <p className="text-center text-lg text-gray-600">
                  No release notes found.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
