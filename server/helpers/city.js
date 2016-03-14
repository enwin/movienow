var slug = require( 'slug' );
module.exports.sanitize = function( city ){
  var slugged = slug( city );
  if( slugged.indexOf( 'quebec' ) >= 0 ){
    city = 'quebec city';
  }

  return city;
};
