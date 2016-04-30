'use-strict'

import Screen from './screen';
//import view from '../../page/view/home.jade';

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

}



export default ( args ) => {
  return new Credits( args );
};
