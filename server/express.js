/* global module: true */

var compress = require( 'compression' ),
    logger = require( 'morgan' ),
    bodyParser = require( 'body-parser' ),
    files = require( 'serve-static' ),
    session = require( 'express-session' ),
    MongoStore = require('connect-mongo')(session),
    expires = require( 'connect-expires' ),
    stylus = require( 'stylus' ),
    chouchenn = require( 'chouchenn' ),
    autoprefixer = require( 'autoprefixer-stylus' ),
    browserify = require( 'browserify-middleware' ),
    path = require( 'path' );

module.exports = function( app, config ){

  app.set( 'etag', false );

  app.disable( 'x-powered-by' );

  app.set( 'showStackError', config.dev ? false : true );

  app.use( session( {
    resave: true,
    saveUninitialized: true,
    secret: config.secret,
    store: new MongoStore( {
      url: config.db
    } )
  } ) );

  // should be placed before express.static
  app.use( compress( {
    filter: function (req, res ){
      if( req.headers[ 'x-no-compression' ] ){
        // don't compress responses with this request header
        return false;
      }

      // fallback to standard filter function
      return compress.filter(req, res);
    },
    level: 9
  } ) );

  app.use( expires( {
    pattern: /png|media/,
    duration: 1000 * 60 * 60 * 24 * 183
  } ) );

  //app.use( favicon( 'www/medias/icons/favicon.ico' ) );

  // parse application/x-www-form-urlencoded
  app.use( bodyParser.urlencoded( { extended: false } ) );

  // parse application/json
  app.use( bodyParser.json() );

  //stylus
  app.use( stylus.middleware( {
    src: function( filepath ){
      return [ config.styles, '/', path.basename( filepath, '.css' ), '.styl' ].join('');
    },
    dest: config.files,
    compile: function( str, path ){
       return stylus( str )
         .set( 'filename', path )
         .set( 'compress', config.dev ? false : true )
         .set('sourcemap', config.dev ? {
            'inline': true
          } : false )
         .use( chouchenn() )
         .import( 'chouchenn' )
         .use( autoprefixer( { browsers: [ 'last 2 versions' ] } ) );
    }
  } ) );

  // browserify
  browserify.settings( { 'transform': [ 'babelify', 'jadeify' ] } );

  app.use( '/app.js', browserify( 'script/app.js' ) );

  // setup root folder
  app.use( files( config.files, {
    'index': '/',
    'etag': false
  } ) );

  if( config.dev ){
    app.use( logger( 'dev' ) );

    var browserSync = require( 'browser-sync' ),
        bs = browserSync( {
          logSnippet: false,
          ui: false,
          notify: false,
          ghostMode: false
        } );

    app.use( require( 'connect-browser-sync' )( bs ) );

    bs.watch( [ 'page/**/*.jade', 'script/**/*.js' ] ).on( 'change', bs.reload );

    bs.watch( 'style/**/*.styl', function ( event, file ) {
      if (event === "change") {
        bs.reload( "*.css" );
      }
    } );
  }

  app.set( 'views', config.pages );
  app.set( 'view engine', 'jade' );

  app.locals.pretty = true;

};
