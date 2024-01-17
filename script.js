const placeholders = [
  // "m/malname",
  // "a/anilistname",
  // "k/kitsuname",
  "l/localname",
  "malid(s)",
]

function cyclePlaceholders() {
  const search = document.querySelector(".search-bar > input")

  search.placeholder = placeholders[0]
  setInterval(change, 5e3)

  function change() {
    const current = placeholders.indexOf(search.placeholder)
    search.placeholder = placeholders[current + 1] || placeholders[0]
  }
}
cyclePlaceholders()

function suggestLocalNames() {
  const searchInput = document.querySelector("#search-input")
  const suggestionsList = document.querySelector("#suggestions")

  searchInput.addEventListener("input", function() {
    const input = searchInput.value.trim()
    if (input.startsWith("l/")) {
      showSuggestions(input.slice(2))
    } else {
      hideSuggestions()
    }
  })

  function showSuggestions(query) {
    const suggestions = getSuggestions(query)

    suggestionsList.innerHTML = ''
    suggestions.forEach(suggestion => {
      const listItem = document.createElement('li')
      listItem.textContent = suggestion
      listItem.addEventListener('click', function() {
        // Handle suggestion click (e.g., fill search input with suggestion)
        searchInput.value = 'l/' + suggestion
        hideSuggestions()
      })
      suggestionsList.appendChild(listItem)
    })

    suggestionsList.style.display = 'block'
  }

  function hideSuggestions() {
    suggestionsList.style.display = 'none'
  }

  function getSuggestions(query) {
    const suggestionOptions = Object.keys(localStorage)
    return suggestionOptions.filter(option => option.toLowerCase().includes(query))
  }
}
suggestLocalNames()


// should replace this with a big usage guide, and hide it after the user searches anything
// const a = document.querySelector(".main > table > tbody")
// let aa = [...Array(5).keys()].forEach(_ => a.innerHTML += a.innerHTML)


function getAnimethemes(o) {
  console.log('getting animethemes', o)

  const databases = {
    "m": "MyAnimeList",
    "a": "Anilist",
    "k": "Kitsu",
  }
  const database = [databases[o.database]][0]
  if (!database) return console.log('undefined database')

  console.log(database)
  // i think i shoould split ids into multiple calls.. can the url get too long?
  const ids = o.ids.join()
  const url = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=${database}&filter[external_id]=${ids}&include=animethemes.animethemeentries.videos&page[size]=100`
  let fullResponse = []

  function getResponse(url) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        fullResponse = [...fullResponse, ...data.anime]
        if (data.links.next) {
          getResponse(data.links.next)
        } else {
          console.log("final data", fullResponse)
          fillTable(fullResponse)
        }
      })
  }
  getResponse(url)
}

function fillTable(animeData) {
  const table = document.querySelector("table > tbody")

  while (table.firstChild) {
    table.firstChild.remove()
  }

  animeData.forEach(e => {
    table.append(makeRow(e.name, `${e.season} ${e.year}`, e.animethemes))
  })

  function makeRow(animeName, animeSeason, animethemesObj) {
    const tr = document.createElement("tr")
    const name = document.createElement("td")
    const season = document.createElement("td")
    const links = document.createElement("td")

    name.innerText = animeName
    season.innerText = animeSeason
    links.append(...makeAnchors(animethemesObj))

    tr.append(name, season, links)

    return tr
  }
  function makeAnchors(animethemesObj) {
   return  animethemesObj.map(e => {
      const a = document.createElement("a")
      a.innerText = e.slug
      a.href = e.animethemeentries[0].videos[0].link
      return a
    })
  }
}
