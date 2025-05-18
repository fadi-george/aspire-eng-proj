import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import { useDebounce } from "../../hooks/useDebounce";
import { formatNumber } from "../../lib/general";
import {
  searchRepositories,
  trackRepository,
  type Repository,
} from "../../lib/graphql";

export const Search = () => {
  // const [open, setOpen] = useState(false);
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

  const { mutate: trackRepo } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      trackRepository(name, owner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
      toast.success("Repository tracked successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to track repository: ${error.message}`);
    },
  });

  const handleTrackRepository = (repository: Repository) => {
    console.log("tracking repository", repository, {
      name: repository.name,
      owner: repository.owner,
    });
    trackRepo({ name: repository.name, owner: repository.owner });
    setSearch("");
  };

  return (
    <div className="relative w-full">
      <Command className="rounded-lg border shadow-md md:min-w-[450px]">
        <CommandInput
          placeholder="Search repositories"
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
          <CommandList className="absolute right-0 left-0 top-12 bg-white shadow-md border rounded-lg">
            {!isLoadingRepos && repositories.length === 0 && (
              <CommandEmpty>No repositories found.</CommandEmpty>
            )}
            {isLoadingRepos && <CommandEmpty>Loading...</CommandEmpty>}
            <CommandGroup>
              {repositories.map((repository) => (
                <CommandItem
                  className="cursor-pointer"
                  key={repository.url}
                  value={repository.url}
                  onSelect={() => handleTrackRepository(repository)}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <div className="flex flex-col overflow-hidden flex-1 ">
                      <p className="text-sm font-medium">{repository.name}</p>
                      <p className="text-sm text-muted-foreground overflow-ellipsis whitespace-nowrap block overflow-hidden">
                        {repository.description}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-nowrap overflow-hidden">
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(repository.stars, 1)} ★
                      </p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>{" "}
          </CommandList>
        )}
      </Command>
    </div>
  );
};
