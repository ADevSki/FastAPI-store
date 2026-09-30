import { apiFetch } from "./apiFetch";

export async function getCategories() {
  const response = await apiFetch("/categories/");

  if (!response.ok) {
    throw new Error("Не удалось загрузить категории");
  }

  return response.json();
}