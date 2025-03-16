import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL,
  token: process.env.REDIS_KV_REST_API_TOKEN,
})

// function to get currency exchange rate
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == "GET") {
    try {
      // get quota left
      const requestsLeft = await fetch(`${process.env.REDIS_KV_REST_API_URL}/${process.env.EXCHANGE_RATE_API_KEY}/quota`)
      const quota = await requestsLeft.json()
      console.log(quota)
      // we need to give some buffer because the quota is not updated in real-time
      if (quota.requests_left < 10) {
        return res.status(429).json({ error: "Rate limit exceeded" })
      }

      // get exchange rate

      const exchangeRate = await fetch(`${process.env.EXCHANGE_RATE_URL}${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`) // this is unsafe
      const exchangeRateData = await exchangeRate.json()
      console.log(exchangeRateData)
      await redis.set("exchangeRate", JSON.stringify(exchangeRateData.rates))

    } catch (e: any) {
      return res.status(405).json({ error: "Method not allowed", message: e.message });
    }
  }
}