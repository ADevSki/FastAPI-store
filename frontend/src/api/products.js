export async function getProducts(filters, page = 1, pageSize = 12) {
  const params = new URLSearchParams();

  if (filters.categoryId !== null) {
    params.append("category_id", filters.categoryId);
  }

  if (filters.minPrice !== "") {
    params.append("min_price", filters.minPrice);
  }

  if (filters.maxPrice !== "") {
    params.append("max_price", filters.maxPrice);
  }

  if (filters.inStock !== null) {
    params.append("in_stock", filters.inStock);
  }

  if (filters.sortByDate) {
    params.append("sort_by_date", "true");
  }

  if (filters.search !== "") {
    params.append("search", filters.search);
  }

  params.append("page", page);
  params.append("page_size", pageSize);

  const response = await fetch(
    `/api/products/?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Не удалось получить товары");
  }

  return response.json();
}