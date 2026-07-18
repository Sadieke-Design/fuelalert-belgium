import axios from "axios";

export default async function getMaesStations() {
  const payload = {
    bounds: {
      center: {
        latitude: 50.85045,
        longitude: 4.34878,
      },
      ne: {
        lat: 51.1873642776217,
        lng: 9.973780000000016,
      },
      sw: {
        lat: 50.51108452969464,
        lng: -1.2762199999999835,
      },
    },
    carwash: false,
    fuelTypes: [],
    networks: ["0"],
    paymentMethods: [],
    shop: false,
  };

  const { data } = await axios.post(
    "https://www.maesmobility.be/api/filter-stations",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  return data;
}
