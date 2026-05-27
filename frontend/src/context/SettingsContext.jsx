import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * @module Context/SettingsContext
 */

const SettingsContext = createContext();

/**
 * Provider for global game settings including audio and salary display units.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function SettingsProvider({ children }) {
  // Volume State (0.0 to 1.0)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("sg_volume");
    return saved !== null ? parseFloat(saved) : 0.5;
  });

  // Salary Type: 'brut' (gross) or 'net'
  const [salaryType, setSalaryType] = useState(() => {
    return localStorage.getItem("sg_salary_type") || "brut";
  });

  // Salary Period: 'monthly' or 'annual'
  const [salaryPeriod, setSalaryPeriod] = useState(() => {
    return localStorage.getItem("sg_salary_period") || "monthly";
  });

  // Theme: 'classic', 'retro' or 'professional'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("sg_theme") || "classic";
  });

  // Language: 'fr' or 'en'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("sg_language") || "fr";
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("sg_volume", volume);
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("sg_salary_type", salaryType);
  }, [salaryType]);

  useEffect(() => {
    localStorage.setItem("sg_salary_period", salaryPeriod);
  }, [salaryPeriod]);

  useEffect(() => {
    localStorage.setItem("sg_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sg_language", language);
  }, [language]);

  // Ensure the theme class is applied on the document root so CSS variables
  // defined inside .theme-... selectors affect global elements (html, body).
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove('theme-classic', 'theme-retro', 'theme-professional');
      root.classList.add(`theme-${theme}`);
    } catch (e) {
      // Server-side render or test environment may not have document; ignore.
    }
  }, [theme]);

  /**
   * Converts a base salary (Brut Monthly) to the user's preferred unit for display.
   * 
   * @param {number} brutMonthly 
   * @returns {number}
   */
  const convertFromBase = (brutMonthly) => {
    if (!brutMonthly) return 0;
    let value = brutMonthly;
    
    // Net conversion (approx 23% less)
    if (salaryType === "net") {
      value = value * 0.77;
    }
    
    // Annual conversion
    if (salaryPeriod === "annual") {
      value = value * 12;
    }
    
    return Math.round(value);
  };

  /**
   * Converts a user's guess from their preferred unit back to the base unit (Brut Monthly) for validation.
   * 
   * @param {number} value 
   * @returns {number}
   */
  const convertToBase = (value) => {
    if (!value) return 0;
    let result = value;
    
    // Reverse Annual conversion
    if (salaryPeriod === "annual") {
      result = result / 12;
    }
    
    // Reverse Net conversion
    if (salaryType === "net") {
      result = result / 0.77;
    }
    
    return result;
  };

  /**
   * Returns the appropriate label for the current salary settings.
   * e.g., "Net Annuel"
   * 
   * @returns {string}
   */
  const getSalaryLabel = () => {
    const typeLabel = salaryType === "net" ? "Net" : "Brut";
    const periodLabel = salaryPeriod === "annual" ? "Annuel" : "Mensuel";
    return `${typeLabel} ${periodLabel}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        volume,
        setVolume,
        salaryType,
        setSalaryType,
        salaryPeriod,
        setSalaryPeriod,
        theme,
        setTheme,
        language,
        setLanguage,
        convertFromBase,
        convertToBase,
        getSalaryLabel
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use the settings context.
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
