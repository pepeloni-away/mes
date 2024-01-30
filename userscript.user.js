// ==UserScript==
// @name        messier
// @namespace   https://github.com/pepeloni-away
// @author      pploni
// @insert-into page
// @version     2.1
// @description allow mes to fetch anime ids from trackers with stricter apis
// @grant       GM_xmlhttpRequest
// @match       https://pepeloni-away.github.io/mes/*
// @match       http://192.168.0.169:5500/*
// ==/UserScript==
// @run-at      document-start

const additionalPlaceholders = [
  "m/malname",
]
const additionalExternalSearchOptions = [
  "m",
]
placeholders.push(...additionalPlaceholders)
externalSearchOptions.push(...additionalExternalSearchOptions)

// patch fetchAnimelist from search.js
if (!location.pathname.includes('/search')) return     // mind this if you decide to add anything other than functions below
fetchAnimelist = new Proxy(fetchAnimelist, {
  apply(target, thisArg, args) {
    const mode = args[0]
    const name = args[1]

    const caption = document.querySelector('caption > p.tracker_info')

    if (mode === 'm') {
      return fetchMalList(name, caption)
    }

    return Reflect.apply(...arguments)
  }
})
// end search.js patch

function fetchMalList(name, infoElement = null, offset = 0, allIds = []) {
  const cookies = localStorage.getItem('malCookie')
  const status = 2
  const url = `https://myanimelist.net/animelist/${name}/load.json?status=${status}&offset=${offset}`
  const headers = {
    // "Cookie": "MALSESSIONID=m4f43sdsfaf4g42g2naf6quuq7; MALHLOGSESSID=8a31a4543a680ba5112b6d8daa62263a",
    "Host": "myanimelist.net",
    "Referer": `https://myanimelist.net/animelist/${name}/load.json?status=${status}`,
  }

  if (cookies) {
    const c = JSON.parse(cookies)
    headers["Cookie"] = `MALSESSIONID=${c.c1}; MALHLOGSESSID=${c.c2}`
  }

  GM_xmlhttpRequest({
    url: url,
    headers: headers,
    onload: handleMalResponse
  })

  function handleMalResponse(responseObject) {
    if (responseObject.responseHeaders.includes('MALSESSIONID')) {
      console.log('setting mal cookie, shouldn\'t see this more than once')
      infoElement && (infoElement.textContent = "setting mal cookie")

      const sesId = responseObject.responseHeaders.match(/(?<=MALSESSIONID=)\w+/)?.[0]
      const logId = responseObject.responseHeaders.match(/(?<=MALHLOGSESSID=)\w+/)?.[0]

      if (sesId && logId) {
        localStorage.setItem('malCookie', JSON.stringify({
          c1: sesId,
          c2: logId
        }))
      } else {
        console.log('failed to set mal cookies')
      }
    }

    if (responseObject.status !== 200) {
      console.log("Failed to fetch mal user:", name, responseObject)
      infoElement && (infoElement.textContent = `Failed to get ids from mal user`)
      releaseSearch()
      return
    }

    const ids = JSON.parse(responseObject.responseText).map(o => o.anime_id)
    allIds = [...allIds, ...ids]

    infoElement && (infoElement.textContent = `Got ${allIds.length} id(s) from mal`)

    if (ids.length === 300) {
      const delay = Math.floor(Math.random() * 3000) + 1000
      return fetchMalList(name, infoElement, offset + 300, allIds)
      // return setTimeout(fetchMalList, delay, name, infoElement, offset + 300, allIds)
    }

    const date = new Date()
    const o = {
      database: "MyAnimeList",
      ids: allIds,
      date: date.toString(),
      epoch: date.getTime(),
    }

    localStorage.setItem(name, JSON.stringify(o))
    getAnimethemes(o, document.querySelector('caption > p.themes_info > span'))
  }
}
