const crypto = require("crypto");

function sign(params, secret) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + secret).digest("hex");
}

exports.handler = async () => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.floor(Date.now() / 1000);

    const params = {
      sort_by: "created_at",
      max_results: 50,
      timestamp
    };

    const signature = sign(params, apiSecret);

    const body = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature
    });

    const resp = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`,
      { method: "POST", body }
    );

    const data = await resp.json();

    const items = (data.resources || []).map(r => ({
      url: r.secure_url,
      resource_type: "image"
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: e.message })
    };
  }
};
