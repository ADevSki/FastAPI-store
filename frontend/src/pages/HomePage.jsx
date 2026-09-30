import { useEffect, useState } from "react";

import { getCategories } from "../api/categories";
import CategoryList from "../components/CategoryList";

import { useAuth } from "../context/AuthContext";

import { apiFetch } from "../api/apiFetch";


function HomePage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryParentId, setCategoryParentId] = useState("");

  const [categoryError, setCategoryError] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [categoryImage, setCategoryImage] = useState(null);

  const { isAdmin } = useAuth();

  function loadCategories() {
    getCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error(error);
        setError("Не удалось загрузить категории");
      });
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openCategoryModal() {
    setCategoryName("");
    setCategorySlug("");
    setCategoryParentId("");
    setCategoryImage(null);
    setCategoryError("");

    setCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    if (categoryLoading) {
      return;
    }

    setCategoryModalOpen(false);
  }

  async function handleCreateCategory(event) {
    event.preventDefault();

    setCategoryError("");
    setCategoryLoading(true);

    try {
      const formData = new FormData();

      formData.append("name", categoryName);
      formData.append("slug", categorySlug);

      if (categoryParentId) {
        formData.append("parent_id", categoryParentId);
      }

      if (categoryImage) {
        formData.append("image", categoryImage);
      }

      const response = await apiFetch("/categories/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.detail || "Не удалось создать категорию"
        );
      }

      setCategoryModalOpen(false);

      setCategoryName("");
      setCategorySlug("");
      setCategoryParentId("");
      setCategoryImage(null);

      loadCategories();

    } catch (error) {
      console.error(error);

      setCategoryError(error.message);

    } finally {
      setCategoryLoading(false);
    }
  }

  async function handleDeleteCategory(category) {
    const confirmed = window.confirm(
      `Удалить категорию «${category.name}»?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(
        `/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.detail || "Не удалось удалить категорию"
        );
      }

      setCategories((currentCategories) =>
        currentCategories.filter(
          (item) => item.id !== category.id
        )
      );

    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  }


  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      closeCategoryModal();
    }
  }

  return (
    <main className="container">

      {error ? (
        <p className="empty-message error-message">
          {error}
        </p>
      ) : (
        <>
          <div className="categories-header">

            <h2>Категории</h2>

            {isAdmin && (
              <button
                className="add-category-button"
                onClick={openCategoryModal}
              >
                + Добавить категорию
              </button>
            )}

          </div>

          <CategoryList
            categories={categories}
            isAdmin={isAdmin}
            onDelete={handleDeleteCategory}
          />
        </>
      )}

      {categoryModalOpen && (
        <div
          className="modal-overlay"
          onClick={handleOverlayClick}
        >
          <section className="login-modal category-modal">

            <button
              className="modal-close"
              onClick={closeCategoryModal}
              aria-label="Закрыть"
            >
              ×
            </button>

            <h2>Добавить категорию</h2>

            <form
              className="login-form"
              onSubmit={handleCreateCategory}
            >

              <label>
                Название

                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => {
                    setCategoryName(event.target.value);
                    setCategoryError("");
                  }}
                  placeholder="Например, Электроника"
                  required
                />
              </label>

              <label>
                Slug

                <input
                  type="text"
                  value={categorySlug}
                  onChange={(event) => {
                    setCategorySlug(event.target.value);
                    setCategoryError("");
                  }}
                  placeholder="electronics"
                  required
                />
              </label>

              <label>
                Родительская категория

                <select
                  value={categoryParentId}
                  onChange={(event) => {
                    setCategoryParentId(event.target.value);
                    setCategoryError("");
                  }}
                >
                  <option value="">
                    Без родительской категории
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Изображение

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setCategoryImage(
                      event.target.files[0] || null
                    );

                    setCategoryError("");
                  }}
                />
              </label>

              {categoryError && (
                <p className="login-error">
                  {categoryError}
                </p>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={categoryLoading}
              >
                {categoryLoading
                  ? "Создание..."
                  : "Создать категорию"}
              </button>

            </form>

          </section>
        </div>
      )}

    </main>
  );
}

export default HomePage;