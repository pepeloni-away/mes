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
  // "a/anilistname",
  // "k/kitsuname",
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
  if(mode === "k") {
    fetchKitsuList(name, caption)
  }
}

function fetchMalList(name, infoElement=null, offset = 0, allIds = []) {
  const status = 2
  const url = `https://myanimelist.net/animelist/${name}/load.json?status=${status}&offset=${offset}`

  GM_xmlhttpRequest({
    url: url,
    headers: {
      "Cookie": "MALSESSIONID=m4f43sdsfaf4g42g2naf6quuq7; MALHLOGSESSID=8a31a4543a680ba5112b6d8daa62263a",
      "Host": "myanimelist.net",
      "Referer": `https://myanimelist.net/animelist/${name}/load.json?status=${status}`,
    },
    onload: handleMalResponse
  })

  function handleMalResponse(responseObject) {
    if (responseObject.status !== 200) return console.log("Failed to fetch mal user:", name, responseObject)

    const ids = JSON.parse(responseObject.responseText).map(o => o.anime_id)
    allIds = [...allIds, ...ids]

    infoElement && (infoElement.textContent = `Got ${allIds.length} ids from mal`)

    if (ids.length === 300) {
      const delay = Math.floor(Math.random() * 3000) + 1000
      // return fetchMalList(name, offset + 300, allIds)
      return setTimeout(fetchMalList, delay, name, infoElement, offset + 300, allIds)
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

function fetchAnilistList(name, infoElement) {
  infoElement.textContent = 'getting list from anilist not implemented yet'
  //https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=Anilist&filter[external_id]=20923&include=resources,animethemes.animethemeentries.videos
  console.log("getting list from anilist not implemented yet")

  releaseSearch()
}
function fetchKitsuList(name, infoElement) {
  infoElement.textContent = 'getting list from kitsu not implemented yet'
  //https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=Kitsu&filter[external_id]=3919&include=resources
  console.log("getting list from kitsu not implemented yet")


  releaseSearch()
}



