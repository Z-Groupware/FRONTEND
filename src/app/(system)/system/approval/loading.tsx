import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <Skeleton className="h-[360px] rounded-2xl" />
        <Skeleton className="mx-auto h-8 w-64 rounded-md" />
      </div>
    </main>
  );
}
