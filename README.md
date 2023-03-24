# Web Scraping Script with Node.js and Puppeteer
This project is a web scraping script built with Node.js, Puppeteer, and Cheerio. The script can perform a search on Google with a given keyword, save the results as an HTML file, parse this HTML file, and extract a .json file from it. The script can parse different sections like knowledge graph, people also asked, related searches, paid ads, and organic traffic.

All the outputs will be saved in the "results" folder.

## Prerequisites
Before running the script, make sure that you have the following software installed on your machine:

* Node.js (version 10.0 or higher)
* NPM (Node Package Manager)

## Installation
To install the project dependencies, run the following command:

```
npm install
```

# Usage
To run the script, use the following command:

```
node index.js --keyword=your_search_query
```
