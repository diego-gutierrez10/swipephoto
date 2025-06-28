import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button, ButtonProps } from '../Button';
import { ThemeProvider } from '../../layout/ThemeProvider';

describe('Button', () => {
  // Helper function to render with ThemeProvider
  const renderButton = (props: Partial<ButtonProps> = {}) => {
    const defaultProps: ButtonProps = {
      title: 'Test Button',
      onPress: jest.fn(),
      ...props,
    };
    return render(
      <ThemeProvider>
        <Button {...defaultProps} />
      </ThemeProvider>
    );
  };

  it('renders with the correct title', () => {
    const title = 'Click Me!';
    renderButton({ title });
    expect(screen.getByText(title)).toBeTruthy();
  });

  it('calls onPress handler when pressed', () => {
    const onPressMock = jest.fn();
    renderButton({ onPress: onPressMock });

    const button = screen.getByText('Test Button');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress handler when disabled', () => {
    const onPressMock = jest.fn();
    renderButton({ onPress: onPressMock, disabled: true });

    const button = screen.getByText('Test Button');
    fireEvent.press(button);

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows an ActivityIndicator when loading', () => {
    renderButton({ loading: true });

    // The title should not be visible
    expect(screen.queryByText('Test Button')).toBeFalsy();
    
    // The ActivityIndicator should be present
    expect(screen.getByTestId('button-loading-indicator')).toBeTruthy();
  });

  it('does not call onPress handler when loading', () => {
    const onPressMock = jest.fn();
    renderButton({ onPress: onPressMock, loading: true });

    // Target the button by its testID
    const buttonContainer = screen.getByTestId('button');
    fireEvent.press(buttonContainer);

    expect(onPressMock).not.toHaveBeenCalled();
  });
}); 