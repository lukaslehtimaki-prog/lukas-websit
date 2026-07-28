import {
  PageHeaderSkeleton,
  CardGridSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} cols={3} />
    </div>
  );
}
