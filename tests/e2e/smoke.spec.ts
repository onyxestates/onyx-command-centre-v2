import { expect, test } from "@playwright/test";

const demoEmail = process.env.E2E_DEMO_EMAIL;
const demoPassword = process.env.E2E_DEMO_PASSWORD;
const hasAuthenticatedSmoke = Boolean(demoEmail && demoPassword);

test("login route renders", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("forgot-password route renders", async ({ page }) => {
  await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
});

test("signup route renders", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
});

test("mobile login experience remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("authenticated demo user can reach dashboard shell", async ({ page }) => {
  test.skip(!hasAuthenticatedSmoke, "optional authenticated smoke test requires E2E demo credentials");

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Email").fill(demoEmail ?? "");
  await page.getByPlaceholder("Password").fill(demoPassword ?? "");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Operations dashboard")).toBeVisible();
});
