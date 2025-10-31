exports.GET = async (req, res) => {
  const code = req.query.code ? req.query.code : '';
  const state = req.query.state ? req.query.state : '';
  const scope = req.query.scope ? req.query.scope : '';

  const base64Credentials = Buffer.from(`${process.env.POSTERMYWALL_KEY}:${process.env.POSTERMYWALL_SECRET}`).toString('base64');

  console.log("code:", code);
  console.log("state:", state);
  console.log("scope:", scope);

  const params = new URLSearchParams({
    redirect_uri: "https://myfliers.com/api/postermywall",
    grant_type: "authorization_code",
    code,
    client_id: process.env.POSTERMYWALL_KEY
  });

  try {
    const response = await fetch("https://api.postermywall.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${base64Credentials}`
      },
      body: params.toString()
    });

    const data = await response.json();

    console.log("PosterMyWall OAuth Token Response:", data);

    if (data.access_token) {
      res.redirect(`https://myfliers.com/?pmw_access_token=${data.access_token}`);
    } else {
      res.status(400).json({ error: data });
    }

  } catch (error) {
    console.error("Error fetching PosterMyWall OAuth token:", error);
    res.status(500).send("Error during PosterMyWall OAuth process");
  }
};