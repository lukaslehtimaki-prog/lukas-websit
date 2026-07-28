import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  CardGridSkeleton,
} from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <CardGridSkeleton count={2} />
    </div>
  );
}
