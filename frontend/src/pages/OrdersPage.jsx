import { useEffect, useState } from "react";

import { getOrders } from "../api/orders";

import "./OrdersPage.css";


function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(price));
}


function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}


function getStatusText(status) {
  switch (status) {
    case "pending":
      return "Ожидает оплаты";

    case "paid":
      return "Оплачен";

    case "canceled":
      return "Отменён";

    case "failed":
      return "Ошибка оплаты";

    default:
      return status;
  }
}


export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders();

      setOrders(data.items);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadOrders();
  }, []);


  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-loading">
          Загрузка заказов...
        </div>
      </main>
    );
  }


  if (error) {
    return (
      <main className="orders-page">
        <h1>Мои заказы</h1>

        <div className="orders-error">
          {error}
        </div>
      </main>
    );
  }


  return (
    <main className="orders-page">
      <h1>Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>

          <h2>Заказов пока нет</h2>

          <p>
            Здесь будут отображаться ваши заказы.
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article
              className="order-card"
              key={order.id}
            >
              <div className="order-header">
                <div>
                  <h2>
                    Заказ №{order.id}
                  </h2>

                  <span className="order-date">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                <span
                  className={`order-status order-status-${order.status}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>


              <div className="order-items">
                {order.items.map((item) => (
                  <div
                    className="order-item"
                    key={item.id}
                  >
                    <div className="order-item-image">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                        />
                      ) : (
                        <div className="order-item-no-image">
                          Нет изображения
                        </div>
                      )}
                    </div>

                    <div className="order-item-info">
                      <h3>
                        {item.product?.name ||
                          `Товар #${item.product_id}`}
                      </h3>

                      <span>
                        {item.quantity} ×{" "}
                        {formatPrice(item.unit_price)} ₽
                      </span>
                    </div>

                    <strong className="order-item-total">
                      {formatPrice(item.total_price)} ₽
                    </strong>
                  </div>
                ))}
              </div>


              <div className="order-footer">
                <span>Итого</span>

                <strong>
                  {formatPrice(order.total_amount)} ₽
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}