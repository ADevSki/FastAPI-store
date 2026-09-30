const API_URL = "/api";

function getErrorMessage(data, defaultMessage) {
  if (!data?.detail) {
    return defaultMessage;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((error) => {
        if (error.loc?.includes("password")) {
          if (error.type === "too_short") {
            return "Пароль должен содержать минимум 8 символов";
          }
        }

        if (error.loc?.includes("username")) {
          if (error.type === "string_too_short") {
            return "Логин должен содержать минимум 6 символов";
          }

          if (error.type === "string_too_long") {
            return "Логин должен содержать максимум 32 символа";
          }
        }

        return error.msg || "Ошибка валидации";
      })
      .join(", ");
  }

  return defaultMessage;
}


export async function loginUser(login, password) {
  const formData = new URLSearchParams();

  formData.append("username", login);
  formData.append("password", password);

  const response = await fetch(
    `${API_URL}/users/token`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Не удалось выполнить вход"
      )
    );
  }

  return data;
}


export async function registerUser(
  email,
  username,
  password
) {
  const response = await fetch(
    `${API_URL}/users/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Не удалось создать аккаунт"
      )
    );
  }

  return data;
}


export async function refreshAccessToken() {
  const refreshToken =
    localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/users/access-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  localStorage.setItem(
    "access_token",
    data.access_token
  );

  return data.access_token;
}