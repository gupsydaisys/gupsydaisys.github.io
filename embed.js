<!-- code embedded in url https://cdn.tryretool.com/embed.js -->

window.retool = window.retool || {}
;(function() {
  if (window.retool.apiLoaded) {
    return
  }
  window.retool.apiLoaded = true

  function setUrlParameter(url, key, value) {
    var parts = url.split('#', 2)
    var anchor = parts.length > 1 ? '#' + parts[1] : ''
    var query = (url = parts[0]).split('?', 2)
    if (query.length === 1) return url + '?' + key + '=' + value + anchor

    for (var params = query[query.length - 1].split('&'), i = 0; i < params.length; i++) {
      if (params[i].toLowerCase().startsWith(key.toLowerCase() + '=')) {
        params[i] = key + '=' + value
        query[query.length - 1] = params.join('&')
        return query.join('?') + anchor
      }
    }

    return url + '&' + key + '=' + value + anchor
  }

  var elementWatchers = {}

  function createOrReplaceWatcher(iframe, selector, pageName, queryId) {
    var watcherId = pageName + '-' + queryId
    elementWatchers[watcherId] = {
      iframe: iframe,
      selector: selector,
      pageName: pageName,
      queryId: queryId,
      prevValue: null,
    }
  }

  function startWatchers() {
    var watcherKeys = Object.keys(elementWatchers)
    for (var i = 0; i < watcherKeys.length; i++) {
      var key = watcherKeys[i]
      var watcher = elementWatchers[key]
      var selector = watcher.selector
      var node = document.querySelector(selector)
      var value = node.textContent
      if (value !== watcher.prevValue) {
        watcher.prevValue = value
        watcher.iframe.contentWindow.postMessage(
          {
            type: 'PARENT_WINDOW_RESULT',
            result: value,
            id: watcher.queryId,
            pageName: watcher.pageName,
          },
          '*',
        )
      }
    }

    setTimeout(startWatchers, 1000)
  }

  function RetoolDashboard(container, url, name) {
    var iframe = document.createElement('iframe')
    this.container = container
    this.url = url

    this.iframe = iframe
    this.iframe.frameBorder = 0
    this.iframe.setAttribute('src', setUrlParameter(url, 'id', name))
    this.container.appendChild(this.iframe)
    iframe.style = 'height: 100%; width: 100%'

    window.addEventListener('message', function(e) {
      console.log('Received message from iframe', e)
      var node

      if (e.data.type === 'PARENT_WINDOW_QUERY') {
        node = document.querySelector(e.data.selector)
        createOrReplaceWatcher(iframe, e.data.selector, e.data.pageName, e.data.id)
        iframe.contentWindow.postMessage(
          {
            type: 'PARENT_WINDOW_RESULT',
            result: node.textContent,
            id: e.data.id,
            pageName: e.data.pageName,
          },
          '*',
        )
      }
      if (e.data.type === 'PARENT_WINDOW_PREVIEW_QUERY') {
        console.log('posting to iframe')
        node = document.querySelector(e.data.selector)
        iframe.contentWindow.postMessage(
          {
            type: 'PARENT_WINDOW_PREVIEW_RESULT',
            result: node.textContent,
            id: e.data.id,
          },
          '*',
        )
      }
    })
  }

  startWatchers()

  window.retool.RetoolDashboard = RetoolDashboard
})()
