export default async function run(page, ui) {
  await page.waitForTimeout(3500); // preloader + typing
  await page.screenshot({ path: 'C:/Users/User/OneDrive/Documents/Python/loop-site/shot_hero.png' });
  // scroll through the page so reveals fire, then check bottom
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  // test the playground button
  await page.locator('#runBtn').click();
  await page.waitForTimeout(700);
  const out = await page.locator('#codeOutput').innerText();
  // test form validation
  await page.locator('#submitBtn').click();
  await page.waitForTimeout(300);
  const errors = await page.locator('.field.error').count();
  const reveals = await page.evaluate(() => ({
    total: document.querySelectorAll('.reveal').length,
    visible: document.querySelectorAll('.reveal.visible').length
  }));
  await page.screenshot({ path: 'C:/Users/User/OneDrive/Documents/Python/loop-site/shot_full.png', fullPage: true });
  return { playgroundOutput: out.slice(0, 200), validationErrorsShown: errors, reveals };
}
