import { MarkSeenButton } from "@/components/markSeenButton";
import { PackageTag } from "@/components/packageTag";
import { RefreshButton } from "@/components/refreshButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { hasNewRelease } from "@/lib/general";
import { getTrackedRepository } from "@/lib/graphql";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import dompurify from "dompurify";
import { ArrowLeft, GitCommitVertical } from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { toast } from "sonner";
export const Route = createFileRoute("/_auth/repo/$owner/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/repo/$owner/$name" });
  const { owner, name } = useParams({
    from: "/_auth/repo/$owner/$name",
  });
  const routerState = useRouterState();
  const state = routerState.location.state;
  const [parsedNotes, setParsedNotes] = useState<string>("");

  const {
    data: repository,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["repository", owner, name],
    queryFn: () => getTrackedRepository(owner, name),
    enabled: !!owner && !!name,
  });

  useEffect(() => {
    const getParsedNotes = async () => {
      const release_notes = repository?.release_notes ?? "";
      const notes = await marked.parse(release_notes);
      setParsedNotes(dompurify.sanitize(notes));
    };

    getParsedNotes();
  }, [repository?.release_notes]);

  if (!owner || !name) {
    return <Navigate to="/" />;
  }

  if (!repository && !isLoading) {
    toast.error("Repository is not tracked.");
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

  const isNewRelease = hasNewRelease({ last_seen_at, published_at });

  return (
    <div className="pb-10">
      <div className="[view-transition-name:repo-section-header] sticky top-0 bg-slate-50 z-1 pt-[10px] mt-[-10px]">
        <div className="flex items-center justify-between gap-2 pb-2 ">
          {/* Back button */}
          <span className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="!w-6 !h-6" />
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
            {isNewRelease && <MarkSeenButton repoId={repoId} />}
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
          </span>
        </div>
        <span className="pb-3 pl-[44px] block text-gray-500 whitespace-pre-wrap">
          {isLoading ? <Skeleton className="w-[200px] h-4" /> : description}
        </span>
        <hr />
      </div>

      <Card
        className={cn("mt-4 mx-auto max-w-5xl", {
          "pb-0": !isLoading,
        })}
        style={{
          viewTransitionName: `card-${owner}-${name}`,
        }}
      >
        <CardHeader>
          <CardTitle className="flex justify-between">
            <h2>Latest Release</h2>
            <span className="flex flex-row gap-4 items-center">
              {isLoading ? (
                <>
                  <Skeleton className="w-[80px] h-4" />
                  <Skeleton className="w-[100px] h-4" />
                  <Skeleton className="w-[100px] h-4" />
                </>
              ) : (
                <>
                  {/* Release metadata */}
                  {release_commit && (
                    <span className="flex items-center gap-1">
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
              <Skeleton className="w-1/4 h-[20px]" />
              <Skeleton className="w-5/6 h-[20px]" />
              <Skeleton className="w-full h-[20px]" />
              <Skeleton className="w-3/4 h-[20px]" />
              <Skeleton className="w-4/6 h-[20px]" />
            </div>
          ) : (
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: parsedNotes }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
