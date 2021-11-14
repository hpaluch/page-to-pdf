// export Juju docs to PDf pages
//
// based on: https://github.com/facebook/docusaurus/issues/969#issuecomment-595012118

const startUrl = 'https://juju.is/docs/olm';
const pdf = 'juju-docs-olm.pdf';

const expect = require('expect');
const puppeteer = require('puppeteer-core');
const { PDFRStreamForBuffer, createWriterToModify, PDFStreamForResponse } = require('hummus');
const { WritableStream } = require('memory-streams');
const fs = require('fs');

const mergePdfBlobs = (pdfBlobs) => {
  const outStream = new WritableStream();                                                                                                                                             
  const [firstPdfRStream, ...restPdfRStreams] = pdfBlobs.map(pdfBlob => new PDFRStreamForBuffer(pdfBlob));
  const pdfWriter = createWriterToModify(firstPdfRStream, new PDFStreamForResponse(outStream));

  restPdfRStreams.forEach(pdfRStream => pdfWriter.appendPDFPagesFromPDF(pdfRStream));

  pdfWriter.end();
  outStream.end();
  
  return outStream.toBuffer();
};


let generatedPdfBlobs = [];

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium' });
  let page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  // extract toc links first

  console.log(`Getting links from: '${startUrl}'`);
  await page.goto(startUrl, {waitUntil: 'networkidle0'});
  //let links  = await page.$$('div.p-side-navigation__drawer > ul li > a');
  let links  = await page.$$eval('div.p-side-navigation__drawer > ul li > a',
	  (nodes) => nodes.map( (n) => n.href ));

  console.log(`Got Links: ${links}`);
  expect(links).toBeDefined();
  expect(links).toBeInstanceOf(Array);
  expect(links.length).toBeGreaterThan(0);
  console.log(`Tests passed: got  ${links.length} links`);

  for (var i=0; i<links.length;i++) {
    //if (i>20) break;
    let nextPageUrl = links[i];
    console.log(`Crawling (${i+1}/${links.length}): '${nextPageUrl}'`);
    await page.goto(`${nextPageUrl}`, {waitUntil: 'networkidle0'});
      
    let html = await page.$eval('main#main-content', (element) => {
      return element.outerHTML;
    });
  
    await page.setContent(html);

    // add word-wrap to all <pre/> elements
    await page.$$eval('pre', (pre) => {
      console.log(`Patching ${pre.length} <pre/> elements`);
      pre.forEach( el => {
        el.style.whiteSpace='pre-wrap';
      });
    });

    await page.addStyleTag({url: 'https://juju.is/static/css/styles.css?v=8d5ecfe'});
    //await page.addScriptTag({url: 'http://localhost:3000/styles.js'});
    const pdfBlob = await page.pdf({path: "", format: 'A4', printBackground: true, margin : {top: 20, right: 15, left: 15, bottom: 20}});

    generatedPdfBlobs.push(pdfBlob);
    const waitMs = Math.random() * 1000 + 2000;
    console.log(`Waiting for ${waitMs} ms`);
    await page.waitForTimeout(waitMs); 
  }
  await browser.close();

  const mergedPdfBlob = mergePdfBlobs(generatedPdfBlobs);
  fs.writeFileSync(pdf, mergedPdfBlob);
  console.log(`Website written to ${pdf}`);
})();
