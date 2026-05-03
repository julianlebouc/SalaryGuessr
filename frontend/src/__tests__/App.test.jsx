import { render } from '@testing-library/react';
import App from '../pages/App';
import { test, expect } from 'vitest';

test('renders app without crashing', () => {
  render(<App />);
});
