const compress = require( 'compression' ),
    logger = require( 'morgan' ),
    bodyParser = require( 'body-parser' ),
    files = require( 'serve-static' ),
    session = require( 'express-session' ),
    MongoStore = require('connect-mongo')(session),
    expires = require( 'connect-expires' ),
    stylus = require( 'stylus' ),
    chouchenn = require( 'chouchenn' ),
    autoprefixer = require( 'autoprefixer-stylus' ),
    rollup = require( 'express-middleware-rollup' ),
    babel = require( 'rollup-plugin-babel' ),
    nodeResolve = require( 'rollup-plugin-node-resolve' ),
    commonjs = require( 'rollup-plugin-commonjs' ),
    pug = require( 'rollup-plugin-pug' ),
    path = require( 'path' );

module.exports = function( app, config ){

  app.set( 'etag', false );

  app.disable( 'x-powered-by' );

  app.set( 'showStackError', !config.dev );

  app.use( session( {
    cookie: { secure: !config.dev },
    resave: false,
    saveUninitialized: true,
    secret: config.secret,
    store: new MongoStore( {
      url: config.db
    } )
  } ) );

  if( config.dev ){
    app.use( logger( 'dev' ) );

    var browserSync = require( 'browser-sync' ),
        bs = browserSync( {
          logSnippet: false,
          ui: false,
          notify: false,
          ghostMode: false,
          port: 4001
        } );

    app.use( require( 'connect-browser-sync' )( bs ) );

    bs.watch( [ 'page/**/*.pug', 'script/**/*.js', '!script/sw.js' ] ).on( 'change', bs.reload );

    bs.watch( 'style/**/*.styl', event => {
      if( event === 'change' ){
        bs.reload( '*.css' );
      }
    } );
  }
  else{
    app.set( 'trust proxy', '127.0.0.1' );
  }

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
         .set( 'compress', !config.dev )
         .set('sourcemap', config.dev ? {
            'inline': true
          } : false )
         .use( chouchenn() )
         .import( 'chouchenn' )
         .use( autoprefixer( { browsers: [ 'last 2 versions', 'iOS > 7' ] } ) );
    }
  } ) );

  // dynamic build of js in dev
  if( config.dev ){
    const rollupPlugins = [
      pug( {
        extensions: [ '.pug', '.svg' ]
      } ),
      babel({
        exclude: 'node_modules/**'
      }),
      nodeResolve({
        jsnext: true,
        browser: true
      }),
      commonjs({
        sourceMap: config.dev
      })
    ];

    app.use( rollup( {
      src: './script/',
      dest: './www/',
      root: './',
      rollupOpts: {
        sourceMap: true,
        plugins: rollupPlugins
      },
      bundleExtension: '.js',
      debug: true,
      format: 'iife'
    } ) );
  }

  // setup root folder
  app.use( files( config.files, {
    'index': '/',
    'etag': false
  } ) );

  app.set( 'views', config.pages );
  app.set( 'view engine', 'pug' );

  app.locals.pretty = true;

};
