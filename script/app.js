//navigator.serviceWorker.register('/sw.js');
import 'babel-polyfill';
import 'whatwg-fetch';
import moment from 'moment';
import bind from './helper/bind';

moment.relativeTimeThreshold('s', 59);
moment.relativeTimeThreshold('m', 59);

import router from './module/router';

bind( document.body, 'click', 'a[href^="/"]', ( e ) => {
  e.preventDefault();
  router.navigate( {}, '', e.currentTarget.getAttribute( 'href' ) );
} );

router.start();
