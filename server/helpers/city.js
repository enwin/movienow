const slug = require( 'slug' );

module.exports.sanitize = function( city ){
  const slugged = slug( city );

  if( slugged.indexOf( 'quebec' ) >= 0 ){
    city = 'quebec city';
  }

  return city;
};
