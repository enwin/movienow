'use strict';

let config = require( './config' ),
    PiwikTracker = require('piwik-tracker'),
    piwik = new PiwikTracker( 1, config.trackerUrl );

// Optional: Respond to tracking errors
piwik.on( 'error', err => {
  console.error( 'error tracking request: ', err );
} );

module.exports.send = ( req, res, next ) => {
  piwik.track( {
    url: req.url,
    ua: req.get( 'user-agent' )
  } );

  next();
};
