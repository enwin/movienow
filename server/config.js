/* global module: true, __dirname: true */

var path = require('path'),
    _ = require( 'lodash' ),
    rootPath = path.normalize( __dirname + '/..'),
    pkg = require( '../package.json' ),
    config;

var defaults = {
  'db': 'mongodb://127.0.0.1/movienow',
  'files': [ rootPath, 'www' ].join('/'),
  'pages': [ rootPath, 'page' ].join('/'),
  'port': 8088,
  'root': rootPath,
  'secret': 'gotta collect them all!',
  'styles': 'style',
  'version': pkg.version
};

config = _.assign( {}, defaults );

module.exports = config;
