import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4">
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
    </main>
  );
}
