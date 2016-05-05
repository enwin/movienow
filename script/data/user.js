var defaults = { location: {'city': { 'slug': 'paris' }, 'country': {'short': 'fr'} } };

class User {
  constructor (){
    this.data = JSON.parse( window.localStorage.getItem( 'user' ) ) || defaults;
  }

  get location (){
    return this.data.location;
  }

  set location ( city ){
    this.data.location = city;
    this.data.ready = true;
    this.save();
    this.setSession();
  }

  get ready (){
    return this.data.ready;
  }

  save (){
    window.localStorage.setItem( 'user', JSON.stringify( this.data ) );
  }

  setSession (){
    var datas = {
      'location': this.data.location
    };

    return window.fetch( '/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( datas ),
      credentials: 'same-origin'
    } )
      .then( () => this.save() );
  }
}

export default new User();
