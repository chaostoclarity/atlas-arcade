# Atlas Arcade

Geography games for the whole family, with a Daily Challenge and a public leaderboard: The Chase (a full detective game: track a thief city to city, narrow ten suspects to one, get a warrant, and make the arrest before the deadline), true-size map, Find It, Label It, Shape, Hot & Cold, Border Chain, Capitals, Flags, Nature (rivers, lakes, seas, mountains, deserts, landforms, peaks, islands), Culture (landmarks and famous places), and Trivia. Works for the world, each continent, and the US states, with player profiles and a scoreboard.

A static site with no build step. Open `index.html` through any web server, or deploy the folder to Vercel as-is.

## Data
- Country and state boundaries: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas), US Census via [us-atlas](https://github.com/topojson/us-atlas)
- Capitals, regions, borders, languages: [world-countries](https://github.com/mledoze/countries)
- Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT)
- State flags: [us-state-flags](https://www.npmjs.com/package/us-state-flags), current designs including Minnesota and Utah (2024)
- Natural features: [Natural Earth](https://www.naturalearthdata.com/) rivers, lakes, marine areas, geographic regions and elevation points (public domain)
- Satellite layer: NASA Blue Marble (public domain); Terrain layer: shaded relief built from NASA elevation data (both via the [three-globe](https://github.com/vasturiano/three-globe) examples)
- Landmarks: 125 hand-picked landmarks and famous places, each checked against its country and state borders
- Trivia: the Geography and US States questions from [Sunset Trivia](https://github.com/chaostoclarity/sunset-trivia)
- Capital city locations for The Chase: GeoNames via all-the-cities
- Big cities for Capitals decoys: GeoNames via [all-the-cities](https://www.npmjs.com/package/all-the-cities)

Progress is stored per player in the browser's local storage.
