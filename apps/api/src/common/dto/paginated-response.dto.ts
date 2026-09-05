export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    data,
    meta: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
