// ==UserScript==
// @name        messier
// @namespace   https://github.com/pepeloni-away
// @author      pploni
// @insert-into page
// @version     1.0
// @description allow mes to fetch anime ids from popular trackers
// @grant       GM_xmlhttpRequest
// @match       https://pepeloni-away.github.io/mes/*
// @match       http://192.168.0.169:5500/*
// ==/UserScript==
// @run-at      document-start

const additionalPlaceholders = [
  "m/malname",
  "a/anilistname",
  "k/kitsuname",
]
placeholders.push(...additionalPlaceholders)

// patch searchObject checks that run in both index.html and search.html via script.js
parseSearchContent = new Proxy(parseSearchContent, {
  apply(target, thisArg, args) {
    const text = args[0]

    let mode, name
    if (text[1] === "/") {
      mode = ["m", "a", "k"].includes(text[0]) ? text[0] : null
      name = text.substring(2)
    }

    if (mode && name) {
      return {
        userscriptAllowed: true,
        name: name,
        mode: mode
      }
    }

    return Reflect.apply(...arguments)
  }
})

isValidSearchObject = new Proxy(isValidSearchObject, {
  apply(target, thisArg, args) {
    const searchObject = args[0]

    if (searchObject.userscriptAllowed) {
      return true
    }

    return Reflect.apply(...arguments)
  }
})
// end script.js patches

// patch search from search.js
if (!location.pathname.includes('/search')) return     // mind this if you decide to add anything other than functions below
search = new Proxy(search, {
  apply(target, thisArg, args) {
    const searchContent = document.querySelector(".search_input").value
    const searchObject = parseSearchContent(searchContent)

    if (isValidSearchObject(searchObject) && searchObject.userscriptAllowed) {
      suspendSearch()
      return fetchAnimelist(searchObject.mode, searchObject.name)
    }

    return Reflect.apply(...arguments)
  }
})
// end search.js patch


function fetchAnimelist(mode, name) {
  const caption = document.querySelector('caption > p.tracker_info')

  if (mode === "m") {
    fetchMalList(name, caption)
  }
  if (mode === "a") {
    fetchAnilistList(name, caption)
  }
  if (mode === "k") {
    fetchKitsuList(name, caption)
  }
}

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

    infoElement && (infoElement.textContent = `Got ${allIds.length} ids from mal`)

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
    getAnimethemes(o, document.querySelector('caption > p.themes_info'))
  }
}

function fetchAnilistList(name, infoElement, userId = null) {
  if (!userId) return getUserId()

  infoElement && (infoElement.textContent = `Getting ids from anilist`)

  const status = 'Completed'
  fetch("https://graphql.anilist.co/", {
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    "body": `{\"query\":\"{MediaListCollection(userId: ${userId}, type: ANIME) {lists {name entries {mediaId}}}}\",\"variables\":null,\"operationName\":null}`,
    "method": "POST",
  })
    .then(response => response.json())
    .then(data => {
      const list = data.data.MediaListCollection.lists.filter(e => e.name === status)[0]
      const ids = list.entries.map(e => e.mediaId)

      infoElement && (infoElement.textContent = `Got ${ids.length} ids from anilist`)

      const date = new Date()
      const o = {
        database: "AniList",
        ids: ids,
        date: date.toString(),
        epoch: date.getTime(),
      }

      localStorage.setItem(name, JSON.stringify(o))
      getAnimethemes(o, document.querySelector('caption > p.themes_info'))
    })
    .catch(error => {
      infoElement && (infoElement.textContent = `Failed to get anime ids from anilist`)
      console.log("Failed to get anime ids from anilist", error)
      releaseSearch()
    })

  function getUserId() {
    fetch("https://graphql.anilist.co/", {
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      "body": `{\"query\":\"{User(name: \\\"${name}\\\") {id name}}\",\"variables\":null,\"operationName\":null}`,
      "method": "POST",
    })
      .then(response => response.json())
      .then(data => {
        if (data.data.User) {
          userId = data.data.User.id
          fetchAnilistList(name, infoElement, userId)
        } else {
          infoElement && (infoElement.textContent = `Anilist user is private or doesn't exist`)
          console.log(`Anilist user "${name}" is private or doesn't exist`, data)
          releaseSearch()
        }
      })
      .catch(error => {
        infoElement && (infoElement.textContent = `Failed to get anilist user`)
        console.log("Failed to get anilist user", error)
        releaseSearch()
      })
  }
}

// kitsu has a very nice api that doesn't need to be in this userscript, maybe just leave mal here and move stuff to search.js
// note that the api doesn't return R18 entries without auth, and they rate some non-hentai stuff as R18, like redo of healer
function fetchKitsuList(name, infoElement = null, userId = null) {
  if (!userId) return getUserId()

  const status = 'completed'
  const url = `https://kitsu.io/api/edge/library-entries?fields[users]=id&filter[user_id]=${userId}&filter[kind]=anime&filter[status]=${status}&fields[libraryEntries]=id,anime&include=anime&fields[anime]=id&page[limit]=500`
  let allIds = []

  function getFullResponse(url) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const ids = data.included.map(o => o.id)
        allIds = [...allIds, ...ids]
        infoElement && (infoElement.textContent = `Got ${allIds.length} ids from kitsu`)

        if (data.links.next) {
          getFullResponse(data.links.next)
        } else {
          const date = new Date()
          const o = {
            database: "Kitsu",
            ids: allIds,
            date: date.toString(),
            epoch: date.getTime(),
          }

          localStorage.setItem(name, JSON.stringify(o))
          getAnimethemes(o, document.querySelector('caption > p.themes_info'))
        }
      })
      .catch(error => {
        infoElement && (infoElement.textContent = `Failed to get anime ids from kitsu`)
        console.log("Failed to get anime ids from kitsu", error)
        releaseSearch()
      })
  }
  getFullResponse(url)

  function getUserId() {
    const url = `https://kitsu.io/api/edge/users?filter[slug]=${name}&fields[users]=id`
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.meta.count === 0) {
          infoElement && (infoElement.textContent = `Kitsu user is private or doesn't exist`)
          console.log(`Kitsu user "${name}" is private or doesn't exist`)
          releaseSearch()
        } else {
          userId = data.data[0].id
          fetchKitsuList(name, infoElement, userId)
        }
      })
      .catch(error => {
        infoElement && (infoElement.textContent = `Failed to get kitsu user`)
        console.log("Failed to get kitsu user", error)
        releaseSearch()
      })
  }
}



