import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Package, RefreshCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "../../components/confirmDialog";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { formatDate } from "../../lib/general";
import { getTrackedRepositories, untrackRepository } from "../../lib/graphql";
import { cn } from "../../lib/utils";

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

  const { mutate: untrackRepo } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      untrackRepository(name, owner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
      setDeleteRepoInfo(null);
      toast.success("Repository untracked successfully!");
    },
  });

  const [deleteRepoInfo, setDeleteRepoInfo] = useState<{
    name: string;
    owner: string;
  } | null>(null);

  const handleDeleteRepo = (name: string, owner: string) => {
    untrackRepo({ name, owner });
  };

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
                const { name, published_at, tag_name } = repository;
                return (
                  <Card key={name} className="gap-1">
                    <CardHeader className="gap-0">
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex-1">{name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteRepoInfo({
                              name,
                              owner: repository.owner,
                            })
                          }
                        >
                          <X />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {tag_name && (
                          <div className="flex items-center gap-4 mb-2 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span>svg]:size-5">
                            <span>
                              <Package />
                              {repository.tag_name}
                            </span>
                            {published_at && (
                              <span>
                                <Calendar />
                                {formatDate(published_at)}
                              </span>
                            )}
                          </div>
                        )}
                        <span>{repository.description}</span>
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteRepoInfo}
        title="Are you sure?"
        description={`Do you want to remove ${deleteRepoInfo?.name} from your tracked repositories?`}
        onConfirm={() => {
          if (deleteRepoInfo) {
            handleDeleteRepo(deleteRepoInfo.name, deleteRepoInfo.owner);
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
        <CardTitle>
          <Skeleton className="w-full h-5 mt-2" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mt-2">
          <div className="flex gap-2">
            <Skeleton className="w-15 h-4" />
            <Skeleton className="w-17 h-4" />
          </div>
          <Skeleton className="w-full h-4 mt-2" />
        </CardDescription>
      </CardContent>
    </Card>
  );
};
