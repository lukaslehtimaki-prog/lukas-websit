import {
  PageHeaderSkeleton,
  PanelSkeleton,
  Skeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton wide />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <PanelSkeleton lines={4} />
          <PanelSkeleton lines={3} />
          <PanelSkeleton lines={3} />
        </div>
        <Skeleton className="h-[70vh] min-h-[420px] rounded-2xl" />
      </div>
    </div>
  );
}
