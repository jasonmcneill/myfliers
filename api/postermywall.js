exports.GET = (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  // URL of this GET route is "/api/postermywall"

  // TODO:  check database for validity of state
  // TODO:  exchange code for JWT
  // TODO:  store JWT in database (will be a perpetual refresh token and a short-lived access token)
  // TODO:  handle errors
  // TODO:  redirect user

  return res.redirect(`/?userid=1&state=${state}`);
}