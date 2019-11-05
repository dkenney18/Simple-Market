const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DotenvPlugin = require('webpack-dotenv-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const path = require('path');

const outputDirectory = 'dist';

module.exports = {
	entry: ['babel-polyfill', './src/home.js'],
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: 'bundle.js'
  },
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
				  {
					loader: MiniCssExtractPlugin.loader,
					options: {
					  // you can specify a publicPath here
					  // by default it uses publicPath in webpackOptions.output
					  publicPath: './',
					  hmr: process.env.NODE_ENV === 'development',
					},
				  },
				  'css-loader',
				],
			  },
			{
		        test: /\.js$/,
		        exclude: /(node_modules|bower_components)/,
		        use: {
			        loader: 'babel-loader',
			        options: {
				        presets: ['env']
					}
				}
			}
		]
	},
	plugins: [
		new MiniCssExtractPlugin({
			// Options similar to the same options in webpackOptions.output
			// all options are optional
			filename: '[name].css',
			chunkFilename: '[id].css',
			ignoreOrder: false, // Enable to remove warnings about conflicting order
		  }),
	    new DotenvPlugin({
			sample: './.env.default',
			path: './.env'
	    }),
	    new BrowserSyncPlugin({
	        host: 'localhost',
	        port: 3001,
	        proxy: 'http://localhost:3000/',
	        files: ['./views/*.hbs']
		}),
	],
	watch: true,
	devtool: 'source-map'
};