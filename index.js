/*
 * Primary file for API
 *
 *
 *
 */

// @TODO: refactor to use ES Modules vs CommonJS

// Dependencies
const http = require('http')
const { URL, URLSearchParams } = require('url')
const util = require('util')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')

// Server should respond to all requests with a string
const server = http.createServer((req, res) => {
  // get the url and parse it
  const parsedUrl = new URL(req.url, 'http://localhost:3000')

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
})

// Start the server
server.listen(config.port, () => {
  console.log(
    `Listening on ${config.port}. Environment is in ${config.envName} mode`
  )
})

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

// Define a request router
const router = {
  sample: handlers.sample
}
