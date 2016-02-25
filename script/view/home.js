'use-strict'

import Screen from './screen';
import view from '../../page/view/home.jade';

class Home extends Screen {

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-home'
    }
  }

  initialize (){
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.datas );
  }
}



export default ( ...args ) => {
  return new Home( args );
};
