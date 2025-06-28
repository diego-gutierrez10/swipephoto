import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PhotoCounter } from '../PhotoCounter';
import { ThemeProvider } from '../../layout/ThemeProvider'; // Assuming you have a ThemeProvider

describe('PhotoCounter', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  it('should render the current count and total correctly', () => {
    // Arrange: Render the component with props within a theme provider
    renderWithTheme(<PhotoCounter current={25} total={150} />);

    // Act & Assert: Find the element by the text it should display
    const counterText = screen.getByText('Photo 25 of 150');
    expect(counterText).toBeDefined();
  });

  it('should handle zero total gracefully', () => {
    // Arrange
    renderWithTheme(<PhotoCounter current={0} total={0} />);

    // Assert
    const counterText = screen.getByText('Photo 0 of 0');
    expect(counterText).toBeDefined();
  });

  it('should display correctly when count exceeds total (edge case)', () => {
    // Arrange
    renderWithTheme(<PhotoCounter current={110} total={100} />);

    // Assert
    const counterText = screen.getByText('Photo 110 of 100');
    expect(counterText).toBeDefined();
  });
}); 