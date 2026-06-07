const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();

app.use(cors());

function fetchPayport(url) {
    return new Promise((resolve, reject) => {
        https.get(
            url,
            {
                headers: {
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                    "Referer": "https://payport.flydubai.com/en/CurrencyConverter/Index",
                    "X-Requested-With": "XMLHttpRequest"
                }
            },
            response => {
                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });

                response.on("end", () => {
                    resolve({
                        statusCode: response.statusCode,
                        body: data
                    });
                });
            }
        ).on("error", reject);
    });
}

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "PayPort Proxy"
    });
});

app.get("/api/convert", async (req, res) => {
    try {
        const amount = req.query.amount || "10.00";
        const from = req.query.from || "United States Dollar (USD)";
        const to = req.query.to || "United Arab Emirates Dirham (AED)";
        const period = req.query.period || "07-Jun-2026";

        const url = new URL("https://payport.flydubai.com/en/CurrencyConverter/CurrencyCoverterCalculate");

        url.searchParams.set("sourceCurrencyAmount", amount);
        url.searchParams.set("sourceCurrencyCode", from);
        url.searchParams.set("targetCurrencyCode", to);
        url.searchParams.set("period", period);
        url.searchParams.set("_", Date.now().toString());

        const payportResponse = await fetchPayport(url.toString());

        if (payportResponse.statusCode < 200 || payportResponse.statusCode >= 300) {
            return res.status(502).json({
                error: true,
                message: "PayPort returned non-success status",
                statusCode: payportResponse.statusCode,
                body: payportResponse.body
            });
        }

        let data;

        try {
            data = JSON.parse(payportResponse.body);
        } catch (e) {
            return res.status(502).json({
                error: true,
                message: "PayPort returned non-JSON response",
                body: payportResponse.body
            });
        }

        res.json({
            error: false,
            source: "Flydubai PayPort",
            amount,
            from,
            to,
            period,
            targetValue: data.TargetValue,
            rate: data.rate,
            raw: data
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("PayPort proxy running on port " + PORT);
});
