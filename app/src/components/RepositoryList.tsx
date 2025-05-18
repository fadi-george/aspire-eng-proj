import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { formatNumber } from "../lib/general";
import { graphqlClient, untrackRepository } from "../lib/graphql";

interface Repository {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  owner: string;
}

const fetchTrackedRepositories = async () => {
  const query = `
    query {
      trackedRepositories {
        name
        description
        url
        stars
        language
        owner
      }
    }
  `;
  const response = await graphqlClient.request<{
    trackedRepositories: Repository[];
  }>(query);
  return response.trackedRepositories;
};

export const RepositoryList = () => {
  const queryClient = useQueryClient();
  const { data: repositories, isLoading } = useQuery({
    queryKey: ["trackedRepositories"],
    queryFn: fetchTrackedRepositories,
  });

  const { mutate: untrackRepo } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      untrackRepository(name, owner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
    },
  });

  if (isLoading) {
    return <div>Loading repositories...</div>;
  }

  if (!repositories?.length) {
    return (
      <div>
        No repositories tracked yet. Search and select repositories to track
        them.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {repositories.map((repo) => (
        <div
          key={repo.url}
          className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold truncate">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {repo.owner}/{repo.name}
                </a>
              </h3>
              {repo.language && (
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  {repo.language}
                </span>
              )}
            </div>
            {repo.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {repo.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>★</span>
              <span>{formatNumber(repo.stars, 1)}</span>
            </div>
            <button
              onClick={() =>
                untrackRepo({ name: repo.name, owner: repo.owner })
              }
              className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Untrack repository"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
