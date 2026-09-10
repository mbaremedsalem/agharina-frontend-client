import puppeteer from "puppeteer-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1280, height: 1400 } });
const page = await browser.newPage();
await page.goto("http://localhost:5191/biens/AGH-APP-E99CDF3E", { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "_multi_gest_tall.png" });
await browser.close();
