import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { addToCart } from "../api/cart";

const API_URL = "/api";

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const {
    accessToken,
    isAuthenticated,
    role,
    userId,
  } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddingToCart, setIsAddingToCart] =
    useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const [grade, setGrade] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] =
    useState(false);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      setError("");

      try {
        const [productResponse, reviewsResponse] =
          await Promise.all([
            fetch(`${API_URL}/products/${productId}`),
            fetch(
              `${API_URL}/products/${productId}/reviews/`
            ),
          ]);

        const productData = await productResponse.json();
        const reviewsData = await reviewsResponse.json();

        if (!productResponse.ok) {
          setError(
            productData.detail ||
              "Не удалось загрузить товар"
          );
          return;
        }

        if (!reviewsResponse.ok) {
          setError("Не удалось загрузить отзывы");
          return;
        }

        setProduct(productData);
        setReviews(reviewsData);
      } catch (error) {
        console.error(error);
        setError(
          "Не удалось подключиться к серверу"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  async function handleAddToCart() {
    if (!isAuthenticated) {
      window.dispatchEvent(
        new CustomEvent("open-login")
      );

      return;
    }

    if (product.stock <= 0) {
      return;
    }

    setIsAddingToCart(true);
    setCartMessage("");

    try {
      await addToCart(product.id);

      setCartMessage(
        "Товар добавлен в корзину"
      );
    } catch (error) {
      console.error(error);
      setCartMessage(error.message);
    } finally {
      setIsAddingToCart(false);
    }
  }

  async function handleSubmitReview(event) {
    event.preventDefault();

    setReviewError("");
    setIsSubmittingReview(true);

    try {
      const response = await fetch(
        `${API_URL}/reviews/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            product_id: Number(productId),
            grade: Number(grade),
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          setReviewError(
            data.detail
              .map(
                (item) =>
                  item.msg || "Ошибка валидации"
              )
              .join(", ")
          );
        } else {
          setReviewError(
            data.detail ||
              "Не удалось добавить отзыв"
          );
        }

        return;
      }

      setReviews((currentReviews) => [
        data,
        ...currentReviews,
      ]);

      setProduct((currentProduct) => ({
        ...currentProduct,
        rating: calculateRating([
          data,
          ...reviews,
        ]),
      }));

      setGrade(5);
      setComment("");
    } catch (error) {
      console.error(error);
      setReviewError(
        "Не удалось подключиться к серверу"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleDeleteReview(review) {
    const confirmed = window.confirm(
      "Удалить этот отзыв?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/reviews/${review.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Не удалось удалить отзыв"
        );
        return;
      }

      const updatedReviews = reviews.filter(
        (item) => item.id !== review.id
      );

      setReviews(updatedReviews);

      setProduct((currentProduct) => ({
        ...currentProduct,
        rating: calculateRating(updatedReviews),
      }));
    } catch (error) {
      console.error(error);
      alert(
        "Не удалось подключиться к серверу"
      );
    }
  }

  function calculateRating(items) {
    if (items.length === 0) {
      return "0.00";
    }

    const total = items.reduce(
      (sum, item) => sum + item.grade,
      0
    );

    return (total / items.length).toFixed(2);
  }

  if (isLoading) {
    return (
      <main className="container">
        <p className="empty-message">
          Загрузка товара...
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="container">
        <p className="empty-message error-message">
          {error || "Товар не найден"}
        </p>
      </main>
    );
  }

  return (
    <main className="container product-page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Назад
      </button>

      <section className="product-details">
        <div className="product-details-image">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
            />
          ) : (
            <span>Нет изображения</span>
          )}
        </div>

        <div className="product-details-info">
          <h1>{product.name}</h1>

          <div className="product-details-rating">
            ★ {product.rating}

            <span>
              {reviews.length === 1
                ? "1 отзыв"
                : `${reviews.length} отзывов`}
            </span>
          </div>

          <div className="product-details-price">
            {formatPrice(product.price)} ₽
          </div>

          <div className="product-details-stock">
            {product.stock > 0 ? (
              <>
                В наличии:{" "}
                <strong>{product.stock}</strong> шт.
              </>
            ) : (
              <span className="out-of-stock">
                Нет в наличии
              </span>
            )}
          </div>

          <button
            type="button"
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={
              product.stock <= 0 ||
              isAddingToCart
            }
          >
            {isAddingToCart
              ? "Добавление..."
              : "В корзину"}
          </button>

          {cartMessage && (
            <p className="cart-message">
              {cartMessage}
            </p>
          )}

          <div className="product-details-description">
            <h2>Описание</h2>

            <p>
              {product.description ||
                "Описание товара отсутствует."}
            </p>
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="reviews-header">
          <h2>Отзывы</h2>

          <span>
            {reviews.length === 0
              ? "Пока нет отзывов"
              : `${reviews.length} отзыв${
                  reviews.length === 1
                    ? ""
                    : reviews.length < 5
                    ? "а"
                    : "ов"
                }`}
          </span>
        </div>

        {isAuthenticated && role === "buyer" && (
          <form
            className="review-form"
            onSubmit={handleSubmitReview}
          >
            <h3>Оставить отзыв</h3>

            <label>
              Оценка

              <select
                value={grade}
                onChange={(event) =>
                  setGrade(event.target.value)
                }
              >
                <option value="5">
                  ★★★★★ — 5
                </option>

                <option value="4">
                  ★★★★☆ — 4
                </option>

                <option value="3">
                  ★★★☆☆ — 3
                </option>

                <option value="2">
                  ★★☆☆☆ — 2
                </option>

                <option value="1">
                  ★☆☆☆☆ — 1
                </option>
              </select>
            </label>

            <label>
              Комментарий

              <textarea
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value);
                  setReviewError("");
                }}
                placeholder="Расскажите о товаре"
                rows="4"
              />
            </label>

            {reviewError && (
              <p className="login-error">
                {reviewError}
              </p>
            )}

            <button
              type="submit"
              className="login-button review-submit"
              disabled={isSubmittingReview}
            >
              {isSubmittingReview
                ? "Отправка..."
                : "Оставить отзыв"}
            </button>
          </form>
        )}

        {!isAuthenticated && (
          <p className="reviews-login-message">
            Войдите в аккаунт, чтобы оставить отзыв.
          </p>
        )}

        {isAuthenticated && role !== "buyer" && (
          <p className="reviews-login-message">
            Отзывы могут оставлять только покупатели.
          </p>
        )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="empty-reviews">
              <p>
                У этого товара пока нет отзывов.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                className="review-card"
                key={review.id}
              >
                <div className="review-top">
                  <div className="review-author">
                    Пользователь #{review.username}
                  </div>

                  <div className="review-date">
                    {formatDate(review.comment_date)}
                  </div>
                </div>

                <div className="review-rating">
                  {"★".repeat(review.grade)}
                  {"☆".repeat(5 - review.grade)}
                </div>

                {review.comment && (
                  <p className="review-comment">
                    {review.comment}
                  </p>
                )}

                {isAuthenticated &&
                  (Number(userId) ===
                    review.user_id ||
                    role === "admin") && (
                    <button
                      type="button"
                      className="review-delete-button"
                      onClick={() =>
                        handleDeleteReview(review)
                      }
                    >
                      Удалить отзыв
                    </button>
                  )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductPage;