const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');
var fs = require('fs');

const cookiesFilePath = "./cookies.json"
    
const saveCookies = async (page) => {

    // Save Session Cookies
    const cookiesObject = await page.cookies()

    // Write cookies to temp file to be used in other profile pages
    jsonfile.writeFile(cookiesFilePath, cookiesObject, { spaces: 2 },
    
    function(err) { 
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
    
        await page.setViewport({width: 1200, height: 720})
        await page.goto('https://br.tradingview.com/#signin', { waitUntil: 'networkidle0' }); // wait until page load]
    
        // click and wait for navigation
        // await page.click('.tv-header__link--signin'),
        // await page.waitForNavigation({ waitUntil: 'networkidle0' })
    
        await page.type('[type=text]', "");
        await page.type('[type=password]', "");

        try {
            
            const [response] = await Promise.all([
                page.waitForNavigation({timeout: 6, waitUntil:'networkidle0'}), // The promise resolves after navigation has finished
                page.click('[type=submit]'), // Clicking the link will indirectly cause a navigation
            ]);

        } catch (error) {
            console.log('catch')
        }
}   

// Start function
const start = async function() {

    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage()

    const previousSession = fs.existsSync(cookiesFilePath)

    try {
        await login(page);        
    } catch (error) {
        console.log('Done login')
    }

    console.log('saving cookies')
    await saveCookies(page)

    await page.waitFor(3000);
    await page.goto('https://br.tradingview.com/chart/fu7bcOd1/', { waitUntil: 'networkidle0' }); // wait until page load]

}

start()