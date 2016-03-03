class body {
  constructor (){
    this.els = {
      header: document.querySelector( '.site-header' )
    };
  }
  handleSiteHeader ( hide ){
    this.els.header.classList.toggle( 'header-small', hide );
  }
}

export default new body();
