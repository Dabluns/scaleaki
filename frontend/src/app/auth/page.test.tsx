import { render, screen, fireEvent, act } from '@testing-library/react';
import AuthPage from './page';
import { ToastProvider } from '@/components/ui/Toast';

jest.mock('@/lib/auth', () => ({
  login: jest.fn(async (email, password) => {
    if (email === 'ok@email.com' && password === '123') return { name: 'Usuário', email };
    throw new Error('Credenciais inválidas');
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AuthPage', () => {
  it('faz login com sucesso e dispara evento', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    render(
      <ToastProvider>
        <AuthPage />
      </ToastProvider>
    );
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ok@email.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: '123' } });
    await act(async () => {
      fireEvent.click(screen.getByText(/entrar/i));
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('exibe erro ao falhar login', async () => {
    render(
      <ToastProvider>
        <AuthPage />
      </ToastProvider>
    );
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'fail@email.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'err' } });
    await act(async () => {
      fireEvent.click(screen.getByText(/entrar/i));
    });
    expect(screen.getByText(/credenciais/i)).toBeInTheDocument();
  });
}); 