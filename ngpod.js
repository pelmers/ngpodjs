#!/usr/bin/env node

var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    args = require('flagman')({
        '--download': {
            'description': "Download the image we find to given path and print the resulting path."
        },
        '--verbose': {
            'validOptions': [],
            'description': "Print extra information during execution."
        }
    }, {
        description: "ngpodjs finds or downloads today's National Geographic Photo."
    }),
    srcURL = "http://photography.nationalgeographic.com/photography/photo-of-the-day/";

/**
 * Log message if verbose is true.
 */
function verboseMessage(message) {
    if (args.verbose)
        console.log(message);
}

/**
 * Find the src of today's photo, then call callback(src).
 */
function findPhotoURL(callback) {
    request(srcURL, function(error, response, html) {
        if (error) {
            console.log(error);
            return;
        }
        var $ = cheerio.load(html);
        verboseMessage("Got front page, getting photo src...");
        callback("http:"+$(".primary_photo > a:nth-child(1) > img:nth-child(1)").attr('src'));
    });
}

/**
 * Download the contents of URL and save to current working directory.
 * Return string representing path of the saved image.
 * Call callback(path) once the file is downloaded.
 */
function downloadURL(url, folder, callback) {
    var filename = /[^\/]*$/.exec(url);
    if (filename !== null)
        filename = filename[0];
    else
        filename = "download";
    verboseMessage("Found picture filename: " + filename);
    var fullpath = path.join(folder, filename);
    fs.exists(fullpath, function(exists) {
        if (!exists) {
            verboseMessage("Downloading " + url + " to " + fullpath + "...");
            request(url).on('response', function(response) {
                var writer = fs.createWriteStream(fullpath);
                response.pipe(writer, { end: false });
                response.on('end', function() {
                    writer.end();
                    callback(fullpath);
                });
            });
            request(url).pipe(fs.createWriteStream(fullpath));
        } else {
            verboseMessage(fullpath + " exists, skipping download...");
            callback(fullpath);
        }
    });
}

/**
 * Main entry point.
 */
function main() {
    findPhotoURL(function(src) {
        if (args.download)
            downloadURL(src, args.download, console.log);
        else
            console.log(src);
    });
}

if (args)
    main();
