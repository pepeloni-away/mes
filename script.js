const placeholders = [
  "l/localname",
  "mid/malid(s)",
  "aid/anilistid(s)",
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

function keyboardShortcuts() {
  const search = document.querySelector(".search-bar > input")
  self.addEventListener("keydown", e => {
    if (e.key === "/" && e.target !== search) {
      e.preventDefault()
      search.focus()
      search.value = search.value
    }
  })
}
keyboardShortcuts()

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
        searchInput.value = suggestion
        hideSuggestions()
        search()
      })
      suggestionsList.appendChild(listItem)
    })

    suggestionsList.style.display = 'block'
  }

  function hideSuggestions() {
    suggestionsList.style.display = 'none'
  }

  function getSuggestions(query) {
    const suggestionOptions = Object.keys(localStorage).filter(isLocalnameValid).map(s => 'l/' + s)
    return suggestionOptions.filter(option => option.toLowerCase().includes(query))
  }
}
suggestLocalNames()

function isLocalnameValid(localstorageKey) {
  let t
  try {
    t = JSON.parse(localStorage[localstorageKey])
  } catch { return false }
  return isValidSearchObject(t)
}
function isValidSearchObject(searchObject) {
  const databases = {
    "m": "MyAnimeList",
    "a": "AniList",
    "k": "Kitsu",
  }
  const database = [databases[searchObject.database]]
  if (!database) return false
  if (!Array.isArray(searchObject.ids)) return false
  if (searchObject.ids.length < 1) return false
  if (!searchObject.ids.every(Number.isInteger)) return false

  return true
}

function navigateSuggestions() {
  const searchInput = document.getElementById('search-input')
  let selected, first, last, suggestionItems

  searchInput.addEventListener('keydown', function(e) {
    suggestionItems = document.querySelectorAll('#suggestions li')
    first = suggestionItems[0]
    last = suggestionItems[suggestionItems.length - 1]
    if (e.key === 'Tab') {
      e.preventDefault()

      if (e.shiftKey) {
        selectPrev()
      } else {
        selectNext()
      }

    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectPrev()
    } else if (
      e.key === 'ArrowDown') {
      e.preventDefault()
      selectNext()
    }
  })
  function selectNext() {
    selected = selected ? selected.nextSibling || first : first
    searchInput.value = selected.textContent
  }
  function selectPrev() {
    selected = selected ? selected.previousSibling || last : last
    searchInput.value = selected.textContent
  }
}
navigateSuggestions()

function handleSearch() {
  const searchInput = document.querySelector("#search-input")
  searchInput.addEventListener("keydown", handleKeydown)

  function handleKeydown(e) {
    // const searchContent = e.target.value.trim()

    if (e.key === "Escape") {
      e.target.value = ""
      e.target.blur()
      document.querySelector("#suggestions").style.display = "none"
    }

    if (e.key === "Enter") {
      search()
    }

  }
  function search() {
    const searchContent = document.querySelector("#search-input").value
    const searchObject = parseSearchContent(searchContent)

    updateURL(searchContent)

    if (!isValidSearchObject(searchObject)) {
      flashSearch()
      return console.log("Invalid search object:", searchObject)
    }
    suspendSearch()
    // updateURL(searchContent)
    getAnimethemes(searchObject)
  }

  return search
}
const search = handleSearch()

function parseSearchContent(text) {
  const searchObject = {}
  const parseIds = i => i.split(",").map(e => parseInt(e.trim()))
  if (text.startsWith("l/")) {
    const name = text.substring(2)
    if (isLocalnameValid(name)) return JSON.parse(localStorage[name])
  }
  if (text.startsWith("mid/")) {
    searchObject.database = "MyAnimeList"
    searchObject.ids = parseIds(text.substring(4))
  }
  if (text.startsWith("aid/")) {
    searchObject.database = "AniList"
    searchObject.ids = parseIds(text.substring(4))
  }

  return searchObject
}

// should replace this with a big usage guide, and hide it after the user searches anything
// const a = document.querySelector(".main > table > tbody")
// let aa = [...Array(5).keys()].forEach(_ => a.innerHTML += a.innerHTML)


