'use-strict'

import user from '../data/user';

import Screen from './screen';
import view from '../../page/view/around.jade';
import domList from '../../page/view/around-list.jade';
import bind from '../helper/bind';
import loader from '../module/loader';
import Tablist from '../helper/accedeweb-tablist';

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

    bind( document.body, 'click', '.button-location', this.handleLocation.bind( this ) );
    bind( document.body, 'submit', '.layer-location form', this.handleLocationForm.bind( this ) );
  }

  displayed (){
    if( this.datas.movies && !this.tabs ){
      this.setTabs();
    }
    else if( !this.datas.movies ){
      this.getLocation();
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

    this.updateSearchForm( `${e.coords.latitude}, ${e.coords.longitude}` );

    this.sync( '/api/aroundme', {
      headers: {
        'x-movienow-coords': JSON.stringify( [ e.coords.latitude, e.coords.longitude ] )
      }
    } )
      .then( this.ready.bind( this ) )
      .catch( e => console.log( e ) );
  }

  geoError ( e ){
    console.log( e );
    loader.hide();
  }

  getLocation (){

    this.updateSearchForm( 'Getting your location' );

    loader.show();

    navigator.geolocation.getCurrentPosition( this.fetchTheaters.bind( this ), this.geoError.bind( this ), {
      // test
      enableHighAccuracy: true,
      timeout: 10000,
      // 5 minutes
      maximumAge: ( 60000 * 5 )
    } );
  }

  handleLocation (){

    this.els.list.innerHTML = '';

    this.getLocation();
  }

  handleLocationForm ( e ){
    e.preventDefault();
    var form = e.currentTarget;

    this.sync( '/api/aroundme', {
      headers: {
        'x-movienow-location': form.location.value.trim()
      }
    } )
      .then( this.ready.bind( this ) )
      .catch( e => console.log( e ) );
  }

  initialize (){
    this.setTitle( 'Around me' );
    this.bind();

    this.render();

    //this.getLocation();

  }

  ready (){

    user.location = this.datas.city;

    this.renderLists();

    if( this.datas.screenParams.visible ){
      this.setTabs();
    }
  }

  render (){
    this.el.innerHTML = view( this.datas );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      search: this.el.querySelector( '#locationSearch' )
    };

  }

  renderLists (){
    this.els.list.innerHTML = domList( this.datas );
  }

  setTabs (){
    this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ) );
  }

  updateSearchForm ( string ){
    this.els.search.value = string;
  }
}

export default ( args ) => {
  return new Around( args );
};
