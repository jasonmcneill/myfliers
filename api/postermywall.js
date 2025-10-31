exports.GET = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  // URL of this GET route is "/api/postermywall"

  // TODO:  check database for validity of state
  // TODO:  exchange code for JWT
  const tokenResponse = await fetch('https://www.postermywall.com/api/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      redirect_uri: 'https://myfliers.com/api/postermywall',
      code: code,
      grant_type: 'authorization_code',
      client_id: process.env.POSTERMYWALL_KEY,
    }),
    authorization: `Basic ${Buffer.from(`${process.env.POSTERMYWALL_KEY}:${process.env.POSTERMYWALL_SECRET}`).toString('base64')}`
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.log(errorText);
    return res.redirect(`https://myfliers.com/?error=token_exchange_failed&state=${state}`);
  }

  const tokenData = await tokenResponse.json();
  const buffer = Buffer.from(tokenData);
  const base64String = buffer.toString('base64');
  console.log('Access token data:', tokenData);

  // TODO:  store JWT in database (will be a perpetual refresh token and a short-lived access token)
  // TODO:  handle errors
  // TODO:  redirect user
  const redirectUrl = `https://myfliers.com/?userid=1&state=${state}&token=${base64String}`;
  return res.redirect(redirectUrl);
}