import {
  PageHeaderSkeleton,
  CardGridSkeleton,
  PanelSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <PanelSkeleton lines={2} />
      <CardGridSkeleton count={2} />
    </div>
  );
}
