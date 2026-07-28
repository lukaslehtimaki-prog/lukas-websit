import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  PanelSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={2} />
      <PanelSkeleton lines={4} />
    </div>
  );
}
