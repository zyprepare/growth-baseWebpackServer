## 功能 
可以启动一个本地服务器，支持本地proxy和mock。<br>
命令行中包含proxy，则启用代理功能，命令行中包含mock，则启用模拟数据功能。

## 安装

``` bash
npm i -D base-webpack-server
```

## 使用示例

``` code
const baseWebpackServer = require('base-webpack-server')
const webpackConfig = require('本地webpack配置文件路径')
// 代理配置
const proxyTable = require('代理配置文件路径')
// mock配置
const mockTable = require('mock配置文件路径')

baseWebpackServer(webpackConfig, {
  port: 3000,
  autoOpenBrowser: true,
  proxy: {
    config: {
      target: '代理的域名',
    },
    proxyTable
  },
  mock: {
    mockTable
  }
})
```
