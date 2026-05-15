
import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
