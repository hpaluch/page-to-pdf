// export Rust by example
//
// based on: https://github.com/facebook/docusaurus/issues/969#issuecomment-595012118

const startUrl = 'https://docs.bazel.build/versions/main/';
const prefixUrl = 'https://docs.bazel.build/versions/main/';
const pdf = 'bazel-docs.pdf';

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
  let links  = await page.$$eval('nav a',
	  (nodes) => nodes.map( (n) => n.href ));

  console.log(`Got Links: ${links}`);
  expect(links).toBeDefined();
  expect(links).toBeInstanceOf(Array);
  expect(links.length).toBeGreaterThan(0);
  console.log(`Tests passed: got  ${links.length} links`);
  let links2 = [];
  for (var i=0; i<links.length;i++) {
    let nextPageUrl = links[i];
    if (!nextPageUrl.startsWith(prefixUrl)){
	    console.log(`WARN: URL '${nextPageUrl}' does NOT start with '${prefixUrl}'. Skipping.`);
	    continue;
    }
    nextPageUrl = nextPageUrl.replace(/#.*/,'');
    if (links2.includes(nextPageUrl)){
	    console.log(`WARN: URL '${nextPageUrl}' already in list. Skipping.`);
	    continue;
    }
    console.log(`OK Link: ${nextPageUrl}`);
    links2.push(nextPageUrl);
  }
  expect(links2).toBeDefined();
  expect(links2).toBeInstanceOf(Array);
  expect(links2.length).toBeGreaterThan(0);
  console.log(`Tests passed: got  ${links2.length} filtered links`);

//  process.exit(123);

  for (var i=0; i<links2.length;i++) {
    //if (i>3) break;
    let nextPageUrl = links2[i];
    console.log(`Crawling (${i+1}/${links2.length}): '${nextPageUrl}'`);
    await page.goto(`${nextPageUrl}`, {waitUntil: 'networkidle0'});
      
/*
    let html = await page.$eval('body', (element) => {
      return element.outerHTML;
    });
  
    await page.setContent(html);
    */

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
    await page.$$eval('nav, div.col-md-2', (arr) => {
      console.log(`Deleting ${arr.length} elements`);
      arr.forEach( el => {
         el.parentNode.removeChild(el);
      });
    }); 

    //await page.addStyleTag({url: 'https://docs.fedoraproject.org/en-US/_/css/site.css'});

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
