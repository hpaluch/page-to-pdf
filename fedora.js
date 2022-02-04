// export Fedora 35 docs
//
// based on: https://github.com/facebook/docusaurus/issues/969#issuecomment-595012118

const startUrl = 'https://docs.fedoraproject.org/en-US/fedora/f35/';
const prefixUrl = 'https://docs.fedoraproject.org/en-US/fedora/f35/';
const pdf = 'fedora-35.pdf';

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
  let links  = await page.$$eval('nav.nav-menu ul li > a.nav-link',
	  (nodes) => nodes.map( (n) => n.href ));

  console.log(`Got Links: ${links}`);
  expect(links).toBeDefined();
  expect(links).toBeInstanceOf(Array);
  expect(links.length).toBeGreaterThan(0);
  console.log(`Tests passed: got  ${links.length} links`);

  //process.exit(123);

  for (var i=0; i<links.length;i++) {
    //if (i>3) break;
    let nextPageUrl = links[i];
    if (!nextPageUrl.startsWith(prefixUrl)){
	    console.log(`WARN: URL '${nextPageUrl}' does NOT start with '${prefixUrl}'. Skipping.`);
	    continue;
    }
    console.log(`Crawling (${i+1}/${links.length}): '${nextPageUrl}'`);
    await page.goto(`${nextPageUrl}`, {waitUntil: 'networkidle0'});
      
    let html = await page.$eval('main.main > article.doc', (element) => {
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

    // display content of all <details/>
    await page.$$eval('details', (de) => {
      console.log(`Patching ${de.length} <details/> elements`);
      de.forEach( el => {
        el.open=true; // any value opens details
      });
    });
    
    // delete annoying popups
    await page.$$eval('div#toc, div.mw-pt-languages,div.mw-parser-output > table', (arr) => {
      console.log(`Deleting ${arr.length} notification elements`);
      arr.forEach( el => {
         el.parentNode.removeChild(el);
      });
    }); 

    await page.addStyleTag({url: 'https://docs.fedoraproject.org/en-US/_/css/site.css'});

    const waitMs = Math.random() * 1000 + 2000;
    console.log(`Waiting for ${waitMs} ms`);
    await page.waitForTimeout(waitMs); 

    //await page.addScriptTag({url: 'http://localhost:3000/styles.js'});
    const pdfBlob = await page.pdf({path: "", format: 'A4', printBackground: true, margin : {top: 20, right: 15, left: 15, bottom: 20},scale: 1.2});

    generatedPdfBlobs.push(pdfBlob);
  }
  await browser.close();

  const mergedPdfBlob = mergePdfBlobs(generatedPdfBlobs);
  fs.writeFileSync(pdf, mergedPdfBlob);
  console.log(`Website written to ${pdf}`);
})();
