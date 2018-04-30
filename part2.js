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
var async=require("async");
var express = require('express')

var app = express();
app.set('view engine', 'ejs');
app.listen(8080);

app.get('/I/want/title', function(req, res) {
    async.waterfall([
        function getQueryParamFunc(callback){
            var params = url.parse(req.url, true).query;
            if(!params.address){
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>This route expects a list of websites addresses in query string format e.g : /I/want/title?address=http://yahoo.com</h1></body></html>');
                return;
            }

            callback(null, params);
        },
        function requestForAddresses(queryParams,callback){
            var titles=[];
            var count=Object.keys(queryParams.address).length;
            if(typeof queryParams.address ==='string'){
                count=1;
            }
            if(count>1){
                queryParams.address.forEach(function(address) {
                    request(address, function(error, response, body) {
                        if(error){
                            titles.push(error.message);
                            if(titles.length==count)
                                callback(null,titles);

                        }
                        else{
                            var $ = cheerio.load(body);
                            var title = $("title");
                            titles.push(title.html());

                            if(titles.length==count)
                                callback(null,titles);
                        }
                    })
                }, this);//end of forEach
            }//end of if
            else{
                request(queryParams.address, function(error, response, body) {
                    if(error){
                        titles.push(error.message);
                        if(titles.length==count)
                            callback(null,titles);

                    }
                    else{
                        var $ = cheerio.load(body);
                        var title = $("title");
                        console.log(title.html());
                        titles.push(title.html());

                        if(titles.length==count)
                            callback(null,titles);
                    }
                })
            }

        },
        function renderHtml(titles,callback){
            fs.readFile('./index.html', 'utf8', function(error, data) {
                jsdom.env(data, [], function (errors, window) {
                    var $ = require('jquery')(window);
                    titles.forEach(function(element) {
                        $("ul").append('<li>'+element+'</li>');
                    },this);
                    callback(null, window.document.documentElement.outerHTML);


                });
            });
        }
    ]);
});
var hostname = 'localhost';
var port = 8080;
var server = http.createServer(function(req, res){
});
server.listen(port, hostname, function(){
    console.log("Server running at : http://"+ hostname +":"+port);
});