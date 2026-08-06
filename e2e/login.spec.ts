import { test, expect } from "@playwright/test";

const USERS = {
  parent: { email: "parent@anchor.dev", password: "AnchorParent1!", home: "/parent/today" },
  business: {
    email: "business@anchor.dev",
    password: "AnchorBusiness1!",
    home: "/business/dashboard",
  },
  coach: { email: "coach@anchor.dev", password: "AnchorCoach1!", home: "/coach/programs" },
  admin: { email: "admin@anchor.dev", password: "AnchorAdmin1!", home: "/admin/dashboard" },
} as const;

async function loginAs(
  page: import("@playwright/test").Page,
  role: keyof typeof USERS,
  options?: { returnTo?: string; admin?: boolean },
) {
  const user = USERS[role];
  const loginPath = options?.admin
    ? `/admin/login${options.returnTo ? `?returnTo=${encodeURIComponent(options.returnTo)}` : ""}`
    : `/login${options?.returnTo ? `?returnTo=${encodeURIComponent(options.returnTo)}` : ""}`;

  await page.goto(loginPath);
  await page.getByLabel(/email|courriel/i).fill(user.email);
  await page.getByLabel(/^password$|^mot de passe$/i).fill(user.password);
  await page.getByRole("button", { name: /sign in|se connecter/i }).click();
  await page.waitForURL(new RegExp(options?.returnTo ?? user.home));
}

test.describe("Login", () => {
  test("login page loads with OAuth and email form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /google/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email|courriel/i)).toBeVisible();
  });

  for (const role of ["parent", "business", "coach"] as const) {
    test(`${role} lands on role home after login`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page).toHaveURL(new RegExp(USERS[role].home));
    });
  }

  test("admin lands on dashboard via /admin/login", async ({ page }) => {
    await loginAs(page, "admin", { admin: true });
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("returnTo preserved from public register path", async ({ page }) => {
    const returnTo = "/p/demo-camp/programs/summer";
    await loginAs(page, "parent", { returnTo });
    await expect(page).toHaveURL(new RegExp(returnTo.replace(/\//g, "\\/")));
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email|courriel/i).fill("nobody@anchor.dev");
    await page.getByLabel(/^password$|^mot de passe$/i).fill("WrongPass1!");
    await page.getByRole("button", { name: /sign in|se connecter/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
