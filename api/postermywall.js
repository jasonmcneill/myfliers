exports.GET = (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  return res.status(200).send({ msg: "ok", msgType: "success" });
}