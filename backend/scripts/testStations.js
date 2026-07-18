import getMaesStations from "./scrapers/maesStations.js";

const stations = await getMaesStations();

console.log("Aantal stations:", stations.length);

console.log(stations.slice(0, 20));
