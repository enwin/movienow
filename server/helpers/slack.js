const Slack = require( 'slack-node' ),
      config = require( '../config' ),
      slack = new Slack(),
      errorKeys = [ 'stack', 'code', 'errno', 'syscall' ];

slack.setWebhook( config.slackHook );

//proxy console.error to send slack message
( function( error ){
  console.error = function(){
    const params = {
      username: 'console.error',
      attachments: []
    };

    Array.prototype.forEach.call( arguments, ( arg, index ) => {

      if( !index && 'string' === typeof( arg ) ){
        params.text = arg;
      }
      else if( arg.statusCode ){
        params.attachments.push( {
          color: 'danger',
          fields: [{
            title: 'statusCode',
            value: arg.statusCode
          }, {
            title: 'uri',
            value: arg.options.uri
          }]
        } );
      }
      else if( arg.name ){
        params.text = arg.name;
        params.attachments.push( {
          color: 'danger',
          fields: errorKeys.map( key => {
            return {
              title: key,
              value: arg[key]
            };
          } ).filter( entry => entry.value )
        } );
      }
      else{
        params.attachments.push( {
          text: 'string' === typeof( arg ) ? arg : JSON.stringify( arg, null, 2 ),
          color: 'danger'
        } );
      }
    } );

    if( !config.dev ){
      slack.webhook( params, () => {} );
    }

    return error.apply( this, arguments );
  };


} )( console.error );


module.exports = slack;
