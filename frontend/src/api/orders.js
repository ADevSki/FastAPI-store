import { apiFetch } from "./apiFetch";

export async function checkoutOrder() {
  const response = await apiFetch("/orders/checkout", {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail || "Не удалось оформить заказ"
    );
  }

  return response.json();
}


export async function getOrders(page = 1, pageSize = 20) {
  const response = await apiFetch(
    `/orders/?page=${page}&page_size=${pageSize}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail || "Не удалось загрузить заказы"
    );
  }

  return response.json();
}


export async function getOrder(orderId) {
  const response = await apiFetch(`/orders/${orderId}`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail || "Не удалось загрузить заказ"
    );
  }

  return response.json();
}


export async function getOrderStatus(orderId) {
  const response = await apiFetch(
    `/orders/${orderId}/status`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail || "Не удалось загрузить статус заказа"
    );
  }

  return response.json();
}