const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        main: './js/main.js',
        admin: './js/admin.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].[contenthash].js',
        assetModuleFilename: 'assets/[name][ext]',
        publicPath: ''
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: false
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024
                    }
                }
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024
                    }
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
            chunks: ['main'],
            cache: true
        }),
        new HtmlWebpackPlugin({
            template: './admin.html',
            filename: 'admin.html',
            chunks: ['admin'],
            cache: true
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
        }),
        new CopyPlugin({
            patterns: [
                { 
                    from: 'assets',
                    to: 'assets',
                    noErrorOnMissing: true,
                    info: { minimized: true }
                }
            ]
        })
    ],
    optimization: {
        minimize: !isDevelopment,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: {
                        drop_console: !isDevelopment
                    }
                }
            }),
            new CssMinimizerPlugin()
        ],
        removeEmptyChunks: true,
        splitChunks: {
            chunks: 'async',
            minSize: 20000
        },
        runtimeChunk: isDevelopment ? 'single' : false
    },
    devServer: {
        static: {
            directory: path.join(__dirname, '/'),
            watch: {
                ignored: /node_modules/
            }
        },
        hot: true,
        open: true,
        port: 3002,
        historyApiFallback: true,
        compress: true,
        client: {
            overlay: true,
            progress: true
        }
    },
    cache: {
        type: 'filesystem',
        compression: false,
        buildDependencies: {
            config: [__filename]
        },
        name: isDevelopment ? 'development' : 'production',
        maxAge: 5184000000, // 60 days
        version: '1.0'
    },
    snapshot: {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
        immutablePaths: [],
        buildDependencies: {
            hash: true,
            timestamp: true
        }
    },
    experiments: {
        lazyCompilation: isDevelopment
    },
    stats: {
        preset: 'minimal',
        moduleTrace: false,
        errorDetails: true
    },
    watchOptions: {
        ignored: /node_modules/
    },
    performance: {
        hints: false
    }
}; 