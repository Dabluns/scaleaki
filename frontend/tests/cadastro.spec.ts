import { test, expect } from '@playwright/test';

function randomEmail() {
  return `testuser_${Date.now()}@example.com`;
}

test.describe('Fluxo de cadastro, confirmação e login', () => {
  test('Simula jornada básica do usuário', async ({ page }) => {
    const email = randomEmail();
    const password = 'SenhaForte!123';
    const name = 'Usuário Teste';

    await page.goto('/auth/register');
    await page.fill('input#name', name);
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);
    await page.click('button[type=submit]');

    await expect(page).toHaveURL(/\/auth\/check-email/);
    await expect(page.locator('text=Verifique seu e-mail')).toBeVisible();
    await expect(page.locator(`text=${email}`)).toBeVisible();

    await page.goto('/auth/confirm?token=token-fake');
    await expect(page.locator('text=Confirmação de e-mail')).toBeVisible();
    await expect(page.locator('text=Token inválido')).toBeVisible();

    await page.click('a[href="/auth"]');
    await expect(page).toHaveURL(/\/auth$/);
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type=submit]');
    await expect(page.locator('text=e-mail não confirmado')).toBeVisible();
  });
});