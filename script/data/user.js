var defaults = { location: {'city': {'long':'Paris', 'slug': 'paris' } } };

class User {
  constructor (){
    this.datas = JSON.parse( window.localStorage.getItem( 'user' ) ) || defaults;

    // clean previous user schema
    if( !this.datas.location.city ){
      this.datas = defaults;
      this.save();
    }

    this.setSession();
  }

  get location (){
    return this.datas.location;
  }

  set location ( city ){
    this.datas.location = city;
    this.save();
    this.setSession();
  }

  save (){
    window.localStorage.setItem( 'user', JSON.stringify( this.datas ) );
  }

  setSession (){
    var datas = {
      'location': this.datas.location
    };

    window.fetch( '/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( datas ),
      credentials: 'same-origin'
    } );
  }
}

export default new User();
