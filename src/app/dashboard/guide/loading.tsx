import {
  PageHeaderSkeleton,
  PanelSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PanelSkeleton key={i} lines={2} />
        ))}
      </div>
    </div>
  );
}
