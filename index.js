import * as cheerio from 'cheerio';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ssPath = `${__dirname}/results/ss`;
const resultsPath = `${__dirname}/results`;

import { createBrowserPage, takeScreenShot, scrollToBottom } from './helpers/puppeteer-helpers.js';
import writeFile from './helpers/write-file.js';
import readFile from './helpers/read-file.js';
import getArgs from './helpers/get-args.js';

const parseResults = async (pageHTML) => {
	const $ = await cheerio.load(pageHTML);

	// inline-videos
	const videoList = [];
	try {
		$('video-voyager')
			.toArray()
			.forEach((element, index) => {
				try {
					const source = $(element).find('div:first').attr('data-surl');
					videoList.push({
						position: index + 1,
						source,
					});
				} catch (error) {}
			});
	} catch (error) {}

	// Organic search results
	const organicResults = [];
	try {
		$('[data-sokoban-container]')
			.toArray()
			.forEach((element, index) => {
				try {
					const result = {
						position: index + 1,
						title: $(element).find('[data-header-feature=0] div a h3').text(),
						description: $(element).find('[data-content-feature=2] div').text(),
						link: $(element).find('[data-header-feature=0] div a').attr().href,
					};
					organicResults.push(result);
				} catch (error) {}
			});
	} catch (error) {}

	// Advertisement search results
	const adResults = [];
	try {
		$('[data-text-ad]')
			.toArray()
			.forEach((element, index) => {
				try {
					const result = {
						position: index + 1,
						link: $(element).find('a:has(div[role=heading])').attr().href,
						title: $(element).find('div[role=heading]').text(),
					};
					adResults.push(result);
				} catch (error) {}
			});
	} catch (error) {}

	// People also asked
	const relatedQuestions = [];
	try {
		$(`.related-question-pair:has(div[role="heading"])`)
			.toArray()
			.forEach((element, index) => {
				try {
					const result = {
						position: index + 1,
						question: $($(element).find('.dnXCYb[role=button]')).text(),
						answer_text: $($(element).find('.bCOlv div[role=heading]')).text(),
						answer_resource: $(element).find('.yuRUbf > a').attr().href,
						search_more:
							'https://www.google.com' +
							$($(element).find('.bCOlv > div > a')).attr().href,
					};
					relatedQuestions.push(result);
				} catch (error) {}
			});
	} catch (error) {}

	// Knowledge graph
	const knowledgeGraphCard = $('[role=complementary]');

	// Knowledge graph -> known attributes
	const attributes = [];
	try {
		$('[role=complementary] .wDYxhc[data-attrid]')
			.toArray()
			.forEach((element) => {
				try {
					const attributeValues = {
						[$(element).find('div div span:first').text()]: $(element)
							.find('div div span:last')
							.text(),
					};
					const result = {
						[$(element).attr()['data-attrid']]: attributeValues,
					};

					attributes.push(result);
				} catch (error) {}
			});
	} catch (error) {}

	let knowledgeGraph;
	try {
		knowledgeGraph = {
			title: knowledgeGraphCard.find('[data-attrid="title"]:first').text(),
			subtitle: knowledgeGraphCard.find('[data-attrid="subtitle"]:first').text(),
			description: knowledgeGraphCard.find('[data-md="50"] h3+span').text(),
			website: {
				url: knowledgeGraphCard.find('[data-md="50"] h3+span+span > a').attr().href,
				text: knowledgeGraphCard.find('[data-md="50"] h3+span+span > a').text(),
			},
			attributes,
		};
	} catch (error) {}

	// Related search queries
	const relatedSearch = [];
	try {
		$('.y6Uyqe div:has(>b)')
			.toArray()
			.forEach((element, index) => {
				relatedSearch.push({
					position: index + 1,
					query: $(element).text(),
				});
			});
	} catch (error) {}

	let parsedResults = {
		...(videoList.length > 0 && { inline_videos: videoList }),
		...(organicResults.length > 0 && { organic_results: organicResults }),
		...(adResults.length > 0 && { paid_ads: adResults }),
		...(relatedQuestions.length > 0 && { related_questions: relatedQuestions }),
		...(knowledgeGraph && { knowledge_graph: knowledgeGraph }),
		...(relatedSearch.length > 0 && { related_search: relatedSearch }),
	};
	return parsedResults;
};

const init = async () => {
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
		writeFile(resultsPath + '/' + keyword + '.html', pageHTML);

		console.log('parse page html');
		const parsedResults = await parseResults(pageHTML);

		await browser.close();
		return parsedResults;
	} catch (error) {
		console.log(error);
	}
};

const parseFromFile = async (pageHTML) => {
	const parsedResults = await JSON.stringify(await parseResults(pageHTML));
    // return parsedResults;
    writeFile(`${resultsPath}/json/${keyword}.json`, parsedResults);

    return true;
};

let { keyword } = getArgs();
const pageHTML = readFile(`${resultsPath}/${keyword}.html`);
const x = await parseFromFile(pageHTML);
console.log(x);

// const x = await init();
// console.log(x);