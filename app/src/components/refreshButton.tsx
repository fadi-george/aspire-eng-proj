import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

export const RefreshButton = ({
  isFetching,
  onRefresh,
}: {
  isFetching: boolean;
  onRefresh: () => void;
}) => {
  return (
    <Button
      //   className="[view-transition-name:refresh-button]"
      disabled={isFetching}
      variant="outline"
      size="icon"
      onClick={() => {
        onRefresh();
      }}
    >
      <RefreshCcw className={cn(isFetching && "animate-spin")} />
    </Button>
  );
};
