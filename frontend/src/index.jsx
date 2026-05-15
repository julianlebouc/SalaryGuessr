import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/retro-theme.css';
import App from './pages/App';

/**
 * Entry point for the SalaryGuessr React frontend application.
 * Initializes the React root and renders the main App component.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
