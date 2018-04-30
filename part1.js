/**
 * Created by Faisal on 4/30/2018.
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var queryString = require('querystring');
var url = require('url');
var jsdom = require("jsdom");
var express = require('express')

var app = express();
app.set('view engine', 'ejs');
app.listen(8080);

app.get('/I/want/title', function(req, res) {
    var params = url.parse(req.url, true).query;
    if(!params.address){
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>This route expects a list of websites addresses in query string format e.g : /I/want/title?address=http://yahoo.com</h1></body></html>');
        return;
    }
    var titles=[];
    var paramsCount = 0;

    if(typeof params.address ==='string'){
        paramsCount=1;
    }

    if(paramsCount==1){
        request(params.address, function(error, response, body) {
            if(error){
                titles.push("Response Error <b> "+error.message + "</b>");
                if(titles.length==paramsCount){
                    console.log("Found error"+error.message);
                    renderHtml(titles);
                }
            }
            else{
                var $ = cheerio.load(body);
                var title = $("title");
                console.log(title.html());
                titles.push(title.html());

                if(titles.length==paramsCount){
                    console.log("Success");
                    renderHtml(titles);
                }

            }
        })
    }else if(paramsCount > 1){
        params.address.forEach(function(address) {
            console.log(address);
            request(address, function(error, response, body) {
                if(error){
                    titles.push("Response Error <b>"+error.message+"</b>");
                    if(titles.length==paramsCount){
                        console.log("Error found"+error.message);
                        renderHtml(titles);
                    }
                }else{
                    var $ = cheerio.load(body);
                    var title = $("title");
                    console.log(title.html());
                    titles.push(title.html());

                    if(titles.length==paramsCount){
                        renderHtml(titles);
                    }

                }
            })
        }, this);//end of forEach
    }
    function renderHtml(titles){
        fs.readFile('./index.html', 'utf8', function(error, data) {
            jsdom.env(data, [], function (errors, window) {
                var $ = require('jquery')(window);
                titles.forEach(function(element) {
                    $("ul").append('<li>'+element+'</li>');
                },this);

                res.writeHeader(200, {"Content-Type": "text/html"});
                res.write(window.document.documentElement.outerHTML);
                res.end();
            });
        });
    }
});


var hostname = 'localhost';
var port = 8080;
var server = http.createServer(function(req, res){
});

server.listen(port, hostname, function(){
    console.log("Server running at : http://"+ hostname +":"+port);
});