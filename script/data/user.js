class User {
  constructor (){
    this.datas = JSON.parse( window.localStorage.getItem( 'user' ) ) || { location: 'Paris' };

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
      'city': this.datas.location
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