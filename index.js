/*
 * Primary file for API
 *
 *
 *
 */

// @TODO: refactor to use ES Modules vs CommonJS

// Dependencies
const http = require('http')
const https = require('https')
const { URL, URLSearchParams } = require('url')
const util = require('util')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')
const _data = require('./lib/data')

// TESTING
// @TODO delete this
_data.create('test', 'newFile', { foo: 'bar' }, (err) => {
  console.log('We have an error: ', err)
})

// Instantiating the http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res, 'http')
})

// Start the server
httpServer.listen(config.httpPort, () => {
  console.log(
    `Listening on ${config.httpPort}. Environment is in ${config.envName} mode`
  )
})

const httpsServerOptions = {
  key: fs.readFileSync('./https/server.key'),
  cert: fs.readFileSync('./https/server.crt')
}

// Instantiate the https server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res, 'https')
})

// Start the https server
httpsServer.listen(config.httpsPort, () => {
  console.log(
    `Listening on ${config.httpsPort}. Environment is in ${config.envName} mode`
  )
})

// make a BaseUrl
const spitBaseUrl = (protocol, host) => `${protocol}://${host}/`

// All the server logic for both the http and https server
const unifiedServer = (req, res, protocol) => {
  // get the url and parse it
  const parsedUrl = new URL(req.url, spitBaseUrl(protocol, req.headers.host))
  console.log(spitBaseUrl(protocol, req.headers.host))
  // get the path
  const path = parsedUrl.pathname

  // trim the path for trailing slashes
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  const queryStringObj = new URLSearchParams(parsedUrl.searchParams)

  // Get the HTTP method
  const method = req.method.toUpperCase()

  // Get the headers as an object
  const headers = req.headers

  // Get the payload if there is any
  const decoder = new StringDecoder('utf-8')

  let buffer = ''

  req.on('data', (data) => {
    buffer += decoder.write(data)
  })

  req.on('end', () => {
    buffer += decoder.end()

    // Choose the handler this request should go to. If one is not found, use the not found handler
    const chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound

    // Construct the data obj to send to the handler
    const data = {
      trimmedPath,
      queryStringObj: Object.fromEntries(queryStringObj),
      method,
      headers,
      payload: buffer
    }

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler or default to 200
      statusCode = typeof statusCode === 'number' ? statusCode : 200

      // Use the payload called back by the handler or default to an empty object
      payload = typeof payload === 'object' ? payload : {}

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload)

      // Return the response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(payloadString)
      // Log the request path
      console.log(`𝌮 Returning this response: ${statusCode}${payloadString}`)
    })
  })
}

// Define handlers
const handlers = {}

// Sample handler
handlers.sample = (data, callback) => {
  // Callback a http status code and a payload object
  callback(406, {
    name: 'sample handler'
  })
}

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404)
}

// Ping handler
handlers.ping = (data, callback) => {
  callback(200, { message: 'pong' })
}

// Define a request router
const router = {
  sample: handlers.sample,
  ping: handlers.ping
}
