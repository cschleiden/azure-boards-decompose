var path = require("path");
var webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    target: "web",
    entry: {
        registration: "./src/app.ts",
        dialog: "./src/dialog.tsx"
    },
    output: {
        filename: "src/[name].js",
        libraryTarget: "amd"
    },
    externals: [
        /^VSS\/.*/, /^TFS\/.*/
    ],
    resolve: {
        extensions: [
            "",
            ".webpack.js",
            ".web.js",
            ".ts",
            ".tsx",
            ".js"],        
        root: [
            path.resolve("./src")
        ]
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.s?css$/,
                loaders: ["style", "css", "sass"]
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

/*

        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        */