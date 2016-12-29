//navigator.serviceWorker.register('/sw.js');
import './helper/classlist';
import 'babel-polyfill';
import 'whatwg-fetch';
import moment from 'moment';
import fc from 'fastclick';
import bind from './helper/bind';

moment.relativeTimeThreshold('s', 59);
moment.relativeTimeThreshold('m', 59);

import './view/layer';
import './view/menu';

import router from './module/router';

bind( document.body, 'click', 'a[href^="/"]', ( e ) => {
  e.preventDefault();
  router.navigate( {}, '', e.currentTarget.getAttribute( 'href' ) );
} );

fc( document.body );

router.start();
