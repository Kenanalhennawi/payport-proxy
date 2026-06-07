const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/api/convert", async (req, res) => {
    try {
        const {
            amount = "10.00",
            from = "United States Dollar (USD)",
            to = "United Arab Emirates Dirham (AED)",
            period = "07-Jun-2026"
        } = req.query;

        const url = new URL("https://payport.flydubai.com/en/CurrencyConverter/CurrencyCoverterCalculate");

        url.searchParams.set("sourceCurrencyAmount", amount);
        url.searchParams.set("sourceCurrencyCode", from);
        url.searchParams.set("targetCurrencyCode", to);
        url.searchParams.set("period", period);
        url.searchParams.set("_", Date.now().toString());

        const response = await fetch(url.toString(), {
            headers: {
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://payport.flydubai.com/en/CurrencyConverter/Index"
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: true,
                message: "PayPort request failed",
                status: response.status
            });
        }

        const data = await response.json();

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
    console.log(`PayPort proxy running on port ${PORT}`);
});
