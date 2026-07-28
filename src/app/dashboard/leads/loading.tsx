import {
  PageHeaderSkeleton,
  PanelSkeleton,
  Skeleton,
  TableSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeaderSkeleton wide />
        <div className="flex gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-32 rounded-xl" />
          ))}
        </div>
      </div>
      <PanelSkeleton lines={2} />
      <TableSkeleton rows={8} />
    </div>
  );
}
