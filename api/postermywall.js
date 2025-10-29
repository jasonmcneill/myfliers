exports.GET = (req, res) => {
  console.log(req.params);

  return res.status(200).send({ msg: "ok", msgType: "success" });
}