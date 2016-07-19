/* global self: true, caches: true */

import pkg from '../package.json';

function api( e ){
  var url = new URL( e.request.url );

  // always hit the network for geolocation
  if( url.pathname === '/api/aroundme' ){
    return fetch( e.request );
  }

  return caches.match( e.request )
    .then( req => {
      if( !req ){
        return fetch( e.request );
      }
      return req;
    } )
    .then( res => {

      if( !res.ok ){
        return res;
      }

      return caches.open( 'api' ).then( cache => {

        cache.keys().then( keys => {
          keys.forEach( key => {
            let apiUrl = new URL( key.url );

            if( apiUrl.pathname === url.pathname && apiUrl.search !== url.search ){
              cache.delete( key )
                .then( () => console.info( `removed ${key.url} from api cache` ) )
                .catch( err => console.error( err ) );
            }
          } );
        } );

        return cache.put( e.request, res.clone() )
          .then( () => res )
          .catch( err => console.error( err ) );
      } );
    } );
}

function fetchAndCache( req, options ) {

  return fetch( req )
    .then( res => {
      //console.log( res );
      if( !res.ok ){
        return res;
      }
      //return res;
      return caches.open( options.cache ).then( cache => {
        return cache.keys().then( keys => {
          if( options.limit ){
            let keysLength = keys.length;
            // limit the cache to the number setted in the limit option
            if( options.limit <= keysLength ){
              let oldKeys = keys.splice( 0, keysLength - options.limit + 1 );
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

function siteCache( e ){
  return caches.match( e.request )
    .then( req => {
      if( !req ){
        return fetch( e.request );
      }
      return req;
    } );
}

const routes = {
  '/media/poster/': posters,
  '/api/': api
};

// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = `site-${pkg.version}`,
      siteFiles = [
        '/',
        '/style.css',
        '/app.js',
        '/media/font/ticketing.woff',
        '/media/dyn/city/paris.jpg',
        'https://analytics.enwin.io/piwik.js'
      ];

self.addEventListener( 'install', e => {
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

self.addEventListener( 'activate', () => {
  console.log( 'activate' );
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

  e.respondWith( matchedRoute ? routes[ matchedRoute ]( e ) : siteCache( e ) );
});
