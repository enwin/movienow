var imdb = require( './server/helpers/imdb' );

// imdb( 'Les espiègles' )
//   .then( data => console.log( data.id, data.title ) )
//   .catch( console.log );

// imdb( 'Jambon, Jambon' )
//   .then( data => console.log( data.id, data.title ) )
//   .catch( console.log );

// imdb( 'Zoomania' )
//   .then( data => console.log( data.id, data.title ) )
//   .catch( console.log );

// imdb( 'Zoomania (OV)' )
//   .then( data => console.log( data.id, data.title ) )
//   .catch( console.log );

// imdb( 'Dieumerci!' )
//   .then( data => console.log( data.id, data.title ) )
//   .catch( console.log );

imdb( 'Birnenkuchen mit Lavendel (OmU)' )
  .then( data => console.log( data.id, data.title, !!data.poster ) )
  .catch( console.log );
