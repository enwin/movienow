import _sortBy from 'lodash/sortBy';

class Favorites {
  constructor (){
    this.favorites = JSON.parse( window.localStorage.getItem( 'favorites' ) ) || [];
  }

  _saveFavorites (){
    window.localStorage.setItem( 'favorites', JSON.stringify( this.favorites ) );
  }
  /**
   * add a new theater
   * @param {object} newTheater contains id and name
   */
  add ( newTheater ){
    //datas = _sortBy( datas, (movie) => movie.name.toLowerCase() );

    var theaterExists = this.favorites.find( theater => theater.id === newTheater.id );

    if( theaterExists ){
      return;
    }

    this.favorites.push( newTheater );

    // reorder favorites alphabetically
    this.favorites = _sortBy( this.favorites, theater => theater.name );

    this._saveFavorites();
  }

  /**
   * remove a theater from favorites
   * @param {object} oldTheater contains id and name
   */
  remove ( oldTheater ){
    var theaterIndex = this.favorites.findIndex( theater => theater.id === oldTheater.id );

    if( theaterIndex < 0 ){
      return;
    }

    this.favorites.splice( theaterIndex, 1 );

    this._saveFavorites();
  }

  /**
   * find if theater is favorited
   * @param  {number} theaterId id of the theater
   * @return {boolean}           return true if favorited
   */
  is ( theaterId ){
    return !!this.favorites.find( theater => theater.id === theaterId );
  }

  /**
   * get favorites
   * @return {array} array of favorites
   */
  list (){
    return this.favorites.slice();
  }
}

export default new Favorites();
