import axios from "axios";

const url = "https://www.q8.be/nl/stations/q8-easy-grobbendonk";

const response = await axios.get(url);

const html = response.data;

const index95 = html.indexOf("1.785");
const indexDiesel = html.indexOf("2.020");
const index98 = html.indexOf("2.044");

console.log("\n===== EURO95 =====");
console.log(html.substring(index95 - 300, index95 + 300));

console.log("\n===== DIESEL =====");
console.log(html.substring(indexDiesel - 300, indexDiesel + 300));

console.log("\n===== EURO98 =====");
console.log(html.substring(index98 - 300, index98 + 300));