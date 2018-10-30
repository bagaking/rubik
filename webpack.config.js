const path = require('path');

module.exports = {
    entry: {
        rubik : './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    devtool: 'inline-module-source-map', // inline-source-map eval-source-map cheap-module-source-map
};