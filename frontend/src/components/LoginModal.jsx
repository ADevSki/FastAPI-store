import { useState } from "react";

import { registerUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";


function LoginModal({ onClose }) {
  const { login } = useAuth();

  const [isRegister, setIsRegister] =
    useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] =
    useState("");

  const [loginValue, setLoginValue] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [passwordRepeat, setPasswordRepeat] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (
      isRegister &&
      password !== passwordRepeat
    ) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await registerUser(
          email,
          username,
          password
        );

        await login(username, password);

        onClose();

        return;
      }

      await login(
        loginValue,
        password
      );

      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }


  function handleOverlayClick(event) {
    if (
      event.target === event.currentTarget
    ) {
      onClose();
    }
  }


  function switchMode() {
    setIsRegister(
      (current) => !current
    );

    setError("");
    setPassword("");
    setPasswordRepeat("");
  }


  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <section className="login-modal">

        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2>
          {isRegister
            ? "Создание аккаунта"
            : "Авторизация"}
        </h2>


        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {isRegister && (
            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );
                  setError("");
                }}
                placeholder="example@mail.ru"
                required
              />
            </label>
          )}


          {isRegister ? (
            <label>
              Логин

              <input
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(
                    event.target.value
                  );
                  setError("");
                }}
                placeholder="Введите логин"
                minLength={6}
                maxLength={32}
                required
              />

              <span className="field-hint">
                От 6 до 32 символов
              </span>
            </label>
          ) : (
            <label>
              Логин или Email

              <input
                type="text"
                value={loginValue}
                onChange={(event) => {
                  setLoginValue(
                    event.target.value
                  );
                  setError("");
                }}
                placeholder="Логин или email"
                required
              />
            </label>
          )}


          <div className="password-label">

            <div className="password-label-text">
              <span>Пароль</span>

              {isRegister && (
                <span className="password-help-wrapper">
                  <button
                    type="button"
                    className="password-help"
                    aria-label="Требования к паролю"
                  >
                    ?
                  </button>

                  <span className="password-tooltip">
                    Пароль должен содержать
                    минимум 8 символов.
                  </span>
                </span>
              )}
            </div>

            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );
                setError("");
              }}
              required
            />
          </div>


          {isRegister && (
            <label>
              Повторите пароль

              <input
                type="password"
                value={passwordRepeat}
                onChange={(event) => {
                  setPasswordRepeat(
                    event.target.value
                  );
                  setError("");
                }}
                required
              />
            </label>
          )}


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
              ? (
                isRegister
                  ? "Создание..."
                  : "Вход..."
              )
              : (
                isRegister
                  ? "Создать аккаунт"
                  : "Войти"
              )}
          </button>


          <button
            type="button"
            className="register-link"
            onClick={switchMode}
          >
            {isRegister
              ? "Уже есть аккаунт?"
              : "Создать аккаунт?"}
          </button>

        </form>
      </section>
    </div>
  );
}


export default LoginModal;