import { apiFetch } from "./apiFetch";

export async function getCart() {
  const response = await apiFetch("/cart/");

  if (!response.ok) {
    throw new Error(
      "Не удалось загрузить корзину"
    );
  }

  return response.json();
}

export async function addToCart(
  productId,
  quantity = 1
) {
  const response = await apiFetch("/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      quantity,
    }),
  });

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.detail ||
        "Не удалось добавить товар в корзину"
    );
  }

  return response.json();
}

export async function updateCartItem(
  productId,
  quantity
) {
  const response = await apiFetch(
    `/cart/items/${productId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity,
      }),
    }
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.detail ||
        "Не удалось изменить количество"
    );
  }

  return response.json();
}

export async function removeFromCart(
  productId
) {
  const response = await apiFetch(
    `/cart/items/${productId}`,
    {
      method: "DELETE",
    }
  );

  if (
    !response.ok &&
    response.status !== 204
  ) {
    throw new Error(
      "Не удалось удалить товар из корзины"
    );
  }
}

export async function clearCart() {
  const response = await apiFetch("/cart/", {
    method: "DELETE",
  });

  if (
    !response.ok &&
    response.status !== 204
  ) {
    throw new Error(
      "Не удалось очистить корзину"
    );
  }
}