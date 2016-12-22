const path = require('path'),
    rootPath = path.normalize( global.__dirname + '/..'),
    pkg = require( '../package.json' ),
    privateConfig = require( '../privateConfig.json' );

global.process.env.NODE_ENV = global.process.env.NODE_ENV || 'production';

const defaults = {
  'db': 'mongodb://127.0.0.1/movienow',
  'dev': 'development' === global.process.env.NODE_ENV,
  'files': [ rootPath, 'www' ].join('/'),
  'pages': [ rootPath, 'page' ].join('/'),
  'port': 8088,
  'root': rootPath,
  'secret': 'gotta collect them all!',
  'styles': 'style',
  'version': pkg.version
};

const config = Object.assign( privateConfig, defaults );

module.exports = config;
