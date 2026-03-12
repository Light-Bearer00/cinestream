/**
 * Skeleton loaders for loading states.
 */

export function MovieCardSkeleton() {
  return (
    <div className="w-44 md:w-52 shrink-0">
      <div className="aspect-[2/3] rounded-lg shimmer" />
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-3/4 rounded shimmer" />
        <div className="h-3 w-1/2 rounded shimmer" />
      </div>
    </div>
  );
}

export function MovieRowSkeleton({ count = 6 }) {
  return (
    <section className="py-4">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-4">
        <div className="h-8 w-48 rounded shimmer" />
      </div>
      <div className="flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] bg-cinema-dark shimmer" />
  );
}
