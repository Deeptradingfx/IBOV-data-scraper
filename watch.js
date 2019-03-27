const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');
var fs = require('fs');
const cron = require("node-cron");
const csv = require('csv-writer');
const util = require('util')


const login = async (page) => {

  await page.setViewport({ width: 1366, height: 768 })
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

const writeInDB = async function (data, name, ativo) {
  let today = getCurrentDay()
  const csvWriter = require('csv-write-stream');

  const path = `./${ativo}/${name}.csv`

  let writer = csvWriter()

  if (!fs.existsSync(path))
    writer = csvWriter({
      headers: ['Ativo', 'Time', 'Open', 'Max', 'Min', 'Close']
    });
  else
    writer = csvWriter({ sendHeaders: false });

  console.log(data)

  writer.pipe(fs.createWriteStream(path, { flags: 'a' }));
  writer.write({
    Ativo:data.ativo,
    Time:data.time,
    Open:data.open,
    Max:data.max,
    Min:data.min,
    Close:data.close
  });
  writer.end();

}

function getCurrentDay() {
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();

  return year + "-" + month + "-" + day
}


const getData = async function (page, ativo) {
  const {
    setIntervalAsync,
    clearIntervalAsync
  } = require('set-interval-async/dynamic')

  const today = getCurrentDay()

  let data = {}

  console.log("Waiting...")
  await page.waitForFunction(
    'document.querySelector(".js-data-mode").textContent == "Replay Mode"'
  );

  setIntervalAsync(
    async () => {

      const day = await page.$$eval('.pane-legend-item-value', (el) => el[0].innerHTML)
      const month = await page.$$eval('.pane-legend-item-value', (el) => el[1].innerHTML)
      const hour = await page.$$eval('.pane-legend-item-value', (el) => el[2].innerHTML)
      const minute = await page.$$eval('.pane-legend-item-value', (el) => el[3].innerHTML)

      hourMinute = Math.floor(hour) + ":" + Math.floor(minute)
      dayMonth = Math.floor(day) + "-" + Math.floor(month)

      let openValue = await page.$$eval('.pane-legend-item-value__main', (el) => el[0].innerHTML)
      let maxValue = await page.$$eval('.pane-legend-item-value__main', (el) => el[1].innerHTML)
      let minValue = await page.$$eval('.pane-legend-item-value__main', (el) => el[2].innerHTML)
      let closeValue = await page.$$eval('.pane-legend-item-value__main', (el) => el[3].innerHTML)

      let dataObject = {
        "time": hourMinute,
        "ativo": ativo,
        "open": openValue,
        "max": maxValue,
        "min": minValue,
        "close": closeValue
      }

      writeInDB(dataObject, dayMonth, ativo)
    },
    1000
  )

}

// Start function
const start = async function () {

  const browser = await puppeteer.launch(
    { headless: false },
    {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-fullscreen'],
      userDataDir: "./user_data"
    }

  );

  const page = await browser.newPage()

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

  getData(page, "ibov")
}

start()
