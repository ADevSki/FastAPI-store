import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import { getCategories } from "../api/categories";
import { getProducts } from "../api/products";

import { useAuth } from "../context/AuthContext";

import FilterPanel from "../components/FilterPanel";
import ProductCard from "../components/ProductCard";

import AddProductModal from "../components/AddProductModal";
import EditProductModal from "../components/EditProductModal";

const API_URL = "/api";

const PAGE_SIZE = 12;


function CategoryPage() {
  const { slug } = useParams();

  const {
    isAuthenticated,
    accessToken,
    userId,
  } = useAuth();


  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] =
    useState(1);


  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    inStock: null,
    sortByDate: false,
    search: "",
  });


  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState(null);


  const [
    isAddProductModalOpen,
    setIsAddProductModalOpen,
  ] = useState(false);


  const [editingProduct, setEditingProduct] =
    useState(null);


  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error(error);
        setError(
          "Не удалось загрузить категорию"
        );
      });
  }, []);


  const category = categories.find(
    (item) => item.slug === slug
  );


  async function loadProducts(
  categoryId,
  currentFilters = filters,
  page = currentPage
) {
  setIsLoading(true);
  setError(null);

  try {
    const data = await getProducts(
      {
        categoryId,
        ...currentFilters,
      },
      page,
      PAGE_SIZE
    );

    setProducts(data.items);
    setTotal(data.total);
    setCurrentPage(data.page);
  } catch (error) {
    console.error(error);

    setError("Не удалось загрузить товары");

    setProducts([]);
    setTotal(0);
  } finally {
    setIsLoading(false);
  }
}


  useEffect(() => {
    if (category) {
      setCurrentPage(1);

      loadProducts(
        category.id,
        filters,
        1
      );
    }
  }, [category]);


  function handleApplyFilters() {
    if (!category) {
      return;
    }

    setCurrentPage(1);

    loadProducts(
      category.id,
      filters,
      1
    );
  }


  function handleResetFilters() {
    const resetFilters = {
      minPrice: "",
      maxPrice: "",
      inStock: null,
      sortByDate: false,
      search: "",
    };

    setFilters(resetFilters);

    setCurrentPage(1);

    if (category) {
      loadProducts(
        category.id,
        resetFilters,
        1
      );
    }
  }


  function handlePageChange(page) {
    if (!category) {
      return;
    }

    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);

    loadProducts(
      category.id,
      filters,
      page
    );
  }


  function handleProductCreated(product) {
    /*
     * После создания товара лучше заново
     * загрузить текущую страницу.
     */
    if (category) {
      loadProducts(
        category.id,
        filters,
        currentPage
      );
    }
  }


  function handleEditProduct(product) {
    setEditingProduct(product);
  }


  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Удалить товар «${product.name}»?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/products/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          alert(
            data.detail
              .map(
                (item) =>
                  item.msg || "Ошибка"
              )
              .join(", ")
          );
        } else {
          alert(
            data.detail ||
              "Не удалось удалить товар"
          );
        }

        return;
      }

      /*
       * Если после удаления текущая страница
       * стала пустой, переходим на предыдущую.
       */
      const newTotal = Math.max(
        total - 1,
        0
      );

      const newTotalPages = Math.max(
        Math.ceil(
          newTotal / PAGE_SIZE
        ),
        1
      );

      const newPage = Math.min(
        currentPage,
        newTotalPages
      );

      setTotal(newTotal);

      setCurrentPage(newPage);

      loadProducts(
        category.id,
        filters,
        newPage
      );

    } catch (error) {
      console.error(error);

      alert(
        "Не удалось подключиться к серверу"
      );
    }
  }


  function handleProductUpdated(
    updatedProduct
  ) {
    setProducts(
      (currentProducts) =>
        currentProducts.map(
          (product) =>
            product.id ===
            updatedProduct.id
              ? updatedProduct
              : product
        )
    );

    setEditingProduct(null);
  }


  const totalPages = Math.ceil(
    total / PAGE_SIZE
  );


  if (!category && !error) {
    return (
      <main className="container">
        <p className="empty-message">
          Загрузка...
        </p>
      </main>
    );
  }


  if (!category && error) {
    return (
      <main className="container">
        <p className="empty-message error-message">
          Категория не найдена
        </p>
      </main>
    );
  }


  return (
    <main className="container">

      <div className="category-header">

        <h2>{category.name}</h2>

        {isAuthenticated && (
          <button
            type="button"
            className="add-product-button"
            onClick={() =>
              setIsAddProductModalOpen(true)
            }
          >
            + Добавить товар
          </button>
        )}

      </div>


      <div className="catalog-layout">

        <aside className="filters-sidebar">

          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

        </aside>


        <section className="products-section">

          <div className="products-header">

            <h2>Товары</h2>

            <span>
              Найдено: {total}
            </span>

          </div>


          {isLoading ? (

            <p className="empty-message">
              Загрузка товаров...
            </p>

          ) : error ? (

            <p className="empty-message error-message">
              {error}
            </p>

          ) : products.length > 0 ? (

            <div className="product-grid">

              {products.map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                  userId={userId}
                  onDelete={
                    handleDeleteProduct
                  }
                  onEdit={
                    handleEditProduct
                  }
                />

              ))}

            </div>

          ) : (

            <p className="empty-message">
              Товары не найдены
            </p>

          )}


          {totalPages > 1 && (
            <div className="pagination">

              <button
                type="button"
                className="pagination-button"
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                disabled={
                  currentPage === 1
                }
              >
                ←
              </button>


              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (

                <button
                  type="button"
                  key={page}
                  className={
                    page === currentPage
                      ? "pagination-button active"
                      : "pagination-button"
                  }
                  onClick={() =>
                    handlePageChange(page)
                  }
                >
                  {page}
                </button>

              ))}


              <button
                type="button"
                className="pagination-button"
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
                disabled={
                  currentPage ===
                  totalPages
                }
              >
                →
              </button>

            </div>
          )}

        </section>

      </div>


      {isAddProductModalOpen && (

        <AddProductModal
          categoryId={category.id}
          accessToken={accessToken}
          onClose={() =>
            setIsAddProductModalOpen(false)
          }
          onProductCreated={
            handleProductCreated
          }
        />

      )}


      {editingProduct && (

        <EditProductModal
          product={editingProduct}
          accessToken={accessToken}
          onClose={() =>
            setEditingProduct(null)
          }
          onProductUpdated={
            handleProductUpdated
          }
        />

      )}

    </main>
  );
}


export default CategoryPage;