import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [isLoadingPublicSettings, setIsLoadingPublicSettings] =
    useState(false);

  const [authError, setAuthError] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);

  const [appPublicSettings, setAppPublicSettings] =
    useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const token =
        localStorage.getItem("fuelalert_token");

      const storedUser =
        localStorage.getItem("fuelalert_user");

      if (!token || !storedUser) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error(error);

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = () => {
    localStorage.removeItem("fuelalert_token");

    localStorage.removeItem("fuelalert_user");

    setUser(null);

    setIsAuthenticated(false);

    window.location.href = "/login";
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};