var alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
var base = alphabet.length; // base is the length of the alphabet (58 in this case)

var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/test';
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'URL Shortener' });
});

function isValidUrl(urlPassed) {
  let regEx = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;
  return regEx.test(urlPassed);
}

// utility function to convert base 10 integer to base 58 string
function encode(num) {
  var encoded = '';
  while (num) {
    var remainder = num % base;
    num = Math.floor(num / base);
    encoded = alphabet[remainder].toString() + encoded;
  }
  return encoded;
}

// utility function to convert a base 58 string to base 10 integer
function decode(str) {
  var decoded = 0;
  while (str) {
    var index = alphabet.indexOf(str[0]);
    var power = str.length - 1;
    decoded += index * (Math.pow(base, power));
    str = str.substring(1);
  }
  return decoded;
}

router.get('/delete',function(req,res,next){
  mongo.connect(url,function(err,db){
    db.collection("longUrl").drop(function(err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    db.close();
  });


  });
});

router.get('/favicon.ico', function(req, res) {
    res.sendStatus(204);
});

router.get('/new/*', function (req, res, next) {
  var urlPassed = req.params[0];
  console.log(urlPassed);
  if (!isValidUrl(urlPassed)) {
    res.status(500).json({ error: 'Invalid URL format. Input URL must comply to the following: http(s)://(www.)domain.ext(/)(path)' });
    res.end();
    return;
  }

  //finding in db if already present




  mongo.connect(url, function (err, db) {
    assert.equal(null, err);

    var doc = db.collection('longUrl').findOne({ 'longUrl': urlPassed }).then(function (doc) {
      db.collection('longUrl').count().then(function (numItems) {
        console.log(numItems);
        if (doc == null) {
          console.log("not found");
          console.log(numItems);
          var item = {
            "_id": numItems + 1,
            "longUrl": urlPassed
          };
          var encodedUrl = encode(numItems + 1);
          console.log("encoded url:",encodedUrl);
          console.log("decoded: ",decode("c"));
          db.collection('longUrl').insertOne(item, function (err, result) {
            assert.equal(null, err);
            db.close();
            console.log('Item inserted!');
            res.json({encodedurl:"http://13.127.147.8:8000/"+encodedUrl});
            res.end();
          });
        }
        else {
          console.log(doc);
          
          var encodedId=encode(doc["_id"]);
           res.json({encodedurl:"http://13.127.147.8:8000/"+ encodedId});
            res.end();
        }
      });



    });


  });



});

router.get('/:encoded_id', function (req, res, next) {
  var base58Id = req.params.encoded_id;
  console.log(base58Id);
  var id = decode(base58Id);
  mongo.connect(url,function(err,db){
    assert.equal(null,err);
    db.collection('longUrl').findOne({_id:id}).then(function(doc){
      console.log(doc);
      if(doc==null)
      {
        res.write("This url is not in database !!!");
        res.end();
      }
      else{
        /*res.json(doc);
      res.end();*/
      res.redirect(doc["longUrl"]);
      }
      
    });
  });
  
});

router.get('/get-data', function (req, res, next) {
  var resultArray = [];
  mongo.connect(url, function (err, db) {
    assert.equal(null, err);
    var cursor = db.collection('longUrl').find();
    cursor.forEach(function (doc, err) {
      assert.equal(null, err);
      resultArray.push(doc);
      console.log(doc);
    }, function () {
      db.close();
      /* res.render('index',{items:resultArray});*/

    });
  });
});

router.post('/insert', function (req, res, next) {

});

router.post('/update', function (req, res, next) {

});

router.post('/delete', function (req, res, next) {

});
module.exports = router;
module.exports.encode = encode;
module.exports.decode = decode;
