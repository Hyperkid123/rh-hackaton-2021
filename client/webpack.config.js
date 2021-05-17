const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const copyPLugin = new CopyPlugin({
  patterns: [{
    from: './assets',
    to: './build/assets'
  }]
})

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'build'),
    publicPath: './assets'
  },
  devServer: {
    contentBase: "./build"
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'GAME',
      template: './index.html'
    }),
    copyPLugin
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
  },
};