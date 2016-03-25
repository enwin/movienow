'use-strict'

import user from '../data/user';

import layer from './layer';

import Screen from './screen';
import view from '../../page/view/around.jade';
import domList from '../../page/view/around-list.jade';
import bind from '../helper/bind';
import loader from '../module/loader';
import Tablist from '../helper/accedeweb-tablist';

import router from '../module/router';

class Around extends Screen {

  bind (){

    bind( this.el, 'click', '[role=tab]', e => {
      this.tabs.tabAction( e );
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    } );
    bind( this.el, 'focus', '[role=tab]', e => {
      this.tabs.tabFocus( e );
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }, true );
    bind( this.el, 'keydown', '[role=tab]', e => this.tabs && this.tabs.tabKey( e ) );
    bind( this.el, 'focus', '[role=tabpanel]', e => this.tabs && this.tabs.panelFocus( e ), true );
    bind( this.el, 'keydown', '[role=tabpanel]', e => this.tabs && this.tabs.panelKey( e ) );

    bind( this.el, 'click', '.button-location', this.handleLocation.bind( this ) );
    bind( document.body, 'click', '.layer .button-location', this.handleLocationLayer.bind( this ) );
    bind( document.body, 'submit', '.layer-location form', this.handleLocationLayer.bind( this ) );
  }

  displayed (){
    if( this.datas.movies && !this.tabs ){
      this.setTabs();
    }
    else if( !this.datas.movies ){
      this.getLocation()
        .then( this.fetchTheaters.bind( this ) )
        .catch( this.geoError.bind( this ) );
    }
  }

  dom() {
    return {
      tagName: 'section',
      id: 'around',
      className: 'screen screen-around screen-list'
    };
  }

  fetchTheaters ( e ){

    return this.sync( '/api/aroundme', {
      headers: {
        'x-movienow-coords': JSON.stringify( [ e.coords.latitude, e.coords.longitude ] )
      }
    } )
      .then( this.ready.bind( this ) )
      .catch( console.log );
  }

  geoError ( e ){
    loader.hide();
  }

  getLocation (){
    // display loader
    // loader will be hidden by the sync resolution
    loader.show();

    return new Promise( ( resolve, reject ) => {
      navigator.geolocation.getCurrentPosition( resolve, reject, {
        // test
        timeout: 10000,
        // 5 minutes
        maximumAge: ( 60000 * 5 )
      } );
    } );
  }

  handleLocation (){

    this.els.list.innerHTML = '';

    this.getLocation()
      .then( this.fetchTheaters.bind( this ) )
      .catch( this.geoError.bind( this ) );
  }

  handleLocationLayer ( e ){
    e.preventDefault();
    var form = e.currentTarget;

    if( form.location ){
      if( document.activeElement && this.els.layer.contains( document.activeElement ) ){
        document.activeElement.blur();
      }

      this.sync( '/api/aroundme', {
        headers: {
          'x-movienow-location': form.location.value.trim()
        }
      } )
        .then( this.ready.bind( this ) )
        .then( () => {
          form.reset();
          router.navigate( {}, '', '/' );
          layer.show( 'menu' );
        } )
        .catch( console.log );
    }
    else{
      this.getLocation()
        .then( e => {
          this.fetchTheaters( e )
            .then( () => {
              router.navigate( {}, '', '/around' );
              layer.close();
            } );
        } );
    }
  }

  initialize (){
    this.setTitle( 'Around me' );
    this.bind();

    this.render();

    //this.getLocation();

  }

  ready (){

    user.location = this.datas.geo;

    this.renderLists();
  }

  render (){
    this.el.innerHTML = view( this.datas );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      layer: document.getElementById( 'locationDialog' )
    };

  }

  renderLists (){
    this.els.list.innerHTML = domList( this.datas );

    if( this.datas.screenParams.visible ){
      this.setTabs();
    }
  }

  setTabs (){
    this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ) );
  }
}

export default ( args ) => {
  return new Around( args );
};
