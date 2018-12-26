import menu from '../view/menu';
import body from '../view/body';

function Cache(){

  function handleState( worker ){
    // console.log( worker.state, worker );
    if( 'redundant' === worker.state ){
      menu.setUpdate();
      body.setUpdate();
    }
  }

  function register(){

    navigator.serviceWorker.register( '/sw.js' )
      .then( registration => {

        const serviceWorker = registration.installing || registration.waiting || registration.active;

        if( serviceWorker ){
          serviceWorker.addEventListener( 'statechange', e => handleState( e.target ) );
        }
      } );
  }

  if ('serviceWorker' in navigator) {
    register();
  }
}

export default new Cache();
