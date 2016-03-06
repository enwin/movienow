'use-strict'

import Screen from './screen';
import view from '../../page/view/home.jade';
import bind from '../helper/bind';
import router from '../module/router';
import preload from '../helper/preload';

import _shuffle from 'lodash/shuffle';

var posters = [
  '/media/dyn/home/batmanvsuperman.jpg',
  '/media/dyn/home/highrise.jpg',
  '/media/dyn/home/midnightspecial.jpg',
  '/media/dyn/home/deadpool.jpg',
  '/media/dyn/home/brooklyn.jpg'
];

class Home extends Screen {

  bind (){
    bind( this.el, 'submit', 'form', this.handleSearch.bind( this ) );
    bind( this.el, 'click', '.button-around', this.handleLocation.bind( this ) );
  }

  dom (){
    return {
      tagName: 'div',
      className: 'screen screen-home'
    };
  }

  hidden (){
    // only switch posters when the posters are loaded
    if( this.datas.posters.length ){
      // get the next poster by removing it from the posters array
      var nextPoster = this.datas.posters.splice( 0, 1 )[ 0 ];

      // refill the poster array if empty
      if( !this.datas.posters.length ){
        // shuffle it first
        this.datas.posters = _shuffle( this.datas.loadedPosters );
      }
      // display poster
      this.setPoster( nextPoster );
    }
  }

  handleLocation (){
    // fake result
    router.navigate( {}, '', '/theaters' );
  }

  handleSearch (e){
    e.preventDefault();
    var action = e.currentTarget.getAttribute( 'action' ),
        search = e.currentTarget[ 0 ].value;

    // clean the search
    e.currentTarget.reset();

    router.navigate( {}, '', `${action}?filter=${search}` );
  }

  initialize (){
    this.setTitle( '' );
    this.bind();
    this.render();
    this.loadPoster();
  }

  loadPoster (){
    var posterPromises = preload( posters );

    this.datas.posters = [];
    this.datas.loadedPosters = [];

    posterPromises.forEach( poster => {
      poster
        .then( this.posterLoaded.bind( this ) );
    } );
  }

  posterLoaded ( poster ){

    if( this.datas.currentPoster && this.datas.currentPoster !== poster ){
      this.datas.posters.push( poster );
    }

    this.datas.loadedPosters.push( poster );

    if( !this.datas.currentPoster ){
      this.setPoster(poster);
    }
  }

  render (){
    this.el.innerHTML = view( this.datas );
    this.els = {
      poster: this.el.querySelector( '.home-poster' )
    };
  }

  setPoster ( url ){
    this.datas.currentPoster = url;

    //this.els.poster.style.backgroundImage = `url( ${url} )`;
    this.els.poster.innerHTML = `<img src="${url}" alt="" >`;

    if( this.els.poster.classList.contains( 'show' ) ){
      return;
    }

    window.requestAnimationFrame( () => {
      this.els.poster.classList.add( 'show' );
    } );
  }
}



export default ( ...args ) => {
  return new Home( args );
};
