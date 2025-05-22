import { Package } from "lucide-react";

import { formatDate, hasNewRelease } from "@/lib/general";
import { Calendar } from "lucide-react";
import { Badge } from "./ui/badge";

export const PackageTag = ({
  release_tag,
  published_at,
  last_seen_at,
}: {
  release_tag: string | null;
  published_at: string | null;
  last_seen_at: string | null;
}) => {
  const isNewRelease = hasNewRelease({
    last_seen_at,
    published_at,
  });
  if (!release_tag) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span>svg]:size-5">
      <span>
        <Package />
        {release_tag}
        {isNewRelease && (
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
  );
};
