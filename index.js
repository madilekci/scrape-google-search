import * as cheerio from 'cheerio';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ssPath = `${__dirname}/results/ss`;
const resultsPath = `${__dirname}/results`

import { createBrowserPage, takeScreenShot, scrollToBottom } from './helpers/puppeteer-helpers.js';
import writeFile from './helpers/write-file.js';
import getArgs from './helpers/get-args.js';

const parseResults = async(pageHTML) => {
    const $ = await cheerio.load(pageHTML);

    // inline-videos
    const videoList = [];
    const videoVoyagers = $('video-voyager').toArray();

    videoVoyagers.forEach((element, index) => {
        const source = $(element).find('div:first').attr('data-surl');

        console.log('source', source);
        videoList.push({
            position: index,
            source
        });
    });


    let parsedResults = {
        videos: videoList
    };
    return parsedResults;
}

let { keyword } = getArgs();
const init = async() => {
    try {
        const [browser, page] = await createBrowserPage();

        console.log('go to search page');
        await page.goto(`https://google.com/search?q=${keyword}`);
        await page.waitForSelector('#result-stats');
        // await takeScreenShot(page, ssPath, `screenshots-1-${keyword}`);

        // TODO: setup different locations
        // await page.setGeolocation({latitude: 39.923054, longitude: 130.451673});

        console.log('save page html');
        await scrollToBottom(page);
        const pageHTML = await page.evaluate(() => document.querySelector('*').innerHTML);
        writeFile(resultsPath + keyword + '.html', pageHTML);

        console.log('parse page html');
        const parsedResults = await parseResults(pageHTML);

        await browser.close();
        return parsedResults;
    } catch (error) {
        console.log(error);
    }
}

const x = await init();
console.log(x);