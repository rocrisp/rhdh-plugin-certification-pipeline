import { test } from "@playwright/test";
import { UIhelper } from "../utils/ui-helper";
import { HomePage } from "../support/pages/home-page";
import { Common } from "../utils/common";

test.describe("Guest Signing Happy path", () => {
  let uiHelper: UIhelper;
  let homePage: HomePage;
  let common: Common;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    homePage = new HomePage(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  test("Rose-Verify the Homepage renders with Search Bar, Quick Access and Starred Entities", async () => {
    await uiHelper.verifyHeading("Welcome back!");
    await uiHelper.openSidebar("Home");
    await homePage.verifyQuickAccess("Developer Tools", "Podman Desktop");
  });

  test("Rose-Verify Profile is Guest in the Settings page", async () => {
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading("Guest");
    await uiHelper.verifyHeading("User Entity: guest");
  });

  test("Rose-Sign Out and Verify that you return to the Sign-in page", async () => {
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });
});
