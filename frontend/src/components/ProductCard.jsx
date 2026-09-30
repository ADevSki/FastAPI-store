import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { addToCart } from "../api/cart";


function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(price);
}


function ProductCard({
  product,
  userId,
  onDelete,
  onEdit,
}) {
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState("");


  const isOwner =
    userId !== null &&
    product.seller_id === userId;


  function handleCardClick() {
    navigate(`/product/${product.id}/`);
  }


  function handleDelete(event) {
    event.stopPropagation();
    onDelete(product);
  }


  function handleEdit(event) {
    event.stopPropagation();
    onEdit(product);
  }


  async function handleAddToCart(event) {
    event.stopPropagation();

    setCartMessage("");

    if (!isAuthenticated) {
      window.dispatchEvent(
        new CustomEvent("open-login")
      );

      return;
    }

    if (product.stock <= 0) {
      return;
    }

    try {
      setCartLoading(true);

      await addToCart(product.id, 1);

      setCartMessage("Добавлено в корзину");

      setTimeout(() => {
        setCartMessage("");
      }, 2000);

      window.dispatchEvent(
        new Event("cart-updated")
      );

    } catch (error) {
      console.error(error);

      setCartMessage(error.message);

      setTimeout(() => {
        setCartMessage("");
      }, 3000);

    } finally {
      setCartLoading(false);
    }
  }


  return (
    <article
      className="product-card"
      onClick={handleCardClick}
    >

      <div className="product-image">

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
          />
        ) : (
          <span>Нет изображения</span>
        )}


        {isOwner && (
          <div className="product-actions">

            <button
              type="button"
              className="product-action edit"
              onClick={handleEdit}
              aria-label="Редактировать товар"
            >
              ✎
            </button>


            <button
              type="button"
              className="product-action delete"
              onClick={handleDelete}
              aria-label="Удалить товар"
            >
              ×
            </button>

          </div>
        )}

      </div>


      <div className="product-info">

        <h3>{product.name}</h3>


        <p className="product-description">
          {product.description}
        </p>


        <div className="product-price">
          {formatPrice(product.price)} ₽
        </div>


        <div className="product-bottom">

          <span>
            {product.stock > 0
              ? `В наличии: ${product.stock}`
              : "Нет в наличии"}
          </span>


          <span>
            ★ {product.rating}
          </span>

        </div>


        <button
          type="button"
          className="add-to-cart-button"
          onClick={handleAddToCart}
          disabled={
            product.stock <= 0 ||
            cartLoading
          }
        >
          {cartLoading
            ? "Добавление..."
            : product.stock <= 0
              ? "Нет в наличии"
              : "В корзину"}
        </button>


        {cartMessage && (
          <div className="cart-message">
            {cartMessage}
          </div>
        )}

      </div>

    </article>
  );
}


export default ProductCard;