import {
  PageHeaderSkeleton,
  PanelSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <PanelSkeleton lines={3} />
      <PanelSkeleton lines={3} />
      <PanelSkeleton lines={2} />
    </div>
  );
}
