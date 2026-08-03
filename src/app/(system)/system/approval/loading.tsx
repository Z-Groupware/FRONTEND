import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="mx-auto h-8 w-64 rounded-md" />
      </div>
    </main>
  );
}
