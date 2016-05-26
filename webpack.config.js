var webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    target: "web",
    entry: "./src/app.ts",
    output: {
        filename: "src/bundle.js",
        libraryTarget: "amd"
    },    
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [
            "",
            ".webpack.js",
            ".web.js",
            ".ts",
            ".tsx",
            ".js"],
        alias: {
            "VSS": "../node_modules/vss-web-extension-sdk/lib/VSS.SDK"
        }
    },
    module: {
        loaders: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "libs/VSS.SDK.min.js" },
            { from: "./src/*.html", to: "/" },
            { from: "./marketplace", to: "marketplace" },
            { from: "./vss-extension.json", to: "vss-extension-release.json" }
        ])
    ]
}