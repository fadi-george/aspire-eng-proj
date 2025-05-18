import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { searchRepositories } from "../lib/graphql";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export const Search = () => {
  // const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Example of using the search repositories query
  const { data: repositories, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["repositories", debouncedSearch],
    queryFn: () => searchRepositories("react", 5),
    enabled: !!debouncedSearch,
    initialData: [],
  });

  return (
    <Command className="rounded-lg border shadow-md md:min-w-[450px]">
      <CommandInput
        placeholder="Search framework..."
        className="h-9"
        value={search}
        onValueChange={(value) => setSearch(value)}
      />
      {debouncedSearch.length > 0 && (
        <CommandList>
          {!isLoadingRepos && repositories.length === 0 && (
            <CommandEmpty>No repositories found.</CommandEmpty>
          )}
          {isLoadingRepos && <CommandEmpty>Loading...</CommandEmpty>}
          <CommandGroup>
            {repositories.map((repository) => (
              <CommandItem key={repository.url} value={repository.url}>
                {repository.name}
              </CommandItem>
            ))}
          </CommandGroup>{" "}
        </CommandList>
      )}
    </Command>
  );
};
