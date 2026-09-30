import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import LoginModal from "./components/LoginModal";
import OrdersPage from "./pages/OrdersPage";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import { getCart } from "./api/cart";
import { getOrders } from "./api/orders";

import "./App.css";


function Header({
  onLoginClick,
  darkMode,
  setDarkMode,
}) {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    username,
    logout,
  } = useAuth();

  const [cartQuantity, setCartQuantity] = useState(0);
  const [ordersQuantity, setOrdersQuantity] = useState(0);


  useEffect(() => {
  if (!isAuthenticated) {
    setCartQuantity(0);
    setOrdersQuantity(0);
    return;
  }

  async function loadHeaderData() {
    try {
      const [cart, orders] = await Promise.all([
        getCart(),
        getOrders(1, 1),
      ]);

      setCartQuantity(cart.total_quantity);
      setOrdersQuantity(orders.total);
    } catch (error) {
      console.error("Не удалось загрузить данные шапки:", error);
      setCartQuantity(0);
      setOrdersQuantity(0);
    }
  }

  loadHeaderData();
}, [isAuthenticated]);


  useEffect(() => {
  function handleCartUpdated(event) {
    if (typeof event.detail === "number") {
      setCartQuantity(event.detail);
    } else {
      getCart()
        .then((cart) => {
          setCartQuantity(cart.total_quantity);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  function handleOrdersUpdated() {
    setOrdersQuantity((currentQuantity) => currentQuantity + 1);
  }

  window.addEventListener("cart-updated", handleCartUpdated);
  window.addEventListener("orders-updated", handleOrdersUpdated);

  return () => {
    window.removeEventListener("cart-updated", handleCartUpdated);
    window.removeEventListener("orders-updated", handleOrdersUpdated);
  };
}, []);


  function handleLogoClick() {
    navigate("/");
  }


  function handleCartClick() {
    navigate("/cart/");
  }


  function handleOrdersClick() {
    navigate("/orders/");
  }


  return (
    <header className="header">
      <div className="container header-content">

        <button
          className="logo-button"
          onClick={handleLogoClick}
          aria-label="Перейти на главную страницу"
        >
          <img
            src="/logo.png"
            alt="Fast Store"
          />
        </button>


        <div className="search">

          <input
            type="text"
            placeholder="Поиск товаров..."
          />

          <button
            className="search-button"
            aria-label="Поиск"
          >
            <span>⌕</span>
          </button>

        </div>

        <div className="theme-switcher">
  <button
    type="button"
    className={`theme-toggle ${
      darkMode ? "dark" : ""
    }`}
    onClick={() => setDarkMode((value) => !value)}
    aria-label={
      darkMode
        ? "Включить светлую тему"
        : "Включить тёмную тему"
    }
  >
    <span className="theme-toggle-track">
      <span className="theme-toggle-thumb">
        {darkMode ? "☾" : "☀"}
      </span>
    </span>
  </button>
</div>

        <div className="header-auth">

          {!isAuthenticated ? (
            <button
              className="profile-button"
              onClick={onLoginClick}
              aria-label="Авторизация"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                />

                <path
                  d="M5 21c0-4 3-6 7-6s7 2 7 6"
                />
              </svg>
            </button>
          ) : (
            <div className="user-menu">

              <button
                type="button"
                className="user-name-button"
              >
                <span className="user-email">
                  {username}
                </span>

                <svg
                  className="user-menu-arrow"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>


              <div className="user-dropdown">

                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={() => {
                    // Профиль пока без функционала
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="3.5"
                    />

                    <path
                      d="M5 21c0-4 3-6 7-6s7 2 7 6"
                    />
                  </svg>

                  <span>
                    Профиль
                  </span>
                </button>


                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={handleCartClick}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"
                    />

                    <circle
                      cx="9"
                      cy="20"
                      r="1"
                    />

                    <circle
                      cx="18"
                      cy="20"
                      r="1"
                    />
                  </svg>

                  <span>
                    Корзина
                  </span>

                  {cartQuantity > 0 && (
                    <span className="dropdown-cart-quantity">
                      {cartQuantity}
                    </span>
                  )}
                </button>


                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={handleOrdersClick}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 3h12v18H6z"
                    />

                    <path d="M9 7h6" />
                    <path d="M9 11h6" />
                    <path d="M9 15h4" />
                  </svg>

                  <span>
                    Мои заказы
                  </span>

                  {ordersQuantity > 0 && (
                      <span className="dropdown-orders-quantity">
                          {ordersQuantity}
                      </span>
                  )}
                </button>


                <div className="user-dropdown-divider" />


                <button
                  type="button"
                  className="user-dropdown-item logout-dropdown-item"
                  onClick={logout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"
                    />

                    <path d="M14 8l4 4-4 4" />

                    <path d="M18 12H9" />
                  </svg>

                  <span>
                    Выход
                  </span>
                </button>

              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}


function App() {
  const [loginOpen, setLoginOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", darkMode);

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    function handleOpenLogin() {
      setLoginOpen(true);
    }

    window.addEventListener("open-login", handleOpenLogin);

    return () => {
      window.removeEventListener("open-login", handleOpenLogin);
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Header
            onLoginClick={() => setLoginOpen(true)}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:slug/" element={<CategoryPage />} />
            <Route path="/product/:productId/" element={<ProductPage />} />
            <Route path="/cart/" element={<CartPage />} />
            <Route path="/orders/" element={<OrdersPage />} />
          </Routes>

          {loginOpen && (
            <LoginModal onClose={() => setLoginOpen(false)} />
          )}
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;