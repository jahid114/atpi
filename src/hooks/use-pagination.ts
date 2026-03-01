import { useMemo, useState } from "react";

interface UsePaginationOptions {
  pageSize?: number;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 if items change and current page is out of bounds
  const safePage = currentPage > totalPages ? 1 : currentPage;

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    paginatedItems,
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    goToPage,
    nextPage: () => goToPage(safePage + 1),
    prevPage: () => goToPage(safePage - 1),
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}
