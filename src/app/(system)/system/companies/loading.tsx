import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[280px] rounded-lg" />
          <Skeleton className="h-8 w-[110px] rounded-lg" />
          <Skeleton className="h-8 w-[100px] rounded-lg" />
        </div>
        <Skeleton className="h-[561px] rounded-2xl" />
        <Skeleton className="mx-auto h-8 w-64 rounded-md" />
      </div>
    </main>
  );
}
