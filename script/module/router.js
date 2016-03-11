import Route from 'route-parser';

// data
import '../data/favorites';

// view
import Favorites from '../view/favorites';
import Theaters from '../view/theaters';
import Theater from '../view/theater';
import Movies from '../view/movies';
import Around from '../view/around';
import Movie from '../view/movie';
import Home from '../view/home';
import menu from '../view/menu';
import body from '../view/body';

class Router {
  constructor ( args ){

    if( args.routes ){
      this._setRoutes( args.routes );
    }

    this._popEvent = window.addEventListener( 'popstate', ( e ) => this._handleRoute( e ) );

    if( this.initialize ){
      this.initialize();
    }
  }

  _handleRoute ( e ){
    var match,
        matched;

    if( e && e.target.location.pathname === this.currentPathname ){
      return;
    }

    this.currentPathname = window.location.pathname;

    matched = this._routes.some( route => {
      match = route[0].match( window.location.pathname+window.location.search );
      if( match ){
        if( this.routeMatched ){
          this.routeMatched( route[2], match );
        }
        route[ 1 ].call( this, match );
        return true;
      }
    } );
  }

  _setRoutes ( routes ){
    var callback;
    this._routes = [];
    for( let route in routes ){
      callback = this[ routes[ route ] ];

      if( !callback ){
        continue;
      }

      this._routes.push( [ new Route( route ), callback, routes[ route ] ] );
    }
  }

  navigate ( state, title, url, replace ){
    window.history[ replace ? 'replaceState' : 'pushState' ]( state, title, url );
    this._handleRoute();
  }

  start (){
    this._handleRoute();
  }
}

//theater.match( window.location.pathname );


class Routes extends Router  {

  initialize (){

    this.screens = {
      theaters: {},
      movies: {},
      home: null,
      current: null,
      favorites: null
    };

    this.screens.around = new Around();
  }

  routeMatched ( routeName, params ){
    body.handleSiteHeader( 'home' !== routeName );
  }

  theaters ( params ){
    //menu.setCurrent( 'theaters', params );

    params.id = params.id || '/';

    // store the new screen in the screen object
    if( !this.screens.theaters[ params.id ] ){
      if( params.id === '/' ){
        this.screens.theaters[ params.id ] = new Theaters( params );
      }
      else{
        this.screens.theaters[ params.id ] = new Theater( params );
      }
    }

    // diplay the screen if not the current screen
    if( this.screens.current !== this.screens.theaters[ params.id ] ){
      // remove the current screen
      if( this.screens.current ){
        this.screens.current.remove();
      }
      // set the next screen as current
      this.screens.current = this.screens.theaters[ params.id ];
    }

    // show the next screen
    this.screens.theaters[ params.id ].show( params );

  }

  movies ( params ){
    //menu.setCurrent( 'movies', params );

    params.id = params.id || '/';

    // store the new screen in the screen object
    if( !this.screens.movies[ params.id ] ){
      if( params.id === '/' ){
        this.screens.movies[ params.id ] = new Movies( params );
      }
      else{
        this.screens.movies[ params.id ] = new Movie( params );
      }
    }

    // diplay the screen if not the current screen
    if( this.screens.current !== this.screens.movies[ params.id ] ){
      // remove the current screen
      if( this.screens.current ){
        this.screens.current.remove();
      }
      // set the next screen as current
      this.screens.current = this.screens.movies[ params.id ];
    }

    // show the next screen
    this.screens.movies[ params.id ].show( params );

  }

  home (params){
    //menu.setCurrent( 'home' );

    if( !this.screens.home ){
      this.screens.home = new Home( params );
    }
    if( this.screens.current !== this.screens.home ){
      // remove the current screen
      if( this.screens.current ){
        this.screens.current.remove();
      }

      // show the next screen
      this.screens.home.show( params );
      // set the next screen as current
      this.screens.current = this.screens.home;
    }
  }

  around (params){
    //menu.setCurrent( 'around' );

    if( !this.screens.around ){
      this.screens.around = new Around( params );
    }
    if( this.screens.current !== this.screens.around ){
      // remove the current screen
      if( this.screens.current ){
        this.screens.current.remove();
      }

      // show the next screen
      this.screens.around.show( params );
      // set the next screen as current
      this.screens.current = this.screens.around;
    }
  }

  favorites (params){
    //menu.setCurrent( 'favorites' );

    if( !this.screens.favorites ){
      this.screens.favorites = new Favorites( params );
    }
    if( this.screens.current !== this.screens.favorites ){
      // remove the current screen
      if( this.screens.current ){
        this.screens.current.remove();
      }

      // set the next screen as current
      this.screens.current = this.screens.favorites;
    }
    // show the next screen
    this.screens.favorites.show( params );
  }
}

export default new Routes( {
  routes: {
    '/theaters(/:id)(?filter=:filter)(?search=:search)': 'theaters',
    '/movies(/:id)(?filter=:filter)(?search=:search)': 'movies',
    '/favorites(?filter=:filter)': 'favorites',
    '/around': 'around',
    '/': 'home'
  }
} );
