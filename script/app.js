//navigator.serviceWorker.register('/sw.js');

import 'whatwg-fetch';
import moment from 'moment';
import bind from './helper/bind';

moment.relativeTimeThreshold('s', 59);
moment.relativeTimeThreshold('m', 59);

import router from './module/router';


bind( document.body, 'click', 'a[href^="/"]', ( e ) => {
  e.preventDefault();
  router.navigate( {}, document.title, e.currentTarget.getAttribute( 'href' ) );
} );