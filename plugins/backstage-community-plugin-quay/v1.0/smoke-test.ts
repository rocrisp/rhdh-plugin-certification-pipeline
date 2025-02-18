import { expect, test } from "@playwright/test";
import { UIhelper } from "../../../utils/ui-helper";
import { Common } from "../../../utils/common";
import { ImageRegistry } from "../../../utils/quay/quay";

test.describe("Test Quay.io plugin", () => {
  const quayRepository = "rhdh-community/rhdh";
  let uiHelper: UIhelper;

  // test.beforeEach(async ({ page }) => {
  //   const common = new Common(page);
  //   await common.loginAsGuest();

  //   uiHelper = new UIhelper(page);
  //   await uiHelper.openSidebar("Catalog");
  //   await uiHelper.selectMuiBox("Kind", "Component");
  //   await uiHelper.clickByDataTestId("user-picker-all");
  //   await uiHelper.clickLink("Backstage Showcase");
  //   await uiHelper.clickTab("Image Registry");
  // });

  test("Check if Image Registry is present", async ({ page }) => {
    await uiHelper.verifyHeading(quayRepository);

    const allGridColumnsText = ImageRegistry.getAllGridColumnsText();

    // Verify Headers
    for (const column of allGridColumnsText) {
      const columnLocator = page.locator("th").filter({ hasText: column });
      await expect(columnLocator).toBeVisible();
    }

    await page
      .locator('div[data-testid="quay-repo-table"]')
      .waitFor({ state: "visible" });
    // Verify cells with the adjusted selector
    const allCellsIdentifier = ImageRegistry.getAllCellsIdentifier();
    await uiHelper.verifyCellsInTable(allCellsIdentifier);
  });
  
  test("it should show a table, and the table should contain quay plugins", async ({
    page,
  }) => {
    // what shows up in the list depends on how the instance is configured so
    // let's check for the main basic elements of the component to verify the
    // mount point is working as expected
    await uiHelper.verifyText(/Plugins \(\d+\)/);
    await uiHelper.verifyText("5 rows", false);
    await uiHelper.verifyColumnHeading(
      ["Name", "Version", "Enabled", "Preinstalled", "Role"],
      true,
    );

    // Check the filter and use that to verify that the table contains the
    // dynamic-plugins-info plugin, which is required for this test to run
    // properly anyways
    await page
      .getByPlaceholder("Search")
      .pressSequentially("quay\n", { delay: 300 });
    await uiHelper.verifyRowsInTable(["backstage-community-plugin-quay"], true);
  });
  
});
