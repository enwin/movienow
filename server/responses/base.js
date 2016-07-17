var config = require( '../config' ),
    fs = require( 'fs' ),
    path = require( 'path' ),
    yaml = require('js-yaml'),
    _ = require( 'lodash' );

var contents = fs.readFileSync( config.root + '/server/locales/site.yaml', 'utf8' ),
    jadeConf = yaml.load( contents );

function getLang( req ){
  var lang = jadeConf.defaultLang,
      locale;

  if( jadeConf.baseUrl ){
    locale = _.findKey( jadeConf.baseUrl, function( locale ){
      return locale === lang;
    } );
  }

  req.session.lang = locale || lang;

}

function render( req, res ){
  res.render( 'index', Object.assign( {}, req.app.locals.langs[ req.session.lang ], { user: req.user, config: config } ), ( err, str ) => {
    if( err ){
      console.error( 'jade render error', err );
      res.status( 500 ).end();
      return;
    }

    res.send( str );
  } );
}

function setLang( req ){
  if( req.app.locals.langs && req.app.locals.langs[ req.session.lang ] ){
    return;
  }

  var conf,
      langConf = _.assign( {}, jadeConf ),
      files = fs.readdirSync( config.root + '/server/locales/' + req.session.lang ),
      isYAML;

    _.each( files, function( file ) {

    isYAML = path.extname( file ) === '.yaml' || path.extname( file ) === '.yml';

    if ( isYAML ) {
      conf = yaml.load( fs.readFileSync( config.root + '/server/locales/' + req.session.lang + '/' + file, 'utf8' ) );
      _.merge( langConf, conf );
    }

    });

    // _.each( langConf.url, function( path, name ){
    // langConf.url[ name ] = [ '/', langConf.lang, '/', path ].join('');
    // } );

    if( !req.app.locals.langs ){
      req.app.locals.langs = {};
    }

    req.app.locals.langs[ req.session.lang ] = langConf;

}

module.exports.home = render;

module.exports.lang = ( req, res, next ) => {
  if( !req.session.lang || !req.app.locals.langs ){
    getLang( req );
    setLang( req );
  }
  next();
};

module.exports.theaters = render;

module.exports.movies = render;

module.exports.favorites = render;

module.exports.around = render;

module.exports.credits = render;

// store user city in the session
module.exports.user = function( req, res ){
  req.session.country = req.body.location.country.short.toLowerCase();
  res.end();
};
