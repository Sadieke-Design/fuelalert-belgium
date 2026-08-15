import axios from "axios";

const ids = ["106235", "108445", "108453", "109822"];

async function test() {
  for (const id of ids) {
    try {
      const response = await axios.post(
        "https://www.q8.be/api/poi/location/fresh",
        { id },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      console.log("ID:", id);

      console.log(
        JSON.stringify(response.data.fuelingLos?.fuelPrices, null, 2),
      );

      console.log("------------------");
    } catch (error) {
      console.log("ID:", id);
      console.log("FOUT:", error.message);
      console.log("------------------");
    }
  }
}

test();
