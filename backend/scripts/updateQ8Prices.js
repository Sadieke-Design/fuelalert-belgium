import axios from "axios";
import * as cheerio from "cheerio";
import pool from "../config/database.js";

async function extractPrice(html, fuelName) {
  const regex = new RegExp(
      `${fuelName}[\\s\\S]*?Pompprijs.*?([0-9]+\\.[0-9]{3})`,
          "i"
            );

              const match = html.match(regex);

                return match ? parseFloat(match[1]) : null;
                }

                async function run() {
                  const [stations] = await pool.query(`
                      SELECT id, name, website
                          FROM stations
                              WHERE brand LIKE '%Q8%'
                                    AND website IS NOT NULL
                                      `);

                                        console.log(`🚗 ${stations.length} Q8 stations gevonden`);

                                          let updated = 0;
                                            let failed = 0;

                                              for (const station of stations) {
                                                  try {
                                                        const response = await axios.get(station.website, {
                                                                timeout: 15000,
                                                                      });

                                                                            const html = cheerio.load(response.data)("body").text();

                                                                                  const benzine95 = await extractPrice(html, "Euro 95");
                                                                                        const diesel = await extractPrice(html, "Diesel");
                                                                                              const benzine98 = await extractPrice(html, "Superplus 98");

                                                                                                    await pool.query(
                                                                                                            `
                                                                                                                    UPDATE stations
                                                                                                                            SET
                                                                                                                                      benzine95 = ?,
                                                                                                                                                diesel = ?,
                                                                                                                                                          benzine98 = ?,
                                                                                                                                                                    last_update = NOW()
                                                                                                                                                                            WHERE id = ?
                                                                                                                                                                                  `,
                                                                                                                                                                                          [
                                                                                                                                                                                                    benzine95,
                                                                                                                                                                                                              diesel,
                                                                                                                                                                                                                        benzine98,
                                                                                                                                                                                                                                  station.id,
                                                                                                                                                                                                                                          ]
                                                                                                                                                                                                                                                );

                                                                                                                                                                                                                                                      updated++;

                                                                                                                                                                                                                                                            console.log(
                                                                                                                                                                                                                                                                    `✅ ${station.name} | 95=${benzine95} | D=${diesel} | 98=${benzine98}`
                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                                                                                                                    failed++;

                                                                                                                                                                                                                                                                                          console.log(
                                                                                                                                                                                                                                                                                                  `❌ ${station.name} -> ${err.message}`
                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                console.log("");
                                                                                                                                                                                                                                                                                                                  console.log("=================================");
                                                                                                                                                                                                                                                                                                                    console.log(`✅ Bijgewerkt: ${updated}`);
                                                                                                                                                                                                                                                                                                                      console.log(`❌ Mislukt: ${failed}`);
                                                                                                                                                                                                                                                                                                                        console.log("=================================");

                                                                                                                                                                                                                                                                                                                          process.exit(0);
                                                                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                                                                          run().catch(console.error);