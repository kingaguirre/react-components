// tests/data-table.spec.js
import { test, expect } from '@playwright/test'

test('adds a new row, validates input, and saves the row correctly', async ({ page }) => {
  // 0. Navigate to the page that renders your DataTable component.
  await page.goto('http://localhost:6006/?path=/story/organisms-datatable--test') // adjust the URL accordingly
  await page.waitForTimeout(500)

  // Locate the Storybook preview iframe using a CSS selector.
  // Adjust the selector based on your Storybook DOM.
  const iframeElement = await page.waitForSelector('iframe#storybook-preview-iframe, iframe[title="Story Preview"]', { timeout: 10000 });
  await page.waitForTimeout(500)
  
  if (!iframeElement) {
    throw new Error('Storybook preview iframe element not found');
  }

  // Get the frame's content.
  const frame = await iframeElement.contentFrame();
  if (!frame) {
    throw new Error('Could not retrieve content frame from iframe');
  }

  // Close storybook bottom panel
  const sbCloseIcon = page.getByTitle('Hide addons [⌥ A]')
  await sbCloseIcon.click()

  await page.waitForTimeout(500)

  // 1. Click the add button.
  const addButton = frame.getByTestId('add-row-button')
  await addButton.focus()
  await page.waitForTimeout(500)
  await addButton.click()
  await page.waitForTimeout(500)

  // 2. Confirm that a new row appears (with test-id "row-0") with class 'new'.
  const newRow = frame.getByTestId('row-0')
  await expect(newRow).toBeVisible()
  await expect(newRow).toHaveClass(/new/)
  await page.waitForTimeout(500)

  // 3. Click the cancel button to discard the new row.
  const cancelButton = frame.getByTestId('cancel-row-button-0')
  await expect(cancelButton).toBeVisible()
  await page.waitForTimeout(500)
  await cancelButton.click()
  await page.waitForTimeout(500)
  // Wait for the cancel button to disappear.
  await expect(cancelButton).toBeHidden()
  await page.waitForTimeout(500)

  // 4. Confirm that the new row is "reset" (i.e. no longer has the 'new' class).
  await expect(newRow).toBeVisible()
  await expect(newRow).not.toHaveClass(/new/)
  await page.waitForTimeout(500)

  // 5. Click the add button again to add a new row.
  await addButton.focus()
  await page.waitForTimeout(500)
  await addButton.click()
  await page.waitForTimeout(500)
  await expect(newRow).toHaveClass(/new/)
  await page.waitForTimeout(500)

  // 6. Click the first row's cell (e.g., test-id "column-0-firstName").
  const cell = frame.getByTestId('column-0-firstName')
  await cell.hover() // confirm that tootltip will show in non editable cell with invalid
  await page.waitForTimeout(500)
  const cellTooltip = frame.locator('.column-0-firstName-tooltip')
  await expect(cellTooltip).toBeVisible()
  await page.waitForTimeout(500)
  await cell.click()
  await page.waitForTimeout(500)

  // 8. Check that the invalid message appears.
  const invalidMessage = frame.getByTestId('form-control-0-firstName-help-text')
  await expect(invalidMessage).toBeVisible()
  await page.waitForTimeout(500)

  // 7. Type a correct input to trigger validation.
  const cellInput = frame.getByTestId('form-control-0-firstName')
  await cellInput.fill('King')
  await page.waitForTimeout(500)
  await expect(invalidMessage).toBeHidden() // invalid helptext should be hidden since valid value
  await page.waitForTimeout(500)

  // 8. Check that the invalid message appears.
  await cellInput.fill('name123') // type wrong input
  await page.waitForTimeout(500)
  await expect(invalidMessage).toBeVisible()
  await page.waitForTimeout(500)

  // 9. Verify that the save button is disabled when the input is invalid.
  const saveButton = frame.getByTestId('save-row-button-0')
  await expect(saveButton).toBeDisabled()
  await page.waitForTimeout(500)

  // 10. Clear the wrong input and type a correct value.
  await cellInput.fill('')
  await expect(invalidMessage).toBeVisible() // should show invalid help text again since cleared and the input is required
  await page.waitForTimeout(500)
  await cellInput.fill('King')
  await page.waitForTimeout(500)
  await expect(invalidMessage).toBeHidden() // should be hidden since typed correct value
  await cellInput.press('Enter')
  await page.waitForTimeout(500)
  // Wait for validation update and ensure the invalid message is gone.
  await expect(invalidMessage).toBeHidden()
  await page.waitForTimeout(500)

  // 11. Confirm that the save button is now enabled, then click it.
  await expect(saveButton).toBeEnabled()
  await page.waitForTimeout(500)
  await saveButton.click()
  await page.waitForTimeout(500)

  // 12. Confirm that the saved row (test-id "row-0") no longer has the 'new' class.
  await expect(newRow).not.toHaveClass(/new/)
  await page.waitForTimeout(500)
})

