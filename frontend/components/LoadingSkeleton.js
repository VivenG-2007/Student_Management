'use client';

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl skeleton-shimmer"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded skeleton-shimmer"></div>
          <div className="h-6 w-2/3 rounded skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 rounded skeleton-shimmer w-full max-w-[120px]"></div>
        </td>
      ))}
    </tr>
  );
}

export function Spinner({ size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-[2px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  };

  return (
    <div
      className={`inline-block rounded-full border-zinc-300 dark:border-zinc-700 border-t-indigo-600 animate-spin ${
        sizeClasses[size] || sizeClasses.sm
      } ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
