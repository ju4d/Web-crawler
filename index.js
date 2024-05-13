import puppeteer from "puppeteer";
import fs from "fs";
import readline from "readline";

async function GetData(page) {
    const data = await page.$$eval('input[data-t="copyVoucherCode"], a.cept-tt.thread-link.linkPlain.thread-title--list.js-thread-title, span.threadItemCard-price.text--b.thread-price.size--all-l.size--fromW3-xl.space--mr-0, #thread_951382 > div > div:nth-child(5) > div > span:nth-child(3) > a', elements =>
        elements.map(element => {
            if (element.tagName === 'INPUT') {
                return { Cupon: element.getAttribute('value') };
            } else if (element.tagName === 'A') {
                return { Articulo: element.getAttribute('title'), enlace: element.getAttribute('href') };
            } else if (element.tagName === 'SPAN') {
                return { Precio: element.textContent.trim() };
            }
        })
    );
    return data;
}

async function getUserInput(page) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Que ofertas buscas ==> ', async (answer) => {
            await page.type('#header-portal > header > div > div > div.nav-search.flex--fromW3.boxAlign-ai--all-c.boxAlign-jc--all-fe.space--h-2.space--fromW3-h-2.width--all-12.zIndex--popover.space--l-2 > form > div > span > input', answer);
            await page.keyboard.press('Enter');

            rl.close();
            
            resolve();
        });
    });
}

async function scrollDosTerciosPagina(page) {
    await page.evaluate(() => {
        const dosTerciosPagina = document.body.scrollHeight * (2/3);
        window.scrollTo(0, dosTerciosPagina);
    });
}

async function Navigate() {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            slowMo: 200
        });
        const page = await browser.newPage();

        await page.goto('https://www.promodescuentos.com');

        await getUserInput(page);

        await page.waitForNavigation();

        await page.waitForSelector('#detailedFilterPortal > div > div:nth-child(2) > ol > li:nth-child(2) > div > label > span.tGrid-cell.tGrid-cell--shrink');
        await page.click('#detailedFilterPortal > div > div:nth-child(2) > ol > li:nth-child(2) > div > label > span.tGrid-cell.tGrid-cell--shrink');
        await page.waitForSelector('#detailedFilterPortal > div > div:nth-child(2) > ol > li:nth-child(2) > div > label > span.tGrid-cell.tGrid-cell--shrink');
        await page.click('#detailedFilterPortal > div > div:nth-child(2) > ol > li:nth-child(2) > div > label > span.tGrid-cell.tGrid-cell--shrink');

        let allData = []; 

        for (let i = 0; i < 3; i++) {
            const data = await GetData(page);
            allData.push(...data); 
            await scrollDosTerciosPagina(page);
            try {
                await page.waitForSelector("#main > div.flex--expand-v > div.flex--expand-v > div:nth-child(4) > div.bg--main.boxSec-div.js-pagi-bottom.width--all-12.flex.forceLayer.js-sticky.zIndex--fixed.js-sticky-pagi--on.pagi--max-height-80 > div > div > div > nav > button:nth-child(5)");
                await page.click("#main > div.flex--expand-v > div.flex--expand-v > div:nth-child(4) > div.bg--main.boxSec-div.js-pagi-bottom.width--all-12.flex.forceLayer.js-sticky.zIndex--fixed.js-sticky-pagi--on.pagi--max-height-80 > div > div > div > nav > button:nth-child(5)");
            } catch (error) {
                console.log("Solo hay una pagina mi niño ＞﹏＜");
            }
        }

        fs.writeFile("Descuentos.json", JSON.stringify(allData, null, 2), (err) => {
            if (err) throw err;
            console.log("Los descuentos se han guardado correctamente O(∩_∩)O");
        });

        await browser.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

Navigate();
