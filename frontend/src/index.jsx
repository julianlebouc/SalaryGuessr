import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './pages/App';

// Entry point for the React frontend application.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
