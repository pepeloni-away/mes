# Mes
Mes is a website and userscript combo that takes a list of anime ids, their respective themes from [AnimeThemes](https://animethemes.moe/), and shows them to you in a simple table
with minimal interface and mobile support.

[Themes.moe](https://themes.moe/) inspired this project, and its lack of mobile interface and updates since winter 2022 motivated it.

Mes is a standalone project not affiliated with any of the sites or people mentioned in this readme.


## Usage
You can use the [github project page](https://pepeloni-away.github.io/mes/) or clone the repo and host it locally (remember to modify the userscript's match rules if you do this).

### The website
The website will show you a table with themes for a list of anime ids.
> For example, https://pepeloni-away.github.io/mes/search?q=mid/1,6 will show themes for:  
> https://myanimelist.net/anime/1/Cowboy_Bebop and https://myanimelist.net/anime/6/Trigun

You can replace `mid/` with `aid/` for anilist ids and `kid/` for kitsu ids.

The website is able to grab ids from a kitsu or anilist username with `k/` and `a/`.
> For example, https://pepeloni-away.github.io/mes/search?q=a/coffinairplane will grab all ids for completed anime by AniList user coffinairplane, cache them to your browser's localstorage,
> and then show you a table with themes for them.

You can add lists to localstorage manually using your browser's console as well if you want, here's a template:
```
localStorage.setItem("name", JSON.stringify({
    database: "MyAnimeList",
    ids: [1, 6]
}))
```

Valid entries from localstorage will show up when you type `l/` in the search bar.

### The userscript
The [userscript](https://github.com/pepeloni-away/mes/raw/master/userscript.user.js) lets you use `m/` to grab anime ids from a MAL user. MAL's api is more restrictive, using [cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) and cookies - the userscript's job is to bypass this.


## Why mes?
`animethemes > themes > mes` I didn't think much about it.
### why use this?
To look back on openings and endings of anime you've seen or to send someone a link with a select few anime themes.

I just want anisongs in the background ---> [YouTube](https://www.youtube.com/) does this.  
I want to be able to search for a song ---> [AnimeThemes](https://animethemes.moe/) does this.

## Background
I'm in the club of people that actually spend 24 minutes per anime episode, and maybe a few more to read comments occasionally. I like my openings and endings, and for listening alone
youtube is good, but if you also want the video it can be surprisingly hard, unless you like 4k 120fps upscaled interpolated stuff with a side dish of youtube compression.  
[AnimeThemes](https://animethemes.moe/) solves the video problem but you have to search every theme and you don't get magic youtube recomandations algorithm. Here comes [Themes.moe](https://themes.moe/)
to take you watched shows from a tracker and show you the corresponding themes from AnimeThemes. That worked well but it's stuck in winter 2022 now, nothing was added since.


I like to tweak sites to fit my needs with userscripts. I've spent a few days failing to intercept Themes.moe's api response and modify it to include newer anime, and after eventually giving up on that
I ended up with a userscript that grabs id's from a user's mal, gets their respective themes from AnimeThemes and merges it with Themes.moe's api response. I opted to try and make a website for this userscript
instead of deleting it.

Edit: I actually figured out the initial userscript as well, https://github.com/pepeloni-away/userscripts/blob/main/themes.moe-updater.user.js




## Credits
Mes is my first attempt with no prior experience at making a website from the ground up. I want to credit
[moderncss.dev](https://moderncss.dev/) and its tldr version [smollcss.dev](https://smolcss.dev/), partly because i'm thankful and partly because i would like quicklinks to them in the future.
Both are by Stephanie Eckles, and her [codepen](https://codepen.io/5t3ph) was also helpful.

[css-tricks](https://css-tricks.com/) has some really nice guides that show side by side what css properties do for a container and for its content. I used the [flex](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and [grid](https://css-tricks.com/snippets/css/complete-guide-grid/) guides a lot.

There's a youtube comment i saw that suggested picking a random hsl color and bumping the hue a bit for every extra color you need. Blame him if my colors suck.

Of course [AnimeThemes](https://animethemes.moe/) and their amazing [api](https://api-docs.animethemes.moe/) goes here as well.
