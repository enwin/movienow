'use-strict'

import Screen from './screen';
import view from '../../page/view/theaters.jade';

class Home extends Screen {

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-theaters'
    };
  }

  initialize (){
    this.getData();

    this.render();
  }

  getData (){
    this.sync( '/api/theaters' )
      .then( () => this.ready() )
      .catch( e => console.log( e ) );
  }

  parse (datas){
    return this.datas = {
      theaters: datas
    };
  }

  ready (){
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.datas );
  }
}



export default ( ...args ) => {
  return new Home( args );
};
