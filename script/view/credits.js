'use-strict'

import Screen from './screen';
//import view from '../../page/view/home.jade';

class Credits extends Screen {

  displayed (){
    this.el.style.display = 'block';
    console.log( 'displayed', this.el );
  }

  dom (){
    return {
      el: document.querySelector( '.screen-credits' ),
    };
  }

  hidden (){
    this.el.style.display = '';
    console.log( 'hidden', this.el );
  }


  initialize (){
    console.log( 'in', this.el );
  }

}



export default ( args ) => {
  return new Credits( args );
};
