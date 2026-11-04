export function BookListSkeleton({ count }: { count: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">Loading results...</span>
      <div className="row g-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-body d-flex gap-3 placeholder-glow">
                <span className="placeholder skeleton-cover rounded" />
                <div className="flex-grow-1">
                  <span className="placeholder col-8 mb-2" />
                  <span className="placeholder col-5 mb-2" />
                  <span className="placeholder col-12" />
                  <span className="placeholder col-10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
