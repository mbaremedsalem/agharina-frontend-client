import puppeteer from "puppeteer-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1280, height: 900 } });
function log(label, ok, extra = "") {
  console.log(`[${ok ? "OK" : "FAIL"}] ${label}${extra ? " - " + extra : ""}`);
}

try {
  // --- Client: bien detail shows 2 manager cards ---
  const page = await browser.newPage();
  await page.goto("http://localhost:5191/biens/AGH-APP-E99CDF3E", { waitUntil: "domcontentloaded" });
  await wait(1200);

  const managerCards = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".contact-row")];
    return rows.map((r) => r.querySelector("div > div")?.textContent);
  });
  log("Client detail: shows 2 manager contact cards", managerCards.length === 2, JSON.stringify(managerCards));

  const phoneButtons = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href"))
  );
  log("Client detail: both phone numbers shown as tel: links", phoneButtons.length === 2, JSON.stringify(phoneButtons));

  await page.screenshot({ path: "_multi_gest_client.png" });

  console.log("DONE_CLIENT");
} catch (err) {
  console.error("ERROR", err.message);
} finally {
  await browser.close();
}
