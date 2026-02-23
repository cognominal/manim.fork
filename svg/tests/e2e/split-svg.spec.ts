import { expect, test } from "@playwright/test";

test("unsplit tabs and tree -> SVG code selection", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("tab-scene")).toBeVisible();
  await expect(page.getByTestId("tab-svg")).toBeVisible();

  await page.getByTestId("tab-svg").click();
  await expect(page.getByTestId("svg-code-pane")).toBeVisible();

  await page.getByTestId("tree-row-rect-1").click();

  const selectionText = await page.evaluate(() => {
    const host = document.querySelector(
      "[data-testid='svg-code-pane']"
    ) as (HTMLElement & { __cmView?: any }) | null;
    const view = host?.__cmView;

    if (!view) {
      return null;
    }

    const main = view.state.selection.main;

    return view.state.doc.sliceString(main.from, main.to);
  });

  expect(selectionText).toContain("rect-1");
});

test("split mode and SVG code -> tree selection", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("toggle-split").click();

  await expect(page.getByTestId("split-left-svg")).toBeVisible();
  await expect(page.getByTestId("split-right-scene")).toBeVisible();
  await expect(page.getByTestId("tab-scene")).toHaveCount(0);

  const found = await page.evaluate(() => {
    const host = document.querySelector(
      "[data-testid='svg-code-pane']"
    ) as (HTMLElement & { __cmView?: any }) | null;
    const view = host?.__cmView;

    if (!view) {
      return false;
    }

    const doc = view.state.doc.toString();
    const start = doc.indexOf("text-1");

    if (start < 0) {
      return false;
    }

    view.dispatch({
      selection: {
        anchor: start,
        head: start + "text-1".length
      },
      scrollIntoView: true
    });

    return true;
  });

  expect(found).toBe(true);

  await expect(page.getByTestId("tree-row-text-1")).toHaveAttribute(
    "data-selected",
    "true"
  );
});
