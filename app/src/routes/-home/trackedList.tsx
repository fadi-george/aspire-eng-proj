import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Package, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "../../components/confirmDialog";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { formatDate } from "../../lib/general";
import { getTrackedRepositories, untrackRepository } from "../../lib/graphql";

export const RepositoryList = () => {
  const queryClient = useQueryClient();
  const { data: repositories, isLoading } = useQuery({
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
        <h2>Tracked Repositories</h2>
        <hr />

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-4">
            {repositories?.map((repository) => {
              const { name, published_at, tag_name } = repository;
              return (
                <Card key={name}>
                  <CardHeader>
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
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
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
