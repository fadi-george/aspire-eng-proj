import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
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
          <div className="mt-3 flex flex-col gap-2">
            {repositories?.map((repository) => (
              <Card key={repository.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex-1">{repository.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDeleteRepoInfo({
                          name: repository.name,
                          owner: repository.owner,
                        })
                      }
                    >
                      <X />
                    </Button>
                  </CardTitle>
                  <CardDescription>{repository.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
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
