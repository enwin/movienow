/* global self: true, caches: true */

import pkg from '../package.json';

function fetchAndCache( req, options ) {

  return fetch( req )
    .then( res => {
      //console.log( res );
      //return res;
      return caches.open( options.cache ).then( cache => {
        return cache.keys().then( keys => {
          if( options.limit ){
            let keysLength = keys.length;
            // limit the cache to the number setted in the limit option
            if( options.limit <= keysLength ){
              let oldKeys = keys.splice( 0, keysLength - options.limit );
              oldKeys.forEach( key => {
                cache.delete( key )
                  .then( () => console.info( `removed ${key.url} from ${options.cache} cache` ) )
                  .catch( err => console.error( err ) );
              } );
            }
          }

          return cache.put( req, res.clone() )
            .then( () => res )
            .catch( err => console.error( err ) );
        } );
      });
    } );
}

// match a poster request
// respond from cache or fetch and cache it
function posters( e ) {
  return caches.match( e.request )
    .then( req => {
      if( !req ){
        return fetchAndCache( e.request, {
          cache: 'posters',
          limit: 50
        } );
      }
      return req;
    } );
}

const routes = {
  '/media/poster/': posters
};

// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = `site-${pkg.version}`,
      siteFiles = [
        '/',
        '/style.css',
        '/app.js',
        '/media/font/ticketing.woff',
        '/media/dyn/city/paris.jpg'
      ];

self.addEventListener('install', e => {
  console.log( 'install', Date() );
  // once the SW is installed, go ahead and fetch the resources
  // to make this work offline
  e.waitUntil(
    caches.open( cacheName )
      .then( cache => {
        return cache.addAll( siteFiles )
        .then(() => self.skipWaiting());
      })
  );
});

self.addEventListener('activate', function activator (event) {
  console.log( 'activate', event );
  caches.keys().then( keys => {
    return Promise.all( keys
        .filter( key => {
          return key.indexOf( 'site' ) === 0 && key !== cacheName;
        } )
        .map( key => {
          console.log( 'delete cache', key );
          return caches.delete( key );
        } )
      );
  } );
} );

// when the browser fetches a url, either response with
// the cached object or go ahead and fetch the actual url
self.addEventListener( 'fetch', e => {
  let req = e.request,
      url = new URL( req.url );

  // loop over each route keys to find a match
  let matchedRoute = Object.keys( routes ).find( route => {
    return url.pathname.indexOf( route ) >= 0;
  } );


  e.respondWith( matchedRoute ? routes[ matchedRoute ]( e ) : fetch( e.request ) );
  // e.respondWith( fetch( e.request ) );
});
