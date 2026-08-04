import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-[1440px]">
        <Skeleton className="h-[220px] max-w-[720px] rounded-xl" />
      </div>
    </main>
  );
}
