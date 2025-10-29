exports.GET = (req, res) => {
  console.log(req.query);

  return res.status(200).send({ msg: "ok", msgType: "success" });
}