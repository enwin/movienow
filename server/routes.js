const config = require( './config' );
const response = require( './responses/base' );
const showtimes = require( './responses/api' );
const media = require( './responses/media' );
const { celebrate, Joi } = require( 'celebrate' );
const escapeHtml = require('escape-html');

const validateId = {
  params: Joi.object().keys({
    id: Joi.string().alphanum().optional()
  } )
};

const validateAPI = {
  params: Joi.object().keys({
    country: Joi.string().length( 2 ).required(),
    zip: Joi.string().required(),
    id: Joi.string().alphanum().optional(),
  }),
  query: Joi.object().keys({
    day: Joi.string().length( 10 ).required()
  })
};

const validateAround = {
  query: Joi.object().keys({
    day: Joi.string().length( 10 ).required()
  })
};

function handleJoiError(){
  return (err, req, res, next) => {
    if (err.isJoi) {
      const error = {
        statusCode: 400,
        error: 'Bad Request'
      };

      if( config.dev ){
        error.message = err.message;
        error.validation = {
          source: err._meta.source,
          keys: []
        };

        if (err.details) {
          for (var i = 0; i < err.details.length; i++) {
            error.validation.keys.push( escapeHtml(err.details[i].path));
          }
        }
      }

      return res.status(400).send(error);
    }

    // If this isn't a Joi error, send it to the next error handler
    return next(err);
  };
}


module.exports = function( app ){

  // set session jade vars
  app.use( response.lang );


  // home
  app.get( '/', response.home );
  app.get( '/favorites', response.favorites );
  app.get( '/theaters/:id?', celebrate( validateId ), response.theaters );
  app.get( '/movies/:id?', celebrate( validateId ), response.movies );
  app.get( '/around', response.around );
  app.get( '/credits', response.credits );

  app.use( '/api/:type/:country/*', showtimes.cache );

  app.get( '/api/theaters/:country/:zip/:id?', celebrate( validateAPI ), showtimes.theaters );
  app.get( '/api/movies/:country/:zip/:id?', celebrate( validateAPI ), showtimes.movies );
  app.get( '/api/aroundme', celebrate( validateAround ), showtimes.around );

  app.get( '/media/poster/:id', media.poster );

  // handle Joi Error
  app.use( handleJoiError() );
};
