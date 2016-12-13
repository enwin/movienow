var schema = { location: {'city': { 'long': true }, 'country': {'short': true}, 'zip': {'short': true} } };

class User {
  constructor (){
    this.data = {};
    this.validateUserObject( JSON.parse( window.localStorage.getItem( 'user' ) )  );
  }

  get location (){
    return this.isReady ? this.data.location : false;
  }

  set location ( location ){
    this.data.location = location;
    this.isReady = true;
    this.save();
  }

  get ready (){
    return this.isReady;
  }

  save (){
    window.localStorage.setItem( 'user', JSON.stringify( this.data ) );
  }

  validateUserObject ( user ){

    if( !user ){
      this.isReady = false;
      return;
    }

    const locationOk = user && Object.keys( schema.location ).every( location => {
      return user.location[ location ] && Object.keys( schema.location[ location ] ).every( type => {
        return user.location[ location ][ type ];
      } );
    } );

    if( locationOk ){
      this.location = user.location;
    }

    this.isReady = locationOk;

  }
}

export default new User();
