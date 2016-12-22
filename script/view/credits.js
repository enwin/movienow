'use-strict'

import Screen from './screen';
//import view from '../../page/view/home.pug';

class Credits extends Screen {

  displayed (){
    this.el.style.display = 'block';
  }

  dom (){
    return {
      el: document.querySelector( '.screen-credits' ),
    };
  }

  hidden (){
    this.el.style.display = '';
  }

  initialize (){
    this.setTitle( 'Credits' );
  }

}



export default ( args ) => {
  return new Credits( args );
};
