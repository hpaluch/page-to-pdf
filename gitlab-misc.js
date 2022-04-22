const puppeteer = require('puppeteer-core');

const url = 'https://gitlab.com/gitlab-com/gl-infra/production/-/issues/5152';
const pdf = 'gitlab-infra-issue-5152.pdf'

console.log(`Fetching '${url}' to '${pdf}'...`);

(async () => {
  const browser = await puppeteer.launch(
	  { executablePath: '/usr/bin/chromium' }
  );
  const page = await browser.newPage();
  await page.goto( url, {
    waitUntil: 'networkidle0',
  });


  let html = await page.$eval('main', (element) => {
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

  //await page.addStyleTag({url: 'https://ubuntu.com/static/css/print.css?v=e91d129'});
  
 // await page.waitFor(5000);
/*	
  await page.click('button.p-button--positive');
  await page.waitForSelector('div.p-post__content');
  */

  await page.pdf({ path: pdf, format: 'a4', scale: 1.5, });
  console.log(`Page '${url}' saved to '${pdf}'`);
  await browser.close();
})(); 