function getAnimethemes(o) {
  // i think i shoould split ids into multiple calls.. can the url get too long with enough ids? works with my almost 600
  const ids = o.ids.join()
  const url = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=${o.database}&filter[external_id]=${ids}&include=animethemes.animethemeentries.videos&page[size]=100`
  let fullResponse = []

  function getResponse(url) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        // console.log(data)
        fullResponse = [...fullResponse, ...data.anime]
        if (data.links.next) {
          getResponse(data.links.next)
        } else {
          // console.log("final data", fullResponse)
          releaseSearch()
          fillTable(fullResponse)
        }
      })
      .catch(error => {
        console.log("getanimethemes fetch error", error)
        releaseSearch()
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

    // to show it with css on mobile
    name.setAttribute("season", animeSeason)

    name.innerText = animeName
    season.innerText = animeSeason
    links.append(...makeAnchors(animethemesObj))

    tr.append(name, season, links)

    return tr
  }
  function makeAnchors(animethemesObj) {
    return animethemesObj.map(e => {
      const a = document.createElement("a")
      a.innerText = e.slug
      a.href = e.animethemeentries[0].videos[0].link

      a.draggable = false
      a.onclick = e => {
        e.preventDefault()
        openVideo(e.target)
      }
      
      return a
    })
  }
}

function suspendSearch() {
  const cover = document.querySelector("#loading-overlay")
  cover.style.display = ""
}
function releaseSearch() {
  const cover = document.querySelector("#loading-overlay")
  cover.style.display = "none"
}
function flashSearch() {
  const searchInput = document.getElementById('search-input');

  searchInput.classList.add('flash');

  setTimeout(() => {
    searchInput.classList.remove('flash');
  }, 300);
}



const searchInput = document.getElementById('search-input');

const updateURL = (query) => {
  // window.history.pushState({}, document.title, `?${urlParams.toString()}`);
  if (query !== new URLSearchParams(window.location.search).get("q")) {
    window.history.pushState({}, document.title, `?q=${searchInput.value}`);
  }
};

// Function to check for a search query in the URL when the page loads
const checkURLForQuery = () => {
  // Get the current URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  // Check if the 'q' parameter exists
  if (urlParams.has('q')) {
    // Retrieve the search query from the URL
    const searchQuery = urlParams.get('q');

    // Update the search input value
    searchInput.value = searchQuery;
    search()

    // Perform any additional actions based on the search query if needed

    // For example, trigger a search with the query
    // performSearch(searchQuery);
  }
};

// Event listener for the search input
// searchInput.addEventListener('input', (event) => {
//   const query = event.target.value;

//   // Update the URL with the search query
//   updateURL(query);
// });

// Check for a search query in the URL when the page loads
window.addEventListener('DOMContentLoaded', checkURLForQuery);
window.addEventListener('popstate', checkURLForQuery)

function makeModal() {
  const div1 = document.createElement("div")
  const div2 = document.createElement("div")
  const div3 = document.createElement("div")

  div1.style.cssText = "display: none; position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5);"
    + " z-index: 1; align-items: center; justify-content: center;"
  // div2.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgb(255, 255, 255);"
  div2.style.cssText = "background-color: rgb(255, 255, 255); max-width: 85%; text-align: center;"
    + " padding: 20px; max-height: 80%; overflow-y: auto; min-height: 15%; min-width: 15%; background-color: #333; color: #fff;"

  self.addEventListener("click", e => e.target === div1 && (div1.style.display = "none"))

  div1.append(div2)
  div2.append(div3)

  return div1
}
function openVideo(anchor) {
  const modal = makeModal()
  const video = document.createElement("video")
  video.controls = true
  video.style.maxHeight = "35rem"

  anchor.append(modal)
  modal.firstChild.firstChild.append(video)
  modal.style.display = "flex"

  video.src = anchor.href

  modal.style.zIndex = 2
  self.addEventListener("click", e => e.target === modal && (modal.remove()))
}
