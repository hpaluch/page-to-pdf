const puppeteer = require('puppeteer-core');

const url = 'https://maas.io/tutorials/create-kvm-pods-with-maas#1-overview';
const pdf = 'maas-pods.pdf';

//const url = 'https://maas.io/tutorials/build-a-maas-and-lxd-environment-in-30-minutes-with-multipass-on-ubuntu#1-overview';
//const pdf = 'maas-mpass.pdf';

console.log(`Fetching '${url}' to '${pdf}'...`);

(async () => {
  const browser = await puppeteer.launch(
	  { executablePath: '/usr/bin/chromium' }
  );
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  await page.goto( url, {
    waitUntil: 'networkidle0',
  });


  // add word-wrap to all <pre/> elements
  await page.$$eval('pre', (pre) => {
    console.log(`Patching ${pre.length} <pre/> elements`);
    pre.forEach( el => {
      el.style.whiteSpace='pre-wrap';
    });
  });

  // deleting annoying stuff
  await page.$$eval('div#cookie-policy-content, header#navigation, div.p-tutorial__feedback-options, footer', (arr) => {
      console.log(`Deleting ${arr.length} elements`);
      arr.forEach( el => {
         el.parentNode.removeChild(el);
      });
  });

  await page.pdf({ path: pdf, format: 'a4' });
  console.log(`Page '${url}' saved to '${pdf}'`);
  await browser.close();
})(); 

