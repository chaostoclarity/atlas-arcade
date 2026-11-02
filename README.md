# Atlas Arcade

Geography games for the whole family: true-size map, Find It, Label It, Shape, Hot & Cold, Border Chain, Capitals, and Flags. Works for the world, each continent, and the US states, with player profiles and a scoreboard.

A static site with no build step. Open `index.html` through any web server, or deploy the folder to Vercel as-is.

## Data
- Country and state boundaries: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas), US Census via [us-atlas](https://github.com/topojson/us-atlas)
- Capitals, regions, borders, languages: [world-countries](https://github.com/mledoze/countries)
- Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT)
- State flags: [us-state-flags](https://www.npmjs.com/package/us-state-flags), current designs including Minnesota and Utah (2024)
- Big cities for Capitals decoys: GeoNames via [all-the-cities](https://www.npmjs.com/package/all-the-cities)

Progress is stored per player in the browser's local storage.
