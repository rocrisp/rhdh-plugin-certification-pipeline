import { expect, test } from "@playwright/test";
import { UIhelper } from "../../../utils/ui-helper";
import { Common } from "../../../utils/common";
import { UI_HELPER_ELEMENTS } from "../../../support/pageObjects/global-obj";

test.describe("dynamic-plugins-info UI tests", () => {
  let uiHelper: UIhelper;
  let common: Common;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGuest();
    await uiHelper.openSidebarButton("Administration");
    await uiHelper.openSidebar("Plugins");
    await uiHelper.verifyHeading("Plugins");
  });

  test("it should show a table, and the table should contain techdocs plugins", async ({
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
      .pressSequentially("techdocs\n", { delay: 300 });
    await uiHelper.verifyRowsInTable(["backstage-plugin-techdocs"], true);
  });
});