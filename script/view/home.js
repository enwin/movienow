'use-strict'

import Screen from './screen';
import view from '../../page/view/home.jade';
import bind from '../helper/bind';
import router from '../module/router';

class Home extends Screen {

  bind (){
    bind( this.el, 'submit', 'form', this.handleSearch.bind( this ) );
    bind( this.el, 'click', 'button.button-action', this.handleLocation.bind( this ) );
  }

  dom (){
    return {
      tagName: 'div',
      className: 'screen screen-home'
    };
  }

  handleLocation (){
    // fake result
    router.navigate( {}, '', '/theaters' );
  }

  handleSearch (e){
    e.preventDefault();
    var action = e.currentTarget.getAttribute( 'action' ),
        search = e.currentTarget[ 0 ].value;

    // clean the search
    e.currentTarget.reset();

    router.navigate( {}, '', `${action}?filter=${search}` );
  }

  initialize (){
    this.setTitle( '' );
    this.bind();
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.datas );
  }
}



export default ( ...args ) => {
  return new Home( args );
};
