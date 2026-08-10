import Dats24Scraper from "../scrapers/dats24/dats24.js";

const scraper = new Dats24Scraper();

try {
  console.log("");
  console.log("=================================");
  console.log("DATS24 V2 VOLLEDIGE TEST");
  console.log("=================================");
  console.log("");

  /*
   * GEEN smokeTest.
   *
   * Hierdoor worden alle beschikbare DATS24 station-URLs
   * verwerkt.
   */
  const records = await scraper.scrape();

  console.log("");
  console.log("=================================");
  console.log("RESULTAAT");
  console.log("=================================");
  console.log("");

  console.log(`Stations gevonden: ${records.length}`);

  /*
   * Prijscontrole
   */
  let withE95 = 0;
  let withE98 = 0;
  let withDiesel = 0;
  let withLpg = 0;
  let withCng = 0;
  let withAdblue = 0;

  /*
   * GPS controle
   */
  let withGps = 0;
  let withoutGps = 0;

  /*
   * Adrescontrole
   */
  let withAddress = 0;
  let withoutAddress = 0;

  for (const record of records) {
    if (record.prices?.e95 !== null) withE95++;
    if (record.prices?.e98 !== null) withE98++;
    if (record.prices?.diesel !== null) withDiesel++;
    if (record.prices?.lpg !== null) withLpg++;
    if (record.prices?.cng !== null) withCng++;
    if (record.prices?.adblue !== null) withAdblue++;

    if (
      record.latitude !== null &&
      record.longitude !== null
    ) {
      withGps++;
    } else {
      withoutGps++;
    }

    if (
      record.address &&
      record.city &&
      record.postal_code
    ) {
      withAddress++;
    } else {
      withoutAddress++;
    }
  }

  console.log("");
  console.log("PRIJZEN");
  console.log("---------------------------------");
  console.log(`E95:     ${withE95}`);
  console.log(`E98:     ${withE98}`);
  console.log(`Diesel:  ${withDiesel}`);
  console.log(`LPG:     ${withLpg}`);
  console.log(`CNG:     ${withCng}`);
  console.log(`AdBlue:  ${withAdblue}`);

  console.log("");
  console.log("GPS");
  console.log("---------------------------------");
  console.log(`Met GPS:    ${withGps}`);
  console.log(`Zonder GPS: ${withoutGps}`);

  console.log("");
  console.log("ADRES");
  console.log("---------------------------------");
  console.log(`Compleet:   ${withAddress}`);
  console.log(`Ontbreekt:  ${withoutAddress}`);

  /*
   * Toon de eerste 3 records als controle.
   */
  console.log("");
  console.log("VOORBEELD RECORDS");
  console.log("---------------------------------");

  for (const record of records.slice(0, 3)) {
    console.log(JSON.stringify(record, null, 2));
    console.log("");
  }

  /*
   * Controle op dubbele station IDs.
   */
  const ids = records.map((record) => record.station_id);
  const uniqueIds = new Set(ids);

  console.log("DUBBELE STATION IDS");
  console.log("---------------------------------");
  console.log(`Totaal IDs:   ${ids.length}`);
  console.log(`Unieke IDs:   ${uniqueIds.size}`);

  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter(
      (id, index) => ids.indexOf(id) !== index,
    );

    console.log("");
    console.log("⚠️ DUBBELE IDS:");

    console.log(
      [...new Set(duplicates)].join("\n"),
    );
  } else {
    console.log("Geen dubbele station IDs.");
  }

  console.log("");
  console.log("=================================");
  console.log("DATS24 V2 TEST KLAAR");
  console.log("=================================");
  console.log("");

} catch (error) {
  console.error("");
  console.error("❌ DATS24 V2 TEST MISLUKT");
  console.error("");

  console.error(error);

  process.exit(1);
}