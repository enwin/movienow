function delegate( root, event, selector, callback, capture ){

  function Event( src ){

    // Event object
    if ( src && src.type ) {
      this.originalEvent = src;
      this.type = src.type;

      // Events bubbling up the document may have been marked as prevented
      // by a handler lower down the tree; reflect the correct value.
      this.isDefaultPrevented = src.defaultPrevented ||
          src.defaultPrevented === undefined &&

          // Support: Android<4.0
          src.returnValue === false ? true : false;

    // Event type
    } else {
      this.type = src;
    }

    for( var key in src ){
      if( key === key.toUpperCase() || 'function' === typeof src[key] ) {
        continue;
      }
      this[ key ] = src[ key ];
    }
  }

  Event.prototype = {
    constructor: Event,
    isDefaultPrevented: false,
    isPropagationStopped: false,
    isImmediatePropagationStopped: false,

    preventDefault: function() {
      var e = this.originalEvent;

      this.isDefaultPrevented = true;

      if ( e ) {
        e.preventDefault();
      }
    },
    stopPropagation: function() {
      var e = this.originalEvent;

      this.isPropagationStopped = true;

      if ( e ) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function() {
      var e = this.originalEvent;

      this.isImmediatePropagationStopped = true;

      if ( e ) {
        e.stopImmediatePropagation();
      }

      this.stopPropagation();
    }
  };

  function fixEvent( event, extend ){
    // Create a writable copy of the event object
    var originalEvent = event;
    event = new Event( originalEvent );

    // Support: Safari 6-8+
    // Target should not be a text node (#504, #13143)
    if ( event.target.nodeType === 3 ) {
      event.target = event.target.parentNode;
    }

    for( var key in extend ){
      event[ key ] = extend[ key ];
    }

    return event;
  }


  (function( root, event, selector, callback, capture ){
    var delegate;

    if( 'string' === typeof selector ){
      delegate = true;
    }
    else{
      capture = callback;
      callback = selector;
    }

    root.addEventListener( event, function( e ){

      if( !delegate ){
        callback( fixEvent( e, {currentTarget: e.currentTarget} ) );
        return;
      }

      var match = document.querySelectorAll( selector ),
          eLength = match.length,
          index = 0;

      while( index < eLength ){
        if( e.target === match[index] || match[index].contains( e.target ) ){
          callback( fixEvent( e, {currentTarget: match[ index ]} ) );
          break;
        }
        index++;
      }

    }, capture );
  })( root, event, selector, callback, capture );
}

export default delegate;
