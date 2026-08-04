import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[104px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
      </div>
    </main>
  );
}
