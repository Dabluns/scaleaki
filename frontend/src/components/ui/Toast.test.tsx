import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';
import React from 'react';

function TestComponent() {
  const toast = useToast();
  return <button onClick={() => toast.showToast('Mensagem de teste', 1000)}>Mostrar Toast</button>;
}

describe('ToastProvider', () => {
  it('exibe e esconde o toast corretamente', async () => {
    jest.useFakeTimers();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    expect(screen.queryByText('Mensagem de teste')).toBeNull();
    act(() => {
      screen.getByText('Mostrar Toast').click();
    });
    expect(screen.getByText('Mensagem de teste')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Mensagem de teste')).toBeNull();
    jest.useRealTimers();
  });
}); 