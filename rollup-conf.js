import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pug from 'rollup-plugin-pug';
import uglify from 'rollup-plugin-uglify';

const plugins = [
  pug( {
    extensions: [ '.pug', '.svg' ]
  } ),
  babel({
    exclude: 'node_modules/**'
  }),
  nodeResolve({ jsnext: true }),
  commonjs(),
  uglify()
];

export default {
  input: './script/app.js',
  plugins: plugins,
  output: {
    format: 'iife'
  }
};
