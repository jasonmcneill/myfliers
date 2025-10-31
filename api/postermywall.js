exports.GET = async (req, res) => {
  const code = req.query.code ? req.query.code : '';
  const state = req.query.state ? req.query.state : '';
  const scope = req.query.scope ? req.query.scope : '';

  const base64Credentials = Buffer.from(`${process.env.POSTERMYWALL_KEY}:${process.env.POSTERMYWALL_SECRET}`).toString('base64');

  fetch('https://api.postermywall.com/v1/oauth/token', {
    method: 'POST',
    body: {
      redirect_uri: "https://myfliers.com/api/postermywall",
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.POSTERMYWALL_KEY,
    },
    headers: new Headers({
      content_type: 'application/x-www-form-urlencoded',
      authorization: `Basic ${base64Credentials}`
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log('PosterMyWall OAuth Token Response:', data);
      res.redirect(`https://myfliers.com/?pmw_access_token=${data.access_token}`);
    })
    .catch(error => {
      console.error('Error fetching PosterMyWall OAuth token:', error);
      res.status(500).send('Error during PosterMyWall OAuth process');
    });
}