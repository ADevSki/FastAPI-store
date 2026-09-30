import { useEffect, useState } from "react";

import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../api/cart";

import { checkoutOrder } from "../api/orders";

import "./CartPage.css";


function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(price));
}


export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);


  async function loadCart() {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();

      setCart(data);

      // Обновляем количество товаров в шапке
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: data.total_quantity,
        })
      );

    } catch (err) {
      console.error(err);

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCart();
  }, []);


  async function handleQuantityChange(
    productId,
    quantity
  ) {
    if (quantity < 1) {
      return;
    }

    try {
      setError("");

      await updateCartItem(
        productId,
        quantity
      );

      /*
       * После изменения количества
       * получаем актуальную корзину целиком.
       */
      const updatedCart = await getCart();

      setCart(updatedCart);

      // Обновляем число товаров в шапке
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: updatedCart.total_quantity,
        })
      );

    } catch (err) {
      console.error(err);

      setError(err.message);
    }
  }


  async function handleRemove(productId) {
    try {
      setError("");

      await removeFromCart(productId);

      const updatedCart = await getCart();

      setCart(updatedCart);

      // Обновляем число товаров в шапке
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: updatedCart.total_quantity,
        })
      );

    } catch (err) {
      console.error(err);

      setError(err.message);
    }
  }


  async function handleClearCart() {
    try {
      setError("");

      await clearCart();

      const updatedCart = await getCart();

      setCart(updatedCart);

      // Обновляем число товаров в шапке
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: updatedCart.total_quantity,
        })
      );

    } catch (err) {
      console.error(err);

      setError(err.message);
    }
  }


  async function handleCheckout() {
  try {
    setError("");
    setCheckoutLoading(true);

    const order = await checkoutOrder();

    setCheckoutSuccess(order);

    window.dispatchEvent(new Event("orders-updated"));

    const updatedCart = await getCart();
    setCart(updatedCart);

    window.dispatchEvent(
      new CustomEvent("cart-updated", {
        detail: updatedCart.total_quantity,
      })
    );
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setCheckoutLoading(false);
  }
}


  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-loading">
          Загрузка корзины...
        </div>
      </main>
    );
  }


  if (error && !cart) {
    return (
      <main className="cart-page">
        <div className="cart-error">
          {error}
        </div>
      </main>
    );
  }


  /*
   * Если заказ только что был создан,
   * показываем результат оформления.
   */
  if (checkoutSuccess) {
    return (
      <main className="cart-page">

        <div className="checkout-success">

          <div className="checkout-success-icon">
            ✓
          </div>

          <h1>
            Заказ оформлен
          </h1>

          <p>
            Заказ №{checkoutSuccess.id} успешно создан.
          </p>

          <p>
            Сумма заказа:{" "}
            <strong>
              {formatPrice(
                checkoutSuccess.total_amount
              )} ₽
            </strong>
          </p>

        </div>

      </main>
    );
  }


  if (!cart || cart.items.length === 0) {
    return (
      <main className="cart-page">

        <h1>
          Корзина
        </h1>

        <div className="cart-empty">

          <div className="cart-empty-icon">
            🛒
          </div>

          <h2>
            Корзина пуста
          </h2>

          <p>
            Добавьте товары из каталога
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="cart-page">

      <div className="cart-header">

        <h1>
          Корзина
        </h1>

        <button
          className="cart-clear-button"
          onClick={handleClearCart}
        >
          Очистить корзину
        </button>

      </div>


      {error && (
        <div className="cart-error">
          {error}
        </div>
      )}


      <div className="cart-layout">

        <section className="cart-items">

          {cart.items.map((item) => {

            const product = item.product;

            return (
              <article
                className="cart-item"
                key={item.id}
              >

                <div className="cart-item-image">

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="cart-item-no-image">
                      Нет изображения
                    </div>
                  )}

                </div>


                <div className="cart-item-info">

                  <h2>
                    {product.name}
                  </h2>

                  <div className="cart-item-price">
                    {formatPrice(product.price)} ₽
                  </div>

                </div>


                <div className="cart-item-actions">

                  <div className="quantity-control">

                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity === 1) {
                          handleRemove(product.id);
                        } else {
                          handleQuantityChange(
                            product.id,
                            item.quantity - 1
                          );
                        }
                      }}
                    >
                      −
                    </button>


                    <span>
                      {item.quantity}
                    </span>


                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          product.id,
                          item.quantity + 1
                        )
                      }
                      disabled={
                        item.quantity >=
                        product.stock
                      }
                    >
                      +
                    </button>

                  </div>


                  <div className="cart-item-total">

                    {formatPrice(
                      Number(product.price) *
                        item.quantity
                    )}{" "}
                    ₽

                  </div>


                  <button
                    type="button"
                    className="cart-remove-button"
                    onClick={() =>
                      handleRemove(product.id)
                    }
                    aria-label="Удалить товар"
                  >
                    <svg
                      className="trash-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      {/* Крышка */}
                      <g className="trash-lid">
                        <path d="M4 7h16" />
                        <path d="M9 7V4.5h6V7" />
                      </g>

                      {/* Корпус */}
                      <path
                        className="trash-body"
                        d="M6 7.5l1 12h10l1-12"
                      />

                      {/* Внутренние линии */}
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />

                    </svg>
                  </button>

                </div>

              </article>
            );
          })}

        </section>


        <aside className="cart-summary">

          <h2>
            Итого
          </h2>


          <div className="cart-summary-row">

            <span>
              Товаров
            </span>

            <span>
              {cart.total_quantity}
            </span>

          </div>


          <div className="cart-summary-total">

            <span>
              К оплате
            </span>

            <strong>
              {formatPrice(
                cart.total_price
              )} ₽
            </strong>

          </div>


          <button
            type="button"
            className="checkout-button"
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading
              ? "Оформление..."
              : "Оформить заказ"}
          </button>

        </aside>

      </div>

    </main>
  );
}