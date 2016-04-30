var defaults = { location: {'city': {'long':'Paris', 'slug': 'paris' }, 'country': {'long': 'France', 'slug': 'france'} } };

class User {
  constructor (){
    this.data = JSON.parse( window.localStorage.getItem( 'user' ) ) || defaults;

    // clean previous user schema
    if( !this.data || !this.data.location ){
      this.data = defaults;
      this.save();
    }

    this.setSession();
  }

  get location (){
    return this.data.location;
  }

  set location ( city ){
    this.data.location = city;
    this.save();
    this.setSession();
  }

  save (){
    window.localStorage.setItem( 'user', JSON.stringify( this.data ) );
  }

  setSession (){
    var datas = {
      'location': this.data.location
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
