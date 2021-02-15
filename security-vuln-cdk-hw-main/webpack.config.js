const path = require('path')
const fs = require('fs')
const nodeBuiltins = require('builtin-modules')

const lambdaDir = 'lib/lambdas'
const lambdaNames = fs.readdirSync(path.join(__dirname, lambdaDir))

const entry = lambdaNames.reduce((entryMap, lambdaName) => {
  entryMap[lambdaName] = [
    path.join(__dirname, lambdaDir, `${lambdaName}/index.ts`)
  ]
  return entryMap
}, {})

const externals = ['aws-sdk']
  .concat(nodeBuiltins)
  .reduce((externalsMap, moduleName) => {
    externalsMap[moduleName] = moduleName
    return externalsMap
  }, {})

module.exports = {
  resolve: {
    alias: {
      '@services': path.resolve(__dirname, 'lib/services')
    },
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  entry,
  externals,
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name]/index.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: 'ts-loader'
      }
    ]
  }
}
