import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber } from "@/lib/general";
import { searchRepositories, trackRepository } from "@/lib/graphql";
import type { Repository, TrackedRepository } from "@/types/graphql";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Search = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // Example of using the search repositories query
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery({
    queryKey: ["repositories", debouncedSearch],
    queryFn: () => searchRepositories(debouncedSearch, 5),
    enabled: !!debouncedSearch,
  });

  const { mutateAsync: trackRepo, isPending } = useMutation({
    mutationFn: ({ id }: { id: string }) => trackRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
      toast.success("Repository tracked successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to track repository: ${error.message}`);
    },
  });

  const handleTrackRepository = ({ id }: Repository) => {
    const trackedRepos = queryClient.getQueryData<TrackedRepository[]>([
      "trackedRepositories",
    ]);

    if (trackedRepos?.some((repo) => repo.repoId === id)) {
      toast.error("Repository already tracked.");
      return;
    }

    setSearch("");
    trackRepo({ id });
  };

  return (
    <div className="relative w-full">
      <Command className="rounded-lg border shadow-md md:min-w-[450px]">
        <CommandInput
          disabled={isPending}
          placeholder="Search repositories to track"
          className="h-9"
          value={search}
          onValueChange={(value) => setSearch(value)}
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearch("");
            }
          }}
        />
        {debouncedSearch.length > 0 && (
          <CommandList className="absolute top-12 right-0 left-0 z-100 rounded-lg border bg-white shadow-md">
            {!isLoadingRepos && repositories.length === 0 && (
              <CommandEmpty>No repositories found.</CommandEmpty>
            )}
            {isLoadingRepos && <CommandEmpty>Loading...</CommandEmpty>}
            <CommandGroup>
              {repositories.map((repository) => {
                const { owner, name } = repository;
                return (
                  <CommandItem
                    disabled={isPending}
                    className="cursor-pointer"
                    key={repository.id}
                    value={`${owner}/${name}`}
                    onSelect={() => handleTrackRepository(repository)}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <p className="text-sm font-medium">
                          {owner}/{name}
                        </p>
                        <p className="text-muted-foreground block overflow-hidden text-sm overflow-ellipsis whitespace-nowrap">
                          {repository.description}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-2 overflow-hidden text-nowrap">
                        <p className="text-muted-foreground text-sm">
                          {formatNumber(repository.stars, 1)} ★
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>{" "}
          </CommandList>
        )}
      </Command>
    </div>
  );
};
