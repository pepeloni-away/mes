const placeholders = [
  "l/localname",
  "mid/malid(s)",
  "aid/anilistid(s)",
  "kid/kitsuid(s)",
  "kis/kitsuslug(s)",
]

function cyclePlaceholders() {
  const search = document.querySelector(".search_input")

  search.placeholder = placeholders[0]
  setInterval(change, 5e3)

  function change() {
    const current = placeholders.indexOf(search.placeholder)
    search.placeholder = placeholders[current + 1] || placeholders[0]
  }
}
cyclePlaceholders()

function updateHomeIfGithub() {
  location.hostname.endsWith('.github.io') && (document.querySelector('.home').href = '/mes')
}
updateHomeIfGithub()

function keyboardShortcuts() {
  const search = document.querySelector(".search_input")
  self.addEventListener("keydown", e => {
    if (e.key === "/" && e.target !== search) {
      e.preventDefault()
      // put the cursor after existing text
      search.selectionStart = search.selectionEnd = search.value.length;
      search.focus()
    }
    if (e.key === "Escape") {
      const suggestions = document.querySelector('.suggestions')
      if (suggestions.style.display !== 'none') {
        suggestions.style.display = "none"
      } else {
        e.target.blur()
      }
    }
  })
}
keyboardShortcuts()

function suggestLocalNames() {
  const searchInput = document.querySelector(".search_input")
  const suggestionsList = document.querySelector(".suggestions")

  searchInput.addEventListener("input", function () {
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
      const remove = document.createElement('button')

      listItem.textContent = suggestion
      listItem.addEventListener('click', function() {
        searchInput.value = suggestion
        hideSuggestions()
        submitSearchForm()
      })

      remove.textContent = 'remove'
      remove.addEventListener('click', function(e) {
        e.stopPropagation()
        const key = e.target.previousSibling.textContent.substring(2)
        localStorage.removeItem(key)
        e.target.parentElement.remove()
      })

      listItem.append(remove)
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
  const databases = [
    "MyAnimeList",
    "AniList",
    "Kitsu",
  ]

  if (!databases.includes(searchObject.database)) return false
  if (!Array.isArray(searchObject.ids)) return false
  if (searchObject.ids.length < 1) return false

  if (searchObject.kitsuSlugs) {
    if (!searchObject.ids.every(e => typeof e === 'string')) return false
  } else {
    if (!searchObject.ids.every(Number.isInteger)) return false
  }

  return true
}

function navigateSuggestions() {
  const searchInput = document.querySelector('.search_input')
  let selected, first, last, suggestionItems

  searchInput.addEventListener('keydown', function (e) {
    suggestionItems = document.querySelectorAll('.suggestions li')

    if (suggestionItems.length === 0) return

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
    searchInput.value = selected.firstChild.textContent
  }
  function selectPrev() {
    selected = selected ? selected.previousSibling || last : last
    searchInput.value = selected.firstChild.textContent
  }
}
navigateSuggestions()

function parseSearchContent(text) {
  const searchObject = {}
  const parseIds = i => i.split(",").map(e => parseInt(e.trim()))
  const parseKitsuSlugs = i => i.split(",").map(e => e.trim())
  
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
  if (text.startsWith("kid/")) {
    searchObject.database = "Kitsu"
    searchObject.ids = parseIds(text.substring(4))
  }
  if (text.startsWith("kis/")) {
    searchObject.database = "Kitsu"
    searchObject.ids = parseKitsuSlugs(text.substring(4))
    searchObject.kitsuSlugs = true
  }

  return searchObject
}

function flashSearch() {
  const searchInput = document.querySelector('.search_input');

  searchInput.classList.add('flash');

  setTimeout(() => {
    searchInput.classList.remove('flash');
  }, 300);
}

function submitSearchForm() {
  const form = document.getElementById('searchForm')
  const query = form.querySelector('[name="q"]').value.trim()

  if (isValidSearchObject(parseSearchContent(query))) {
    // var url = '/search?q=' + query;
  // const url = '/search.html?q=' + query
  const url = location.hostname.endsWith('.github.io') ? '/mes/search?q=' + query : '/search.html?q=' + query

  window.location.href = url
  } else {
    flashSearch()
  }
}
