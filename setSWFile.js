const fs = require( 'fs' ),
      config = require( './server/config' );

const swFile = fs.readFileSync( 'script/sw.js', 'utf8' );
fs.writeFileSync( `${config.files}/sw.js`, `const version = "${config.version}";\n${swFile}`, 'utf8' );
