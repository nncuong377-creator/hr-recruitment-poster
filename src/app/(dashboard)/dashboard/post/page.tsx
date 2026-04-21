import { Suspense } from "react";
import { PostPageClient } from "./_components/post-page-client";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingFallback() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex gap-6">
        <div className="w-[35%] space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PostPageClient />
    </Suspense>
  );
}
