import * as cheerio from 'cheerio';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ssPath = `${__dirname}/results/ss`;
const resultsPath = `${__dirname}/results`

import { createBrowserPage, takeScreenShot, scrollToBottom } from './helpers/puppeteer-helpers.js';
import writeFile from './helpers/write-file.js';
import readFile from './helpers/read-file.js';
import getArgs from './helpers/get-args.js';

const parseResults = async(pageHTML) => {
    const $ = await cheerio.load(pageHTML);

    // inline-videos
    const videoList = [];
    $('video-voyager').toArray().forEach((element, index) => {
        const source = $(element).find('div:first').attr('data-surl');
        videoList.push({
            position: index+1,
            source
        });
    });

    // Organic search results
    const organicResults = [];
    $('[data-sokoban-container]').toArray().forEach((element, index) => {
        const result = {
            position: index+1,
            title : $(element).find('[data-header-feature=0] div a h3').text(),
            description: $(element).find('[data-content-feature=2] div').text(),
            link: $(element).find('[data-header-feature=0] div a').attr().href,
        }
        organicResults.push(result)
    });

    // Advertisement search results
    const adResults = [];
    $('[data-text-ad]').toArray().forEach((element, index) => {
        const result = {
            position: index+1,
            link: $(element).find('a:has(div[role=heading])').attr().href,
            title : $(element).find('div[role=heading]').text(),
        }
        adResults.push(result)
    });

    // People also asked
    const relatedQuestions = [];
    $(`.related-question-pair:has(div[role="heading"])`).toArray().forEach((element, index) => {
        const result = {
            position: index+1,
            question: $($(element).find('.dnXCYb[role=button]')).text(),
            answer_text: $($(element).find('.bCOlv div[role=heading]')).text(),
            answer_resource: $(element).find('.yuRUbf > a').attr().href,
            search_more: 'https://www.google.com'+$($(element).find('.bCOlv > div > a')).attr().href,
        }
        relatedQuestions.push(result)
    })


    // Knowledge graph
    const knowledgeGraphCard = $('[role=complementary]');

    // Knowledge graph -> known attributes
    const attributes = []
    $('[role=complementary] .wDYxhc[data-attrid]').toArray().forEach((element) => {
        const attributeValues = {
            [$(element).find('div div span:first').text()]: $(element).find('div div span:last').text()
        }
        const result = {
            [$(element).attr()['data-attrid']] : attributeValues
        };

        attributes.push(result)
    });

    const knowledgeGraph = {
        title: knowledgeGraphCard.find('[data-attrid="title"]:first').text(),
        subtitle: knowledgeGraphCard.find('[data-attrid="subtitle"]:first').text(),
        description: knowledgeGraphCard.find('[data-md="50"] h3+span').text(),
        website: {
            url: knowledgeGraphCard.find('[data-md="50"] h3+span+span > a').attr().href,
            text: knowledgeGraphCard.find('[data-md="50"] h3+span+span > a').text()
        },
        attributes

    }

     // Related search queries
     const relatedSearch = [];
    $('.y6Uyqe div:has(>b)').toArray().forEach((element, index) => {
        relatedSearch.push({
            position: index + 1,
            query: $(element).text()
        })
    })

    let parsedResults = {
        'inline_videos': videoList,
        'organic_results': organicResults,
        'paid_ads': adResults,
        'related_questions': relatedQuestions,
        'knowledge_graph': knowledgeGraph,
        'related_search': relatedSearch
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
        await takeScreenShot(page, ssPath, `screenshots-1-${keyword}`, true);

        // TODO: setup different locations
        // await page.setGeolocation({latitude: 39.923054, longitude: 130.451673});

        console.log('save page html');
        await scrollToBottom(page);
        await page.waitForTimeout(1000);

        const pageHTML = await page.evaluate(() => document.querySelector('*').innerHTML);
        writeFile(resultsPath +'/' + keyword + '.html', pageHTML);

        console.log('parse page html');
        const parsedResults = await parseResults(pageHTML);

        await browser.close();
        return parsedResults;
    } catch (error) {
        console.log(error);
    }
}

const parseFromFile = async() => {
    const pageHTML = readFile(`${resultsPath}/${keyword}.html`);
    return await parseResults(pageHTML);
}

// const x = await init();
// console.log(x);

const x = await parseFromFile();
console.log(x);