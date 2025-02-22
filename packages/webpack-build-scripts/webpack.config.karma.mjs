/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 */

// @ts-check

import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import { createRequire } from "node:module";
import { cwd } from "node:process";
import webpack from "webpack";

import { sassNodeModulesLoadPaths } from "@blueprintjs/node-build-scripts";

// import.meta.resolve is still experimental under a CLI flag, so we create a require fn instead
// see https://nodejs.org/docs/latest-v18.x/api/esm.html#importmetaresolvespecifier-parent
const require = createRequire(import.meta.url);

/**
 * This differs significantly from the base webpack config, so we don't even end up extending from it.
 */
export default {
    bail: true,
    context: cwd(),
    devtool: "inline-source-map",
    mode: "development",

    resolve: {
        extensions: [".css", ".js", ".ts", ".tsx"],
        fallback: {
            assert: require.resolve("assert/"),
            buffer: false,
            stream: require.resolve("stream-browserify"),
        },
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                use: require.resolve("source-map-loader"),
            },
            {
                test: /\.tsx?$/,
                loader: require.resolve("swc-loader"),
                options: {
                    jsc: {
                        parser: {
                            decorators: true,
                            dynamicImport: true,
                            syntax: "typescript",
                            tsx: true,
                        },
                        // this is important for istanbul comment flags to work correctly
                        preserveAllComments: true,
                        transform: {
                            legacyDecorator: true,
                            react: {
                                refresh: false,
                            },
                        },
                    },
                    module: {
                        type: "commonjs",
                    },
                },
            },
            {
                test: /\.css$/,
                use: [require.resolve("style-loader"), require.resolve("css-loader")],
            },
            {
                enforce: "post",
                test: /src\/.*\.tsx?$/,
                loader: require.resolve("istanbul-instrumenter-loader"),
                options: {
                    esModules: true,
                },
            },
            {
                // allow some custom styles to be written for tests (sometimes just for debugging purposes)
                test: /\.scss$/,
                use: [
                    require.resolve("style-loader"),
                    require.resolve("css-loader"),
                    {
                        loader: require.resolve("sass-loader"),
                        options: {
                            sassOptions: {
                                includePaths: sassNodeModulesLoadPaths,
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(eot|ttf|woff|woff2|svg|png)$/,
                type: "asset/resource",
                generator: {
                    filename: "assets/[hash][ext][query]",
                },
            },
        ],
    },

    plugins: [
        // Karma requires process.env to be defined
        new webpack.ProvidePlugin({
            process: "process/browser.js",
        }),

        new webpack.DefinePlugin({
            NODE_ENV: JSON.stringify("test"),
        }),

        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: "test/tsconfig.json",
            },
        }),
    ],
};
