type PaginationInput = {
  page?: string | number;
  limit?: string | number;
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
};

const normalizeNumber = (
  value: string | number | undefined,
  fallback: number,
) => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  if (typeof parsed !== 'number' || Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

export function parsePagination({
  page,
  limit,
  defaultPage = 1,
  defaultLimit = 10,
  maxLimit,
}: PaginationInput) {
  const safePage = normalizeNumber(page, defaultPage);
  let safeLimit = normalizeNumber(limit, defaultLimit);
  if (maxLimit && safeLimit > maxLimit) {
    safeLimit = maxLimit;
  }

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}
