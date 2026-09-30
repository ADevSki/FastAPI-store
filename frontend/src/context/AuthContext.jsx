import { createContext, useContext, useEffect, useState } from "react";

import {
  loginUser,
  refreshAccessToken,
} from "../api/auth";


const AuthContext = createContext(null);


function getTokenPayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}


function getValidAccessToken() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return null;
  }

  const payload = getTokenPayload(token);

  if (!payload?.exp) {
    return null;
  }

  const currentTime = Math.floor(
    Date.now() / 1000
  );

  if (payload.exp <= currentTime) {
    return null;
  }

  return token;
}


function getRoleFromToken(token) {
  const payload = getTokenPayload(token);

  return payload?.role || null;
}


function getEmailFromToken(token) {
  const payload = getTokenPayload(token);

  return payload?.email || null;
}


function getUsernameFromToken(token) {
  const payload = getTokenPayload(token);

  return (
    payload?.username ||
    payload?.sub ||
    null
  );
}


function getUserIdFromToken(token) {
  const payload = getTokenPayload(token);

  return payload?.id || null;
}


export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    getValidAccessToken
  );

  const [role, setRole] = useState(() => {
    const token = getValidAccessToken();

    return token
      ? getRoleFromToken(token)
      : null;
  });

  const [email, setEmail] = useState(() => {
    const token = getValidAccessToken();

    return token
      ? getEmailFromToken(token)
      : null;
  });

  const [username, setUsername] = useState(() => {
    const token = getValidAccessToken();

    return token
      ? getUsernameFromToken(token)
      : null;
  });

  const [userId, setUserId] = useState(() => {
    const token = getValidAccessToken();

    return token
      ? getUserIdFromToken(token)
      : null;
  });


  const isAuthenticated = Boolean(accessToken);

  const isAdmin = role === "admin";


  async function login(loginValue, password) {
    const data = await loginUser(
      loginValue,
      password
    );

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    localStorage.setItem(
      "refresh_token",
      data.refresh_token
    );

    setAccessToken(data.access_token);

    const payload = getTokenPayload(
      data.access_token
    );

    setRole(payload?.role || null);
    setEmail(payload?.email || null);

    setUsername(
      payload?.username ||
      payload?.sub ||
      null
    );

    setUserId(payload?.id || null);

    return data;
  }


  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setAccessToken(null);
    setRole(null);
    setEmail(null);
    setUsername(null);
    setUserId(null);
  }


  async function handleRefreshAccessToken() {
    const newAccessToken =
      await refreshAccessToken();

    if (!newAccessToken) {
      logout();
      return null;
    }

    setAccessToken(newAccessToken);

    const payload =
      getTokenPayload(newAccessToken);

    setRole(payload?.role || null);
    setEmail(payload?.email || null);

    setUsername(
      payload?.username ||
      payload?.sub ||
      null
    );

    setUserId(payload?.id || null);

    return newAccessToken;
  }


  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const payload =
      getTokenPayload(accessToken);

    if (!payload?.exp) {
      logout();
      return;
    }

    const currentTime =
      Math.floor(Date.now() / 1000);

    const millisecondsUntilRefresh =
      (
        payload.exp -
        currentTime -
        60
      ) * 1000;

    const timeout = setTimeout(
      () => {
        handleRefreshAccessToken();
      },
      Math.max(
        millisecondsUntilRefresh,
        0
      )
    );

    return () => clearTimeout(timeout);
  }, [accessToken]);


  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userId,
        username,
        email,
        role,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        refreshAccessToken:
          handleRefreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}