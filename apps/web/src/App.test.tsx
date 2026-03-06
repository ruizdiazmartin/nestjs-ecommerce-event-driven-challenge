import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders auth title', () => {
    render(<App />);
    expect(screen.getByText(/E-commerce Console/i)).toBeTruthy();
  });
});
