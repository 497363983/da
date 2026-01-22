import { render, screen } from '@testing-library/react';
import App from './App';

test('renders gun game UI', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /gun game/i })).toBeInTheDocument();
  expect(screen.getByText(/lives:/i)).toBeInTheDocument();
  expect(screen.getByText(/score:/i)).toBeInTheDocument();
  expect(screen.getAllByText(/shotgun/i).length).toBeGreaterThan(0);
});
