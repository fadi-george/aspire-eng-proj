import { ConfirmDialog } from "@/components/confirmDialog";
import { MarkSeenButton } from "@/components/markSeenButton";
import { RefreshButton } from "@/components/refreshButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/general";
import {
  getTrackedRepositories,
  untrackRepository,
  type TrackedRepository,
} from "@/lib/graphql";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Package, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const RepositoryList = () => {
  const queryClient = useQueryClient();
  const {
    data: repositories,
    isFetched,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["trackedRepositories"],
    queryFn: getTrackedRepositories,
  });

  const { mutate: untrackRepo, isPending: isRemovingRepo } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      untrackRepository(name, owner),
    onSuccess: (_, { name, owner }) => {
      queryClient.setQueriesData<TrackedRepository[]>(
        {
          queryKey: ["trackedRepositories"],
        },
        (data) => {
          if (!data) return [];
          return data.filter(
            (repo) => repo.name !== name && repo.owner !== owner,
          );
        },
      );
      setDeleteRepoInfo(null);
      toast.success("Repository untracked successfully!");
    },
  });

  const [deleteRepoInfo, setDeleteRepoInfo] = useState<{
    name: string;
    owner: string;
  } | null>(null);

  return (
    <div className="flex flex-1 pt-10">
      <div className="w-full pb-5">
        {/* Header */}
        <span className="flex items-center gap-2 justify-between pb-2 [view-transition-name:repo-section-header]">
          <h2>Tracked Repositories</h2>
          {isFetched && (
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
          )}
        </span>
        <hr />

        {/* Repositories */}
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-4">
          {isLoading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            <>
              {repositories?.map((repository) => {
                const { name, owner } = repository;
                return (
                  <RepositoryCard
                    key={name}
                    repository={repository}
                    onRemove={() =>
                      setDeleteRepoInfo({
                        name: name,
                        owner: owner,
                      })
                    }
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Untrack Dialog */}
      <ConfirmDialog
        open={!!deleteRepoInfo}
        isFetching={isRemovingRepo}
        title="Are you sure?"
        description={`Do you want to remove ${deleteRepoInfo?.name} from your tracked repositories?`}
        onConfirm={() => {
          if (deleteRepoInfo) {
            untrackRepo(deleteRepoInfo);
          }
        }}
        onCancel={() => {
          setDeleteRepoInfo(null);
        }}
      />
    </div>
  );
};

const LoadingCard = () => {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between mt-2">
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-[30px] h-5" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mt-2">
          <div className="flex gap-2 mb-4">
            <Skeleton className="w-15 h-4" />
            <Skeleton className="w-17 h-4" />
          </div>
          <div>
            <Skeleton className="w-full h-4 mt-2" />
            <Skeleton className="w-1/2 h-4 mt-2" />
          </div>
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const RepositoryCard = ({
  repository,
  onRemove,
}: {
  repository: TrackedRepository;
  onRemove: () => void;
}) => {
  const navigate = useNavigate({ from: "/" });

  const { owner, name, published_at, seen, tag_name } = repository;
  return (
    <Card
      key={name}
      className="gap-1 cursor-pointer"
      onClick={() => {
        navigate({ to: `/repo/${owner}/${name}` });
      }}
    >
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center gap-2">
          <span className="flex-1">{name}</span>
          {!seen && <MarkSeenButton name={name} owner={owner} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          {tag_name && (
            <div className="flex items-center gap-4 mt-2 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span>svg]:size-5">
              <span>
                <Package />
                {repository.tag_name}
                {!seen && (
                  <Badge className="border-yellow-500 bg-yellow-100 text-yellow-800 rounded-lg leading-[1.25] ">
                    New
                  </Badge>
                )}
              </span>
              {published_at && (
                <span>
                  <Calendar />
                  {formatDate(published_at)}
                </span>
              )}
            </div>
          )}
          <div className="mt-3 line-clamp-2">{repository.description}</div>
        </CardDescription>
      </CardContent>
    </Card>
  );
};
