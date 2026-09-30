import { useState } from "react";

const API_URL = "/api";

function AddProductModal({
  categoryId,
  accessToken,
  onClose,
  onProductCreated,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
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
    formData.append("category_id", categoryId);

    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await fetch(`${API_URL}/products/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          setError(
            data.detail
              .map((item) => item.msg || "Ошибка валидации")
              .join(", ")
          );
        } else {
          setError(data.detail || "Не удалось создать товар");
        }

        return;
      }

      onProductCreated(data);
      onClose();

    } catch (error) {
      console.error(error);
      setError("Не удалось подключиться к серверу");
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

        <h2>Добавление товара</h2>

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
              placeholder="Название товара"
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
              placeholder="Описание товара"
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
              placeholder="Например, 249"
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
              placeholder="Например, 10"
              required
            />
          </label>

          <label>
            Изображение

            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setImage(event.target.files[0] || null);
                setError("");
              }}
            />
          </label>

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
            {loading ? "Добавление..." : "Добавить товар"}
          </button>

        </form>

      </section>
    </div>
  );
}

export default AddProductModal;