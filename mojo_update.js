const puppeteer = require('puppeteer-core');

const argv = process.argv;

if ( argv.length!=4){
	console.error(`Usage: ${argv[0]} ${argv[1]} URL OUTPUT_PDF_FILE`);
	process.exit(1);
}

const url = argv[2];
const pdf = argv[3];
console.log(`Fetching '${url}' to '${pdf}'...`);

(async () => {
  const browser = await puppeteer.launch(
	  { executablePath: '/usr/bin/chromium' }
  );
  const page = await browser.newPage();
  await page.goto( url, {
    waitUntil: 'networkidle0',
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

  await page.evaluate(() => {
     // remove product card
     let toDel = document.querySelector('div#product-card');
         toDel.parentNode.removeChild(toDel);
     // TODO: use array
     let toDel2 = document.querySelector('div.blog-p-card--muted');
         toDel2.parentNode.removeChild(toDel2);
    });

  await page.addStyleTag({url: 'https://ubuntu.com/static/css/print.css?v=e91d129'});
  await page.addScriptTag({url: 'https://assets.ubuntu.com/v1/703e23c9-lazysizes+noscript+native-loading.5.1.2.min.js'});
  

 // await page.waitFor(5000);
/*	
  await page.click('button.p-button--positive');
  await page.waitForSelector('div.p-post__content');
  */

  await page.pdf({ path: pdf, format: 'a4' });
  console.log(`Page '${url}' saved to '${pdf}'`);
  await browser.close();
})(); 

