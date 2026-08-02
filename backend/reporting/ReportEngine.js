class ReportEngine {
  print(summary) {
    console.log("");
    console.log("======================================================");
    console.log("              FUELALERT SCRAPER REPORT");
    console.log("======================================================");

    for (const scraper of summary) {
      console.log("");
      console.log(`Source        : ${scraper.source}`);
      console.log(`Success       : ${scraper.success ? "YES" : "NO"}`);
      console.log(`Stations      : ${scraper.station_count}`);
      console.log(`Inserted      : ${scraper.inserted}`);
      console.log(`Updated       : ${scraper.updated}`);
      console.log(`Skipped       : ${scraper.skipped}`);
      console.log(`Duplicates    : ${scraper.duplicates}`);
      console.log(`Errors        : ${scraper.errors}`);
      console.log(`Duration      : ${scraper.duration} ms`);

      if (!scraper.success && scraper.error) {
        console.log(`Reason        : ${scraper.error}`);
      }

      console.log("------------------------------------------------------");
    }

    console.log("======================================================");
    console.log("");
  }
}

export default new ReportEngine();
