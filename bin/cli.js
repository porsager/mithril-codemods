#!/usr/bin/env node
/* eslint no-console:"off" */
"use strict";

var path = require("path"),

    meow   = require("meow"),
    execa  = require("execa"),
    globby = require("globby"),
    series = require("promise-map-series"),

    transforms = require("../"),
    
    cli = meow(`
        Usage
        $ mithril-codemods [<file|glob> ...]

        Options
        --run,    -r    Run transforms
    `, {
        boolean : [ "run" ],
        string  : [ "_" ],
        alias   : {
            r : "run",
            h : "help"
        }
    });

if(!cli.input.length) {
    cli.showHelp();

    return;
}

globby(cli.input)
    .then((paths) => series(
        transforms.transforms,
        (transform, idx) => {
            console.log(`${transforms.names[idx]} running`);

            return execa(
                path.resolve(__dirname, "../node_modules/.bin/jscodeshift"),
                [ "-t", transform, cli.flags.run ? "" : "-d" ].concat(paths),
                { stdio : "inherit" }
            )
            .then((result) => console.log(`${result.stdout}\n`))
            .catch(console.error.bind(console));
        }
    ));
