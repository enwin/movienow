// import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pug from 'rollup-plugin-pug';
import { terser } from "rollup-plugin-terser";

const plugins = [
  pug( {
    extensions: [ '.pug', '.svg' ]
  } ),
  nodeResolve(),
  commonjs(),
  // babel(),
  terser()
];

export default {
  input: './script/app.js',
  plugins: plugins,
  output: {
    format: 'iife'
  }
};
