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
var RSVP=require("rsvp");
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
    var getTitles = function(queryParams) {
        var promise = new RSVP.Promise(function(resolve, reject){
            var titles=[];
            var count=Object.keys(queryParams.address).length;
            if(typeof queryParams.address ==='string'){
                count=1;
            }
            console.log("count of items: " +count);
            if(count>1){
                queryParams.address.forEach(function(address) {
                    console.log(address);
                    request(address, function(error, response, body) {
                        if(error){
                            titles.push(error.message);
                            if(titles.length==count)
                                resolve(titles);
                        }
                        else{
                            var $ = cheerio.load(body);
                            var title = $("title");
                            console.log(title.html());
                            titles.push(title.html());

                            if(titles.length==count)
                                resolve(titles);
                        }
                    })
                }, this);//end of forEach
            }//end of if
            else{
                request(queryParams.address, function(error, response, body) {
                    if(error){
                        titles.push(error.message);
                        if(titles.length==count)
                            resolve(titles);

                    }
                    else{
                        var $ = cheerio.load(body);
                        var title = $("title");
                        titles.push(title.html());
                        if(titles.length==count)
                            resolve(titles);
                    }
                })
            }
        });
        return promise;
    };
    var renderHtml = function(titles) {
        var promise = new RSVP.Promise(function(resolve, reject){
            console.log(titles);
            fs.readFile('./index.html', 'utf8', function(error, data) {
                if(error){
                    reject("Error : "+error);
                }
                jsdom.env(data, [], function (errors, window) {
                    var $ = require('jquery')(window);
                    for(var i=0;i<titles.length;i++)
                        $("ul").append('<li>'+titles[i]+'</li>');
                    resolve(window.document.documentElement.outerHTML);
                });

            });

        });
        return promise;
    };
    getTitles(params).then(function(titles) {
        return renderHtml(titles);
    }).then(function(renderHtmlvalue){
        res.writeHeader(200, {"Content-Type": "text/html"});
        res.write(renderHtmlvalue);
        res.end();
    }).catch(function(error) {
        // handle errors
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('Something wrong with the Promise: ' + error.message);
    });

});
var hostname = 'localhost';
var port = 8080;
var server = http.createServer(function(req, res){
});
server.listen(port, hostname, function(){
    console.log("Server running at : http://"+ hostname +":"+port);
});
