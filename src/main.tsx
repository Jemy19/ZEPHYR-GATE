import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the main application component
import App from './App';
// Import global styles, including Tailwind CSS configuration
import './index.css';

// Entry point for the React application
// Renders the App component into the root DOM element defined in index.html
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
