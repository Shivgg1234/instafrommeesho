function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const requestedLimit = query.limit === undefined ? 10 : Number(query.limit);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1
  ) {
    return null;
  }

  const limit = Math.min(requestedLimit, 50);
  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

module.exports = { parsePagination, paginationMeta };