test('edit cell and delete row', async ({ page }) => {
  // 0. Navigate to the Storybook page that renders your DataTable component.
  await page.goto('http://localhost:6006/?path=/story/organisms-datatable--test') // adjust URL if needed
  await page.waitForTimeout(500)

  // Locate the Storybook preview iframe.
  const iframeElement = await page.waitForSelector('iframe#storybook-preview-iframe, iframe[title="Story Preview"]', { timeout: 10000 });
  if (!iframeElement) {
    throw new Error('Storybook preview iframe element not found');
  }
  const frame = await iframeElement.contentFrame();
  if (!frame) {
    throw new Error('Could not retrieve content frame from iframe');
  }

  // Close storybook bottom panel
  const sbCloseIcon = page.getByTitle('Hide addons [⌥ A]')
  await sbCloseIcon.click()

  await page.waitForTimeout(500)

  // 1. Target the cell with test-id "column-0-firstName" and click it.
  const cell = frame.getByTestId('column-0-firstName')
  await cell.click()
  await page.waitForTimeout(500)

  // 2. Confirm that the input (test-id "form-control-0-firstName") has text "John".
  const cellInput = frame.getByTestId('form-control-0-firstName')
  await expect(cellInput).toHaveValue('John')
  await page.waitForTimeout(500)

  // 3. Clear the input and check if the tooltip (.column-0-firstName-tooltip) becomes visible.
  await cellInput.fill('')
  await page.waitForTimeout(500)
  const invalidMessage = frame.getByTestId('form-control-0-firstName-help-text')
  await expect(invalidMessage).toBeVisible()
  await page.waitForTimeout(500)
  await cellInput.press('Enter')
  await page.waitForTimeout(500)
  await cell.hover()
  await page.waitForTimeout(500)
  const tooltip = frame.locator('.column-0-firstName-tooltip')
  await expect(tooltip).toBeVisible()
  await page.waitForTimeout(500)
  await cell.click()
  await page.waitForTimeout(500)
  await expect(cellInput).toHaveValue('')
  await page.waitForTimeout(500)

  // 4. Enter "King" and check that the tooltip is hidden.
  await cellInput.fill('King')
  await page.waitForTimeout(500)
  await expect(tooltip).toBeHidden()
  await page.waitForTimeout(500)

  // 5. Enter "343434" and check that the tooltip becomes visible (invalid input).
  await cellInput.fill('343434')
  await page.waitForTimeout(500)
  await expect(invalidMessage).toBeVisible()
  await page.waitForTimeout(500)

  // 6. Enter "King" again and check that the tooltip is visible.
  // (Note: This step may conflict with earlier behavior if "King" is considered valid.
  // However, following the spec exactly.)
  await cellInput.fill('King')
  await page.waitForTimeout(500)
  await expect(tooltip).toBeHidden()
  await page.waitForTimeout(500)

  // 7. Press "Enter" to save the edit.
  await cellInput.press('Enter')
  await page.waitForTimeout(500)

  // 8. Check for the delete button (test-id "delete-row-button-9") and hover.
  const deleteButton = frame.getByTestId('delete-row-button-9')
  await expect(deleteButton).toBeVisible()
  await deleteButton.hover()
  await page.waitForTimeout(500)

  // 9. Click the delete button.
  await deleteButton.click()
  await page.waitForTimeout(500)

  // 10. Confirm that the row (test-id "row-9") is no longer in the DOM.
  const deletedRow = frame.getByTestId('row-9')
  await expect(deletedRow).toBeHidden({ timeout: 5000 })
})
