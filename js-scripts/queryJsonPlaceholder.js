// Testing to see if I can make API calls on a site that has CSP headers. However,
// this certain site does not have those headers on their error page, so by creating
// an iframe on the document root with the error page we can make an api call to another
// service, maybe?

// Old-school callback hell being forced upon me rn
function fetchTodos(callback) {
  fetch('https://jsonplaceholder.typicode.com/todos')
    .then(response => response.json())
    .then(callback)
}

