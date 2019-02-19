'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');

var cors = require('cors');
var app = express();
app.use(cors());

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (err) => {
	console.log('error: ' + err);
	console.log('connecting');
});
mongoose.connection.on('connected', function(){console.log('connected');});
mongoose.connection.on('error', function(){console.log('error');});
mongoose.connection.on('disconnected', function(){console.log('disconnected');});

var Schema = mongoose.Schema;

let linkSchema = new Schema({
	original_url: String,
	short_url: {type: String,
		unique: true}
	});

let Link = mongoose.model('Link', linkSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
	res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
	res.json({greeting: 'hello API'});
});


app.post("/api/shorturl/new", function (req, res) {
	let original_url = req.body.url;
	console.log(original_url);
	
	let pattern = /(http)(s){0,1}:\/\//;
	original_url = original_url.replace(pattern,'');
	console.log(original_url);
	
	dns.lookup(original_url, (err, address, family) => {
		if(err){
			res.json({"error":"invalid URL"});
			return;
		}
		
		Link.count((err, numberOfDocsInDB)=> {

			if(!err){
				let newLink = new Link({
					original_url: original_url,
					short_url: numberOfDocsInDB+1
				});
				newLink.save((err, data) => {
					if(err) {
						console.log(err);
					} else{
						console.log(data);
						res.json({"original_url":data.original_url,"short_url":data.short_url});
					}
				});
			} else {
				console.log(err);
			}

		});
	});
});

app.get("/api/shorturl/:short_url", function (req, res) {
	
	let url = req.params.short_url;  
	console.log(url);
	
	Link.findOne({short_url: url}, (err, data)=>{
		if(err){
			console.log(err);
			res.json({"error":"invalid URL"});
			return;
		}
		console.log(data);
		
		let urlFromDB = data.original_url;
		console.log(urlFromDB);
		if(urlFromDB){
			res.redirect('http://' + data.original_url);
		}
		
		
	});
	
});


app.listen(port, function () {
	console.log('Node.js listening ...');
});