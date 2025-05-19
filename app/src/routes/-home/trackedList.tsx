import { ConfirmDialog } from "@/components/confirmDialog";
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
  markRepositoryAsSeen,
  untrackRepository,
  type TrackedRepository,
} from "@/lib/graphql";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Package, RefreshCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const RepositoryList = () => {
  const queryClient = useQueryClient();
  const {
    data: repositories,
    isFetched,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["trackedRepositories"],
    queryFn: getTrackedRepositories,
  });

  const { mutate: untrackRepo, isPending: isRemovingRepo } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      untrackRepository(name, owner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
      setDeleteRepoInfo(null);
      toast.success("Repository untracked successfully!");
    },
  });

  const { mutateAsync: markAsSeen } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      markRepositoryAsSeen(name, owner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
    },
  });

  const [deleteRepoInfo, setDeleteRepoInfo] = useState<{
    name: string;
    owner: string;
  } | null>(null);

  return (
    <div className="flex flex-1 pt-10">
      <div className="w-full">
        {/* Header */}
        <span className="flex items-center gap-2 justify-between pb-2">
          <h2>Tracked Repositories</h2>
          {isFetched && (
            <Button
              disabled={isFetching}
              variant="outline"
              size="icon"
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: ["trackedRepositories"],
                });
              }}
            >
              <RefreshCcw className={cn(isFetching && "animate-spin")} />
            </Button>
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
                    onMarkAsSeen={() => {
                      return markAsSeen({ name, owner });
                    }}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
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
  onMarkAsSeen,
}: {
  repository: TrackedRepository;
  onRemove: () => void;
  onMarkAsSeen: () => Promise<boolean>;
}) => {
  const { name, published_at, seen, tag_name } = repository;
  const [isFetching, setIsFetching] = useState(false);
  return (
    <Card key={name} className="gap-1">
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center gap-2">
          <span className="flex-1">{name}</span>
          {!seen && (
            <Button
              size="sm"
              variant="outline"
              disabled={isFetching}
              onClick={() => {
                setIsFetching(true);
                onMarkAsSeen().finally(() => {
                  setIsFetching(false);
                });
              }}
            >
              Mark as seen
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onRemove}>
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
