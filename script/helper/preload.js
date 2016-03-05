/**
 * preload images
 * @param  {array} url contains images source to load
 * @return {array} of Promises for each loading image
 */
function load( url ){

  return url.map( function( url ){
    return new Promise( (resolve, reject) => {

      var img = new Image();
      img.addEventListener( 'load', () => {
        resolve( url );
      } );

      img.addEventListener( 'error', e => {
        reject( new Error( `Failed to load ${e.target.src}` ) );
      } );

      img.src = url;

      if( img.complete ){
        resolve( url );
      }
    } );

  } );
}

export default load;
