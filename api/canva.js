exports.POST = async (req, res) => {
  res.status(200).json({
    msg: "Test",
  });
};

exports.GET = async (req, res) => {
  const code = req.query.code ? req.query.code : '';
  const state = req.query.state ? req.query.state : '';

  console.log("Canva OAuth Code:", code);
  console.log("Canva State:", state);

  res.status(200).json({
    msg: "Canva GET endpoint",
  });
}