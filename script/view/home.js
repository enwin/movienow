'use-strict'

import Screen from './screen';
import view from '../../page/view/home.jade';
import bind from '../helper/bind';
import router from '../module/router';
import preload from '../helper/preload';

import _shuffle from 'lodash/shuffle';

// var posters = [
//   // '/media/dyn/home/kubo.jpg',
//   // '/media/dyn/home/suicidesquad1.jpg',
//   // '/media/dyn/home/suicidesquad2.jpg',
//   // '/media/dyn/home/startrekbeyond.jpg',
//   // '/media/dyn/home/ghostbusters.jpg',
//   // '/media/dyn/home/absolutelyfabulous.jpg'
// }
const posters = [
  {
    id: 'tt3748528',
    url: '/media/dyn/home/rogueone.jpg'
  },
  {
    id: 'tt1219827',
    url: '/media/dyn/home/ghostintheshell.jpg'
  },
  {
    id: 'tt3315342',
    url: '/media/dyn/home/logan.jpg'
  },
  {
    id: 'tt0451279',
    url: '/media/dyn/home/wonderwoman.jpg'
  },
  {
    id: 'tt2771200',
    url: '/media/dyn/home/beautyandthebeast.jpg'
  },
  {
    id: 'tt2239822',
    url: '/media/dyn/home/valerian.jpg'
  },
  {
    id: 'tt2543164',
    url: '/media/dyn/home/arrival.jpg'
  },
  {
    id: 'tt3731562',
    url: '/media/dyn/home/kong.jpg'
  }
]

class Home extends Screen {

  bind (){
    bind( this.el, 'submit', 'form', this.handleSearch.bind( this ) );
    //bind( this.el, 'click', '.button-around', this.handleLocation.bind( this ) );
  }

  displayed (){
    this.setTitle( '' );
  }

  dom (){
    return {
      tagName: 'div',
      className: 'screen screen-home'
    };
  }

  hidden (){
    // only switch posters when the posters are loaded
    if( this.data.posters.length ){
      // get the next poster by removing it from the posters array
      var nextPoster = this.data.posters.splice( 0, 1 )[ 0 ];

      // refill the poster array if empty
      if( !this.data.posters.length ){
        // shuffle it first
        this.data.posters = _shuffle( this.data.loadedPosters );
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
    this.bind();
    this.render();
    this.loadPoster();
  }

  loadPoster (){
    var posterPromises = preload( _shuffle( posters ).map( poster => poster.url ) );

    this.data.posters = [];
    this.data.loadedPosters = [];

    posterPromises.forEach( poster => {
      poster
        .then( this.posterLoaded.bind( this ) );
    } );
  }

  posterLoaded ( poster ){

    if( this.data.currentPoster && this.data.currentPoster !== poster ){
      this.data.posters.push( poster );
    }

    this.data.loadedPosters.push( poster );

    if( !this.data.currentPoster ){
      this.setPoster( poster );
    }
  }

  render (){
    this.el.innerHTML = view( this.data );
    this.els = {
      poster: this.el.querySelector( '.home-poster' )
    };
  }

  setPoster ( url ){
    this.data.currentPoster = url;

    const movie = posters.find( poster => poster.url === url );

    //this.els.poster.style.backgroundImage = `url( ${url} )`;
    this.els.poster.innerHTML = `<img src="${url}" alt="" /><a href="/movies/${movie.id}"></a>`;

    if( this.els.poster.classList.contains( 'show' ) ){
      return;
    }

    window.requestAnimationFrame( () => {
      this.els.poster.classList.add( 'show' );
    } );
  }
}



export default ( args ) => {
  return new Home( args );
};
