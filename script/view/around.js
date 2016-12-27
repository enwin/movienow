import user from '../data/user';

import layer from './layer';

import Screen from './screen';
import view from '../../page/view/around.pug';
import domList from '../../page/view/around-list.pug';
import bind from '../helper/bind';
import loader from '../module/loader';
import Tablist from '../helper/accedeweb-tablist';

import router from '../module/router';

class Around extends Screen {

  bind (){

    bind( this.el, 'click', '.button-location', this.handleLocation.bind( this ) );
    bind( document.body, 'click', '.layer .button-location', this.handleLocationLayer.bind( this ) );
    bind( document.body, 'submit', '.layer-location form', this.handleLocationLayer.bind( this ) );
  }

  displayed (){
    if( this.data.movies && !this.tabs ){
      this.setTabs();
    }
    else if( !this.data.movies ){

      // geolocation is not allowed for the website
      if( this.data.geoError && this.data.geoError.code === 1 ){
        return;
      }

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
      .then( this.ready.bind( this ) );
  }

  geoError ( e ){
    loader.hide();
    this.data.geoError = {
      code: e.code,
      message: e.message
    };

    this.els.list.innerHTML = this.errorDom( {
      title: 'Aw Snap!',
      text: e.code === 1 ? 'Movienow! is not allowed to access<br>your location.' : e.message,
      icon: 'geolocation',
      type: 'error'
    } );
  }

  getLocation (){
    // display loader
    // loader will be hidden by the sync resolution
    loader.show( !document.getElementById( 'locationDialog' ).hasAttribute( 'aria-hidden' ) && document.getElementById( 'locationDialog' ) );

    return new Promise( ( resolve, reject ) => {
      navigator.geolocation.getCurrentPosition( resolve, reject, {
        // test
        timeout: 10000,
        // 5 minutes
        maximumAge: ( 60000 * 5 ),
        enableHighAccuracy: true
      } );
    } );
  }

  handleLocation (){

    // geolocation is not allowed for the website
    if( this.data.geoError && this.data.geoError.code === 1 ){
      return;
    }

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
        .then( data => {
          if( data ){
            this.ready( data );
            form.reset();
            if( !this.data.polite ){
              router.navigate( {}, '', '/' );
              layer.show( 'menu' );
            }
            else{
              delete this.data.polite;
              layer.close();
            }
          }
        } );
    }
    else{
      this.getLocation()
        .then( e => {
          this.fetchTheaters( e )
            .then( () => {
              if( !this.data.polite ){
                router.navigate( {}, '', '/around' );
              }
              else{
                delete this.data.polite;
              }
              layer.close();
            } );
        } );
    }
  }

  initialize (){
    this.setTitle( 'Around me' );
    this.bind();

    this.render();

  }

  polite (){
    this.data.polite = true;
    return new Promise( ( resolve ) => {
      this.els.layerTitle.innerHTML = this.els.layerTitle.getAttribute( 'data-polite' );
      this.els.layer.classList.add( 'setup' );
      layer.show( this.els.layer.id, () => {
        this.els.layerTitle.innerHTML = this.els.layerTitle.getAttribute( 'data-title' );
        this.els.layer.classList.remove( 'setup' );
        resolve();
      } );

    } );
  }

  ready (){

    user.location = this.data.geo;

    this.renderLists();
  }

  render (){
    this.el.innerHTML = view( this.data );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      layer: document.getElementById( 'locationDialog' ),
      layerTitle: document.getElementById( 'dialogLocationTitle' )
    };

  }

  renderLists (){
    this.els.list.innerHTML = domList( this.data );

    if( this.data.screenParams.visible ){
      this.setTabs();
    }
  }

  setTabs (){
    this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ), {
      openTab: this.scrollTop
    } );
  }

  scrollTop (){
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }
}

export default ( args ) => {
  return new Around( args );
};
