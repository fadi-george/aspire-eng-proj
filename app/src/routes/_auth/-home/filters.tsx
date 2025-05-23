import { Button } from "@/components/ui/button";
import { Command, CommandInput } from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  PackageCheck,
} from "lucide-react";

export default function Filters({
  filter,
  setFilter,
  sortBy,
  setSortBy,
}: {
  filter: { search: string; unseen: boolean };
  setFilter: (filter: { search: string; unseen: boolean }) => void;
  sortBy: {
    key: "name" | "published_at" | null;
    direction: "asc" | "desc" | null;
  };
  setSortBy: (sortBy: {
    key: "name" | "published_at" | null;
    direction: "asc" | "desc" | null;
  }) => void;
}) {
  const sortKey = sortBy.key;
  const isAsc = sortBy.direction === "asc";
  const isUnseen = filter.unseen;

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <Command className="rounded-lg border shadow-xs">
        <CommandInput
          placeholder="Search repos"
          className="h-9"
          value={filter.search}
          onValueChange={(value) => setFilter({ ...filter, search: value })}
        />
      </Command>

      {/* Filter by Unseen */}
      <TooltipProvider>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isUnseen ? "default" : "outline"}
              onClick={() => setFilter({ ...filter, unseen: !isUnseen })}
            >
              <PackageCheck />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isUnseen ? "Show All" : "Show New"} Releases</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Sort by Name */}
      <TooltipProvider>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                setSortBy({ key: "name", direction: isAsc ? "desc" : "asc" })
              }
            >
              {isAsc && sortKey === "name" ? <ArrowDownAZ /> : <ArrowUpAZ />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sort by Name</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Sort by Published at */}
      <TooltipProvider>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                setSortBy({
                  key: "published_at",
                  direction: isAsc ? "desc" : "asc",
                })
              }
            >
              {isAsc && sortKey === "published_at" ? (
                <CalendarArrowDown />
              ) : (
                <CalendarArrowUp />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sort by Published at</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
