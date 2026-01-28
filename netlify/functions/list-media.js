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
    const folder = "poze-nunta";

    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      expression: `folder:${folder}/*`,
      sort_by: "created_at",
      max_results: 100,
      timestamp
    };

    const signature = sign(params, apiSecret);

    const body = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature
    });

    const resp = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
      { method: "POST", body }
    );

    const data = await resp.json();
    const items = (data.resources || []).map(r => ({
      url: r.secure_url,
      resource_type: r.resource_type
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items)
    };
  } catch {
    return { statusCode: 500, body: "Server error" };
  }
};
