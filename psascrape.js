const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const leftpad = require('left-pad');
const mysql = require('mysql');
const connection = require('./psamacdb');

//  let logStream = fs.createWriteStream("PSAlogALLpart28.txt", {'flags': 'a'});
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getRandom(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function maybe() {

var refreshID;
let go = 28500000;
let increment = 1000000;
let j = go - increment / 2;
let je = go + increment / 2;
//let rate = 2500;
let cut = 10;

let getsql = 'SELECT DISTINCT Field1 FROM psa.psa WHERE Field1 BETWEEN ' + j + ' AND ' + je + ';';
let getquery = connection.query(getsql, (err, result) => {
  if (err) {
    console.log(8888)
  };
  //console.log(result[0].Field1);
  //console.log(result.length);
  var finished = [];
  for (let t = 0; t < result.length - 1; t++) {
    finished.push(result[t].Field1);
  }

  //FILL ALL ARRAY TO LENGTH
  var all = [];
  for (var r = j; r < je; r++) {
    all.push(r);
  }
  //console.log(all);
  var a = [];
  var missing = [];
  //FILL MISSING
  for (var x = 0; x < finished.length; x++) {
    a[finished[x]] = true;
  }
  for (var x = 0; x < all.length; x++) {
    if (a[all[x]]) {
      delete a[all[x]];
    } else {
      a[all[x]] = true;
    }
  }
  for (var k in a) {
    missing.push(Number(k));
  }


  missing.push(9999999999);
  //console.log(arr);
  //console.log(arr.length);
  //console.log(arr);
  let n = 0;
  let nend = missing.length - 1;
  let nstart = Math.floor(nend / 2);
  let nthis = Math.floor(nend / 2);

  var grouping = [];
  var temp = [];
  missing.forEach(function(elem, index) {
    if (elem > missing[index - 1] + 1) {
      grouping.push(temp);
      temp = [];
    }
    temp.push(elem);
  })
  //filter groups to cut

  var groups = grouping.length;
  //console.log(grouping);

  grouping.sort(function(a, b) {
    return a.length - b.length;
  });
  grouping = grouping.filter(function(element) {
    return element.length > cut; /////////////////////////////////////////////////////////////////////////////////////////////////////////
  });
  grouping = shuffle(grouping);

  missing = [].concat.apply([], grouping);



  let rate = getRandom(1500, 4000);
  console.log('missing length: ' + missing.length + ', rate: ' + rate);
  refreshID = setInterval(function() {
    //cut down MISSING
    // into groups
    //console.log(missing);





    let paddedID = leftpad(missing[nthis], 8, "0");

    rp("https://www.psacard.com/cert/" + paddedID + "/PSA")

      .then((html) => {

        let $ = cheerio.load(html);
        var record = [];

        $('.cert-grid-value').each(function(i, element) {
          let b = $(this);
          if (b.text().startsWith('\n')) {

          } else {
            let a = $(this);
            record.push(a.text());
          }
        });

        if (record.length > 0 && typeof record !== 'undefined') {
          console.log(paddedID);
          //console.log('' + record[0] + '  ' + (missing.length - n) + '');
          if (record[4].includes('TCG')) {
            console.log(record);
          }

          let post = {
            Field1: record[0],
            Field2: record[1],
            Field3: record[2],
            Field4: record[3],
            Field5: record[4],
            Field6: record[5],
            Field7: record[6],
            Field8: record[7],
            Field9: record[8]
          }
          let sql = 'INSERT INTO psa.psa SET ?';
          let query = connection.query(sql, post, (err, result) => {
            if (err) {
              console.log(9999)
            }
          })
        } else {
          console.log(paddedID+'<----');
          let post = {
            Field1: missing[nthis],
            Field2: '',
            Field3: '',
            Field4: '',
            Field5: '',
            Field6: '',
            Field7: '',
            Field8: '',
            Field9: ''
          }
          let sql = 'INSERT INTO psa.psa SET ?';
          let query = connection.query(sql, post, (err, result) => {
            if (err) {
              console.log(9999)
            }
          })
        }
        //.catch(console.error.bind(console));

        if (nthis == nstart && (typeof record == 'undefined' || record.length == 0)) {
          console.log('ON TO THE NEXT');
          clearInterval(refreshID);
          maybe();
        } else if (nthis < nend && nthis >= nstart && record.length > 0 && typeof record !== 'undefined') {
          nthis++;
        } else if ((nthis == nend && record.length > 0 && typeof record !== 'undefined') || (nthis > nstart && (record.length == 0 || typeof record == 'undefined'))) {
          nthis = nstart - 1;
        } else if (nthis < nstart && nthis > n && record.length > 0 && typeof record !== 'undefined') {
          nthis--;
        } else if (nthis == n || (nthis < nstart && (record.length == 0 || typeof record == 'undefined'))) {
          console.log('ON TO THE NEXT');
          clearInterval(refreshID);
          maybe();
        }

        if (missing.length == 0) {
          console.log('NIGGA YOU DONE');
          clearInterval(refreshID);
          process.exit();
        }

      })
      .catch(function (err) {
        console.log('err');
        clearInterval(refreshID);
        setTimeout(function(){
          maybe();
        }, 150000);
      });



  }, rate) //INTERVAL 1000/SEC

});

};

maybe();
