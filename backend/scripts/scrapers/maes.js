import axios from "axios";
import * as cheerio from "cheerio";

export default async function scrapeMaes(url) {

    try {

        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const $ = cheerio.load(data);

        const prices = {};

        $(".gasstation-price-box").each((i, el) => {

            const fuel = $(el).find("h4").text().trim();

            const priceText = $(el)
                .find(".price-box")
                .text()
                .replace("€", "")
                .trim()
                .replace(",", ".");

            const price = parseFloat(priceText);

            if (fuel.includes("95"))
                prices.benzine95 = price;

            else if (fuel.includes("98"))
                prices.benzine98 = price;

            else if (fuel.includes("Diesel B7"))
                prices.diesel = price;

            else if (fuel.includes("LPG"))
                prices.lpg = price;

            else if (fuel.includes("AdBlue"))
                prices.adblue = price;

            else if (fuel.includes("Supremium Diesel"))
                prices.supremium = price;

        });

        return prices;

    } catch (err) {

        console.error(err);

        return null;

    }

}