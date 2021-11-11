const puppeteer = require('puppeteer-core');

const url = 'https://ubuntu.com/blog/mojo-updates';
const pdf = 'blog-mojo-update.pdf';

(async () => {
  const browser = await puppeteer.launch(
	  { executablePath: '/usr/bin/chromium' }
  );
  const page = await browser.newPage();
  await page.goto( url, {
    waitUntil: 'networkidle2',
  });

  let html = await page.$eval('article', (element) => {
      return element.outerHTML;
  });
  
  await page.setContent(html);
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  // add word-wrap to all <pre/> elements
  await page.$$eval('pre', (pre) => {
    pre.forEach( el => {
      console.log(`Patching el=${el}`);
      el.style.whiteSpace='pre-wrap';
      console.log(`Done patching el=${el}`);
    });
  });

  await page.addStyleTag({url: 'https://ubuntu.com/static/css/print.css?v=e91d129'});
 

/*
  await page.waitForSelector('button.p-button--positive');
  await page.click('button.p-button--positive');
  await page.waitForSelector('div.p-post__content');

  await page.evaluate(() => {
     // remove Submissions
     let toDel = document.querySelector('div#success');
         toDel.parentNode.removeChild(toDel);
  });
  */

  await page.pdf({ path: pdf, format: 'a4' });
  console.log(`Page '${url}' saved to '${pdf}'`);
  await browser.close();
})(); 

