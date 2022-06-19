// Testing to see if I can make API calls on a site that has CSP headers. However,
// this certain site does not have those headers on their error page, so by creating
// an iframe on the document root with this source we can make an api call to another
// service, maybe?
fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => response.json())
  .then(json => console.log(json))
