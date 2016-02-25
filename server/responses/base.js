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

module.exports.home = function( req, res ){
  //console.log( req.session.jadeConf );
  //projects.format( {}, function( projects ){
  res.render( 'index', _.assign( {}, req.app.locals.langs[ req.session.lang ], { user: req.user, config: config } ) );
  //} );

};

module.exports.lang = function( req, res, next ){
  //console.log( req.session.lang );
  if( !req.session.lang || !req.app.locals.langs ){
    getLang( req );
    setLang( req );
  }
  next();
};

module.exports.theaters = function( req, res ){
  res.render( 'index', _.assign( {}, req.app.locals.langs[ req.session.lang ], { user: req.user, config: config } ) );
};

module.exports.movies = function( req, res ){
  res.render( 'index', _.assign( {}, req.app.locals.langs[ req.session.lang ], { user: req.user, config: config } ) );
};