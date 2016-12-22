const config = require( '../config' ),
      fs = require( 'fs' ),
      path = require( 'path' ),
      yaml = require('js-yaml'),
      _ = require( 'lodash' );

const contents = fs.readFileSync( config.root + '/server/locales/site.yaml', 'utf8' ),
    jadeConf = yaml.load( contents );

function getLang( req ){
  const lang = jadeConf.defaultLang;

  let locale;

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

  const langConf = Object.assign( {}, jadeConf ),
        files = fs.readdirSync( config.root + '/server/locales/' + req.session.lang );

  let conf,
      isYAML;

    files.forEach( file => {

      isYAML = path.extname( file ) === '.yaml' || path.extname( file ) === '.yml';

      if ( isYAML ) {
        conf = yaml.load( fs.readFileSync( config.root + '/server/locales/' + req.session.lang + '/' + file, 'utf8' ) );
        Object.assign( langConf, conf );
      }

    });

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
