// ==UserScript==
// @name        New script 
// @namespace   https://github.com/pepeloni-away
// @author      pploni
// @insert-into page
// @version     1.0
// @description 1/17/2024, 11:39:01 AM
// @grant       GM_xmlhttpRequest
// @match       file:///C:/Users/pploni/Desktop/themes.moe2/index2.html
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
      console.log(mode, name)
      fetchAnimelist(mode, name)
    }
  }

  function parseSearchContent(text) {
    let mode, name
    if (text[1] === "/") {
      // should have l for local here, and store name and ids for previous searches
      mode = ["m", "a", "k"].includes(text[0]) ? text[0] : null
      name = text.substring(2)
    }
    return [mode, name]
  }
}
handleSearch()

function fetchAnimelist(mode, name) {
  console.log('fetching', mode, name)

  if (mode === "m") {
    fetchMalList(name)
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
    // responsType: "json",
    onload: handleMalResponse
    // onreadystatechange: handleMalResponse
  })

  function handleMalResponse(responseObject) {
    if (responseObject.status !== 200) return console.log("failed", responseObject)

    console.log(responseObject, allIds)
    const ids = JSON.parse(responseObject.responseText).map(o => o.anime_id)
    allIds = [...allIds, ...ids]
    console.log(ids, allIds)

    if (ids.length === 300) {
      const delay = Math.floor(Math.random() * 3000) + 1000
      // return fetchMalList(name, offset + 300, allIds)
      return setTimeout(fetchMalList, delay, name, offset + 300, allIds)
    }

    const date = new Date()
    const o = {
      database: "m",
      ids: allIds,
      date: date.toString(),
      epoch: date.getTime(),
    }

    localStorage.setItem(name, JSON.stringify(o))
    getAnimethemes(o)
  }
}

console.log('loaded', placeholders)


  const additionalPlaceholders = [
    "m/malname",
    "a/anilistname",
    "k/kitsuname",
]
placeholders.push(...additionalPlaceholders)
