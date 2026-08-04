import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <Skeleton className="h-5 w-56 rounded" />
        <Skeleton className="h-[73px] rounded-lg" />
      </div>
    </main>
  );
}
