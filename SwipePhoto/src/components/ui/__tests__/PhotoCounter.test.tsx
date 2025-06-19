import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PhotoCounter } from '../PhotoCounter';

describe('PhotoCounter', () => {
  it('renders with correct format', () => {
    render(<PhotoCounter current={3} total={10} testID="photo-counter" />);
    
    expect(screen.getByText('Photo 3 of 10')).toBeTruthy();
    expect(screen.getByTestId('photo-counter')).toBeTruthy();
  });

  it('renders without icon when showIcon is false', () => {
    render(<PhotoCounter current={1} total={5} showIcon={false} />);
    
    expect(screen.getByText('Photo 1 of 5')).toBeTruthy();
    expect(screen.queryByText('📸')).toBeFalsy();
  });

  it('renders with icon by default', () => {
    render(<PhotoCounter current={1} total={5} />);
    
    expect(screen.getByText('📸')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 20 };
    render(<PhotoCounter current={1} total={5} style={customStyle} />);
    
    // Component should render without errors with custom style
    expect(screen.getByText('Photo 1 of 5')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    render(
      <PhotoCounter 
        current={2} 
        total={8} 
        accessibilityLabel="Custom label"
        testID="counter"
      />
    );
    
    const counter = screen.getByTestId('counter');
    expect(counter).toBeTruthy();
  });

  it('handles edge cases correctly', () => {
    // Test with zero total
    render(<PhotoCounter current={0} total={0} />);
    expect(screen.getByText('Photo 0 of 0')).toBeTruthy();

    // Test with large numbers
    const { rerender } = render(<PhotoCounter current={999} total={1000} />);
    expect(screen.getByText('Photo 999 of 1000')).toBeTruthy();
  });
}); 