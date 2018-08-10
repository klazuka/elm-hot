var path = require('path');

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
                        // once elm-webpack-loader supports Elm 0.19, we can change this to "elm-webpack-loader"
                        // https://github.com/elm-community/elm-webpack-loader/pull/142
                        // TODO [kl] stop using an absolute path on my machine
                        loader: '/Users/keith/dev/elm-webpack-loader/index.js',
                        options: {
                            debug: false,
                            pathToElm: '/Users/keith/bin/elm-19' // TODO [kl] bad
                        }
                    }
                ]
            }
        ]
    },

    devServer: {
        inline: true,
        stats: 'errors-only'
    }
};
