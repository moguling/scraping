const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const puppeteer = require('puppeteer');
const request = require('request');
//const download = require('image-downloader');

function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}





async function getLinks() {
  console.log('running...');
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768});


  for (var fp = 3; fp<=42; fp++) {
      let url = "https://www.pornhub.com/albums/female-male-straight-transgender-uncategorized?search=sissy+captions&page="+fp;

      await page.goto(url, {timeout: 0});
      await page.waitFor('#photosAlbumsSection');
      let bodyHTML = await page.evaluate(() => document.body.innerHTML);
      let $ = cheerio.load(bodyHTML);
      var galleries = [];
      $('.photoAlbumListContainer div a').each(function(i, element) {
        let a = $(this).attr('href');
        galleries.push("https://www.pornhub.com"+a);

      });


      await delay(3000);

      for (var gallery in galleries) {
        await page.goto(galleries[gallery], {timeout: 0});
        await page.waitFor('.photoBlockBox');
        let galHTML = await page.evaluate(() => document.body.innerHTML);
        let $ = cheerio.load(galHTML);
        var imgs = [];

        $('.photoAlbumListContainer div a').each(function(i, element) {
          let p = $(this).attr('href');
          imgs.push("https://www.pornhub.com"+p);
        });

        while (await page.$('.page_next') !== null) { //second pages

          let galnextHTML = await page.evaluate(() => document.body.innerHTML);
          let nx = cheerio.load(galnextHTML);
          let nextPiece = nx('.page_next a').attr('href');

          await page.goto("https://www.pornhub.com"+nextPiece, {timeout: 0});
          //await page.waitForNavigation({ waitUntil: 'networkidle0'});
          let gal2HTML = await page.evaluate(() => document.body.innerHTML);
          let $ = cheerio.load(gal2HTML);
          $('.photoAlbumListContainer div a').each(function(i, element) {
            let p = $(this).attr('href');
            imgs.push("https://www.pornhub.com"+p);
          });
        }

        for (var img in imgs) {

          await page.goto(imgs[img], {timeout: 0});
          await page.waitFor('.centerImage');
          let picHTML = await page.evaluate(() => document.body.innerHTML);
          let $ = cheerio.load(picHTML);

          $('#photoImageSection img').each(function(i, element) {
            let d = $(this).attr('src');
            request(d).pipe(fs.createWriteStream('pronhub/tr/h/sc_'+fp+'_'+gallery+'_'+img+'.jpg'));
            console.log(fp+'_'+gallery+'_'+img);
          });


          await delay(2000);
        }


        await delay(3000);

      }
    }
};

getLinks();
