const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');
var fs = require('fs');
const cron = require("node-cron");

const cookiesFilePath = "./cookies.json"

const saveCookies = async (page) => {

    // Save Session Cookies
    const cookiesObject = await page.cookies()

    // Write cookies to temp file to be used in other profile pages
    jsonfile.writeFile(cookiesFilePath, cookiesObject, { spaces: 2 },

        function (err) {
            if (err) {
                console.log('The file could not be written.', err)
            }

            console.log('Session has been successfully saved')
        })

}

const openSession = async (page) => {

    // If file exist load the cookies
    const cookiesArr = require(`${cookiesFilePath}`)
    if (cookiesArr.length !== 0) {
        for (let cookie of cookiesArr) {
            await page.setCookie(cookie)
        }
        console.log('Session has been loaded in the browser')
        return true
    }

}

const login = async (page) => {

    await page.setViewport({ width: 1200, height: 720 })
    await page.goto('https://br.tradingview.com/#signin', { waitUntil: 'networkidle0' }); // wait until page load]

    const username = process.env.TRADING_VIEW_USERNAME
    const password = process.env.TRADING_VIEW_PASSWORD

    await page.type('[type=text]', username);
    await page.type('[type=password]', password);

    try {

        const [response] = await Promise.all([
            page.waitForNavigation({ timeout: 6, waitUntil: 'networkidle0' }), // The promise resolves after navigation has finished
            page.click('[type=submit]'), // Clicking the link will indirectly cause a navigation
        ]);

    } catch (error) {
        console.log('catch')
    }
}

function getCurrentTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    console.log(hour, min, sec)
}


const getData = async function (page) {
    const {
        setIntervalAsync,
        clearIntervalAsync
    } = require('set-interval-async/dynamic')

    setIntervalAsync(
        async () => {
            
            const hour = await page.$eval('.inner-2FptJsfC-', el => el.innerText)
            const price = await page.$eval('.dl-header-price', el => el.innerText)
            console.log(`Hour: ${hour} - Price: ${price}`)

        },
        1000
    )

}

// Start function
const start = async function () {

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], userDataDir: "./user_data" });

    const page = await browser.newPage()

    const previousSession = fs.existsSync(cookiesFilePath)

    try {
        await login(page);
    } catch (error) {
    }


    try {

        const errorMesssage = await page.$eval('.tv-http-error-page__title', el => el.innerText)
        if (errorMesssage) {
            console.log("Error in login")
            return false;
        }

    } catch (error) {
        console.log('Login successfully')
    }

    await page.waitFor(1000);
    await page.goto('https://www.tradingview.com/chart/fu7bcOd1/', { waitUntil: 'networkidle0' }); // wait until page load]

    const name = await page.$eval('.dl-header-price', el => el.innerText)
    console.log(name)

    getData(page)
}

start()