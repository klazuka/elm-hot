const path = require('path');
const webpack = require('webpack');

module.exports = {
    module: {
        rules: [
            {
                test: /\.html$/,
                exclude: /node_modules/,
                loader: 'file-loader?name=[name].[ext]'
            },
            {
                test: /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],

                use: [
                    {loader: '../../webpack-loader/loader.js'},
                    {
                        loader: 'elm-webpack-loader',
                        options: {
                            cwd: __dirname,
                            debug: false,
                            pathToElm: '../../node_modules/.bin/elm' // TODO [kl] make better
                        }
                    }
                ]
            }
        ]
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],

    mode: 'development',

    devServer: {
        inline: true,
        hot: true,
        stats: 'errors-only'
    }
};
