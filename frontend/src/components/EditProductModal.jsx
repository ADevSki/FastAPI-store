import { useState } from "react";

const API_URL = "/api";

function EditProductModal({
  product,
  accessToken,
  onClose,
  onProductUpdated,
}) {
  const [name, setName] = useState(product.name || "");
  const [description, setDescription] = useState(
    product.description || ""
  );
  const [price, setPrice] = useState(product.price || "");
  const [stock, setStock] = useState(product.stock ?? "");
  const [image, setImage] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("category_id", product.category_id);

    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await fetch(
        `${API_URL}/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          setError(
            data.detail
              .map(
                (item) =>
                  item.msg || "Ошибка валидации"
              )
              .join(", ")
          );
        } else {
          setError(
            data.detail ||
              "Не удалось обновить товар"
          );
        }

        return;
      }

      onProductUpdated(data);
      onClose();

    } catch (error) {
      console.error(error);
      setError(
        "Не удалось подключиться к серверу"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <section className="login-modal product-modal">

        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2>Редактирование товара</h2>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <label>
            Название

            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              required
            />
          </label>

          <label>
            Описание

            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError("");
              }}
              rows="4"
              required
            />
          </label>

          <label>
            Цена

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setError("");
              }}
              required
            />
          </label>

          <label>
            Количество

            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => {
                setStock(event.target.value);
                setError("");
              }}
              required
            />
          </label>

          <label>
            Новое изображение

            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setImage(
                  event.target.files[0] || null
                );
                setError("");
              }}
            />
          </label>

          <p className="product-edit-hint">
            Если изображение не выбрать, текущее
            изображение останется без изменений.
          </p>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Сохранение..."
              : "Сохранить изменения"}
          </button>

        </form>

      </section>
    </div>
  );
}

export default EditProductModal;