'use-strict'

import Screen from './screen';
import view from '../../page/view/home.jade';
import bind from '../helper/bind';
import router from '../module/router';
import preload from '../helper/preload';

import _shuffle from 'lodash/shuffle';
import _remove from 'lodash/remove';

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

  displayed (){
    // only switch posters when the posters are loaded
    if( !this.datas.posters.length ){
      return;
    }
    // get the next poster by removing it from the posters array
    var nextPoster = this.datas.posters.splice( 0, 1 )[ 0 ];

    // refill the poster array if empty
    if( !this.datas.posters.length ){
      // shuffle it first
      this.datas.posters = _shuffle( posters );
    }
    // display poster
    this.setPoster( nextPoster );
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
    var posterPromises = preload( posters )

    this.datas.posters = [];

    // posterPromises.forEach( poster => {
    //   poster
    //     .then( url => {
    //       this.datas.posters.push( url );
    //     } )
    //     .catch( e => {} );
    // } );

    // use race to display the first poster loaded
    Promise.race( posterPromises )
      .then( this.setPoster.bind( this ) );

    // once all poster loaded
    Promise.all( posterPromises )
      .then( this.posterLoaded.bind( this ) )
      .catch( e => console.log( e, this.datas.posters ) );
  }

  posterLoaded ( loadedPosters ){
    // once posters are loaded
    this.datas.posters = _shuffle( loadedPosters );
    // remove the current poster from the array
    if( this.datas.currentPoster ){
      _remove( this.datas.posters, poster => poster === this.datas.currentPoster );
    }
    // if no posters are loaded
    else{
      this.displayed();
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

    this.els.poster.style.backgroundImage = `url( ${url} )`;

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
