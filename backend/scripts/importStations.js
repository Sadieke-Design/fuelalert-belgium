import axios from "axios";

const query = `
[out:json][timeout:120];

(
  node["amenity"="fuel"](49.4,2.5,51.6,6.4);
  way["amenity"="fuel"](49.4,2.5,51.6,6.4);
  relation["amenity"="fuel"](49.4,2.5,51.6,6.4);
);

out center;
`;

async function run() {
  try {
    const response = await axios.post(
      "https://lz4.overpass-api.de/api/interpreter",
      query,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      },
    );

    console.log(`Stations gevonden: ${response.data.elements.length}`);
  } catch (err) {
    console.error(err.response?.status);
    console.error(err.response?.data || err.message);
  }
}

run();
