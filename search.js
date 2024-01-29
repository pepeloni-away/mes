function search() {
  const searchContent = document.querySelector(".search_input").value
  const caption = document.querySelector('caption > p.themes_info')
  const searchObject = parseSearchContent(searchContent)

  if (!isValidSearchObject(searchObject)) {
    flashSearch()
    return console.log("Invalid search object:", searchObject)
  }
  suspendSearch()
  getAnimethemes(searchObject, caption)
}

function getAnimethemes(o, infoElement = null) {
  const url1 = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=${o.database}&filter[external_id]=`
  const url2 = `&include=animethemes.animethemeentries.videos,animethemes.song&page[size]=100`
  const ratelimit = 80 // the rate limit is 90 requests per minute
  const minTimeBewteenRequestsInMs = 60 / ratelimit * 1000
  let fullResponse = []
  let lastDate

  function getResponse(url, moreToCome = false) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        fullResponse = [...fullResponse, ...data.anime]
        infoElement && (infoElement.textContent = `Found ${fullResponse.length} themes`)
        if (data.links.next) {
          getResponse(data.links.next)
        } else {
          if (moreToCome) return getResponseInChunks()
          releaseSearch()

          fillTable(fullResponse)
        }
      })
      .catch(error => {
        infoElement && (infoElement.textContent = `Failed to get themes`)
        console.log("getanimethemes fetch error", error)
        releaseSearch()
      })
  }
  // getResponse(url)
  o.ids.length > 600 ? getResponseInChunks() : getResponse(url1 + o.ids.join() + url2)

  function getResponseInChunks() {
    const ids = o.ids.splice(0, 100)
    const date = new Date()
    const send = _ => o.ids.length > 0 ? getResponse(url1 + ids + url2, true) : getResponse(url1 + ids + url2)
    if (lastDate && date.getTime() - lastDate.getTime() < minTimeBewteenRequestsInMs) {
      // from my tests this is not needed since 90 requests of this kind per miniute aren't possible with the average response time
      // but maybe i'm rate limited since i spammed the api while working on this project
      // console.log(date.getTime() - lastDate.getTime())
      setTimeout(send, minTimeBewteenRequestsInMs - (date.getTime() - lastDate.getTime()))
    } else {
      send()
    }
    lastDate = date
  }
}

function fillTable(animeData) {
  const table = document.querySelector("table > tbody")

  table.innerHTML = ''

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
      a.setAttribute("slug", e.slug)
      // https://animethemes.moe/anime/magia_record_mahou_shoujo_madoka_magica_gaiden_tv_final_season_asaki_yume_no_akatsuki
      // this doesn't have song info yet
      const title = e?.song?.title || '[T.B.A]'

      // why is Nurarihyon no Mago OVA's animethemeentries object empty???
      // https://animethemes.moe/anime/nurarihyon_no_mago_ova

      // why does Hirogaru Sky! Precure have an animethemeenrty with an empty video array????
      // https://animethemes.moe/anime/hirogaru_sky_precure
      if (e.animethemeentries.length === 0 || e.animethemeentries[0].videos.length === 0) {
        a.object = {
          animethemesObj: animethemesObj,
          problem: e,
        }
        a.classList = 'broken'
        a.style.display = 'none'
        return a
      }

      a.setAttribute("song_title", title)
      a.setAttribute("episodes", e.animethemeentries[0].episodes)
      a.setAttribute("nsfw", e.animethemeentries[0].nsfw)
      a.setAttribute("notes", e.animethemeentries[0].notes)
      a.setAttribute("tags", e.animethemeentries[0].videos[0].tags)

      a.versions = makeVersions(e.animethemeentries).map(setClickEventListener)

      // a.innerText = e.slug
      a.innerText = `${e.slug} - ${title}`
      a.href = e.animethemeentries[0].videos[0].link

      a.draggable = false
      a.onclick = e => {
        e.preventDefault()
        openVideo(e.target)
      }

      return a
    })
  }
  function makeVersions(animethemeentry) {
    return animethemeentry.flatMap(e => {
      return e.videos.map(v => {
        const a = document.createElement('a')
        a.textContent = v.basename
        a.href = v.link

        if (e.episodes) {
          a.textContent += ` [ep${e.episodes}]`
        }
        if (e.nsfw) {
          a.textContent += ' [nsfw]'
        }
        if (e.spoiler) {
          a.textContnent += ' [spoiler]'
        }
        if (v.lyrics) {
          a.textContent += ' [lyrics]'
        }
        if (v.uncen) {
          a.textContent += ' [uncen]'
        }
        if (v.tags) {
          a.textContent += ` [${v.tags}]`
        }
        return a
      })
    })
  }
  function setClickEventListener(anchor) {
    anchor.addEventListener('click', e => {
      e.preventDefault()
      const allVersions = e.target.parentElement.childNodes
      const video = e.target.parentElement.parentElement.querySelector('video')

      allVersions.forEach(e => e.classList.remove('selected'))
      e.target.classList.add('selected')

      if (video && video.src !== e.target.href) {
        video.src = e.target.href
      }
    })
    return anchor
  }
  const broken = document.querySelectorAll('a.broken')
  broken && console.log('broken', broken)
}

function suspendSearch() {
  const cover = document.querySelector(".loading_overlay")
  const search = document.querySelector('.search_input')

  cover.style.display = ""
  search.disabled = true
}
function releaseSearch() {
  const cover = document.querySelector(".loading_overlay")
  const search = document.querySelector('.search_input')

  cover.style.display = "none"
  search.disabled = false
}

function checkURLForQuery() {
  const searchInput = document.querySelector('.search_input');
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has('q')) {
    const searchQuery = urlParams.get('q');

    searchInput.value = searchQuery;
    search()
  }
};

window.addEventListener('DOMContentLoaded', checkURLForQuery);

function makeModal() {
  const div1 = document.createElement("div")
  const div2 = document.createElement("div")

  div1.className = "modal"
  div1.append(div2)

  return div1
}
function openVideo(anchor) {
  const modal = makeModal()
  const video = document.createElement("video")
  const title = document.createElement('p')
  const info = document.createElement('p')
  const versions = document.createElement('div')

  video.controls = true
  video.autoplay = true
  if (localStorage.getItem('volume')) {
    video.volume = localStorage.getItem('volume')
  }

  title.className = "title"
  title.textContent = anchor.getAttribute("song_title")

  info.className = 'info'
  // info.textContent = anchor.getAttribute("tags")
  info.textContent = anchor.parentElement.parentElement.firstChild.textContent

  versions.className = "versions"
  versions.append(...anchor.versions)
  // versions.firstChild.click()
  setTimeout(_ => versions.firstChild.click())

  document.body.append(modal)
  modal.firstChild.append(video, title, info, versions)

  video.src = anchor.href
  video.onvolumechange = function() {
    localStorage.setItem('volume', this.volume)
  }

  // self.addEventListener("click", e => e.target === modal && (modal.remove()))
  // accept dead space around video as exit, happens when viewport height is small
  self.addEventListener("click", e => (e.target === modal || e.target === modal.firstChild) && (modal.remove()))
}
