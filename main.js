const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');
var fs = require('fs');
const cron = require("node-cron");
const util = require('util')

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

function getCurrentDay() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    return year + "-" + month + "-" + day
}


const getData = async function (page) {
    const {
        setIntervalAsync,
        clearIntervalAsync
    } = require('set-interval-async/dynamic')

    const today = getCurrentDay()
    
    let data = {}

    setIntervalAsync(
        async () => {
            const hour = await page.$eval('.inner-2FptJsfC-', el => el.innerText)
            
            let minute = hour.split(":")
            minute = minute[0] + ":" + minute[1]

            
            data[minute] = minute in data ? data[minute] : [] 

            let ibovPrice = await page.$eval('div[symbol-short=IBOV]', el => el.innerText)
            ibovPrice = ibovPrice.split("\n")
            ibovPrice = ibovPrice[1]

            let miniIbovPrice = await page.$eval('div[symbol-short=WINJ2019]', el => el.innerText)
            miniIbovPrice = miniIbovPrice.split("\n")
            miniIbovPrice = miniIbovPrice[1]

            let dolPrice = await page.$eval('div[symbol-short=DOLJ2019]', el => el.innerText)
            dolPrice = dolPrice.split("\n")
            dolPrice = dolPrice[1]
            
            let dataObject = {
                "time" : hour,
                "ibov" : ibovPrice,
                "mini-index": miniIbovPrice,
                "dol":dolPrice
                
            }

            data[minute].push(dataObject)
            console.log(minute + ": " + data[minute].length);
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