// ==UserScript==
// @name        New script 
// @namespace   https://github.com/pepeloni-away
// @author      pploni
// @insert-into page
// @version     1.0
// @description 1/17/2024, 11:39:01 AM
// @grant       GM_xmlhttpRequest
// @match       https://pepeloni-away.github.io/mes/
// @match       http://192.168.0.169:5500/  
// ==/UserScript==
// @run-at      document-start


function handleSearch() {
  const searchInput = document.querySelector("#search-input")
  searchInput.addEventListener("keydown", search)

  function search(e) {
    if (e.key !== "Enter") return
    const searchContent = e.target.value.trim()
    const [mode, name] = parseSearchContent(searchContent)

    if (mode && name) {
      fetchAnimelist(mode, name)
    }
  }

  function parseSearchContent(text) {
    let mode, name
    if (text[1] === "/") {
      mode = ["m", "a", "k"].includes(text[0]) ? text[0] : null
      name = text.substring(2)
    }
    return [mode, name]
  }
}
handleSearch()

function fetchAnimelist(mode, name) {
  if (mode === "m") {
    fetchMalList(name)
  }
  if (mode === "a") {
    fetchAnilistList(name)
  }
  if(mode === "k") {
    fetchKitsuList("k")
  }
}

function fetchMalList(name, offset = 0, allIds = []) {
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

    if (ids.length === 300) {
      const delay = Math.floor(Math.random() * 3000) + 1000
      // return fetchMalList(name, offset + 300, allIds)
      return setTimeout(fetchMalList, delay, name, offset + 300, allIds)
    }

    const date = new Date()
    const o = {
      database: "MyAnimeList",
      ids: allIds,
      date: date.toString(),
      epoch: date.getTime(),
    }

    localStorage.setItem(name, JSON.stringify(o))
    getAnimethemes(o)
  }
}

function fetchAnilistList() {
  //https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=Anilist&filter[external_id]=20923&include=resources,animethemes.animethemeentries.videos
  console.log("getting list from anilist not implemented yet")
}
function fetchKitsuList() {
  //https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=Kitsu&filter[external_id]=3919&include=resources
  console.log("getting list from kitsu not implemented yet")
}


  const additionalPlaceholders = [
    "m/malname",
    // "a/anilistname",
    // "k/kitsuname",
]
placeholders.push(...additionalPlaceholders)
