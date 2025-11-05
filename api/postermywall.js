exports.GET = async (req, res) => {
  const code = req.query.code ? req.query.code : '';
  const state = req.query.state ? req.query.state : '';
  const scope = req.query.scope ? req.query.scope : '';

  const base64Credentials = Buffer.from(`${process.env.POSTERMYWALL_KEY}:${process.env.POSTERMYWALL_SECRET}`).toString('base64');

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

    /*
      Example response:
      {
        access_token: 'P4qfdKdetpdNWvESOvQ8EAyjmIuO',
        token_type: 'Bearer',
        expires_in: '863999',
        refresh_token: 'Jn70mZrzsXRnePq6vg4GWfco36H64AAm',
        user_id: '27778265'
      }
    */

    if (data.access_token) {
      res.redirect(`https://myfliers.com/`);
    } else {
      res.status(400).json({ error: data });
    }

  } catch (error) {
    console.error("Error fetching PosterMyWall OAuth token:", error);
    res.status(500).send("Error during PosterMyWall OAuth process");
  }
};