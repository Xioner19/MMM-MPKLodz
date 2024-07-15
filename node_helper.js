const NodeHelper = require("node_helper");
const puppeteer = require("puppeteer");

module.exports = NodeHelper.create({
    start: function() {
        console.log('[\x1b[36mMPKLodz\x1b[0m] by Xioner19 >> Node helper loaded.');
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_DEPARTURES") {
            console.log("[\x1b[36mMPKLodz\x1b[0m]: Information fetched " + payload);
            this.getDepartures(payload);
        }
    },

    async getDepartures(stopId) {
        const urls = [
            `http://rozklady.lodz.pl/Home/TimeTableReal?busStopNum=${stopId}`,
            `http://rozklady.lodz.pl/Home/TimeTableReal?busStopId=${stopId}`
        ];

        let browser;
        try {
            browser = await puppeteer.launch({ headless: true });
            const results = await Promise.all(urls.map(url => this.scrapeDepartures(url, browser)));
            
            for (const result of results) {
                if (result && result.departures.length > 0) {
                    this.sendSocketNotification("DEPARTURES", result);
                    return;
                }
            }
            
            console.error("[\x1b[36mMPKLodz\x1b[0m]: Failed to fetch data from all URLs (stopId: " + stopId + ")");
        } catch (error) {
            console.error("[\x1b[36mMPKLodz\x1b[0m]: Failed to launch browser", error);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    },

    async scrapeDepartures(url, browser) {
        let page;
        try {
            page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });

            const result = await page.evaluate(() => {
                const stopName = document.querySelector('html > body > div > div:nth-of-type(1) > table:nth-of-type(1) > tbody > tr:nth-of-type(1) > th:nth-of-type(2)')?.textContent.trim();
                const rows = document.querySelectorAll('div.realtable-div table.realtable tr');
                let departures = [];

                rows.forEach(row => {
                    const route = row.querySelector('td.route')?.textContent.trim();
                    const direction = row.querySelector('td.dir')?.textContent.trim();
                    const time = row.querySelector('td.time span')?.textContent.trim();

                    if (route && direction && time) {
                        departures.push({ route, direction, time });
                    }
                });

                const tickerMessage = document.querySelector('p#scroller_content')?.textContent.trim();

                return { stopName, departures, tickerMessage };
            });

            return result;
        } catch (error) {
            console.error("[\x1b[36mMPKLodz\x1b[0m]: Error fetching data from URL: ", url, error);
            return null;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }
});
