const express = require("express");
const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const jsonwebtoken = require("jsonwebtoken");
  if (!token)
    return res
      .status(400)
      .send({ msg: "missing access token", msgType: "error" });

  jsonwebtoken.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, userdata) => {
      if (err)
        return res
          .status(403)
          .send({ msg: "invalid access token", msgType: "error", err: err });
      req.user = userdata;
      next();
    }
  );
};

const refreshToken = require("./refresh-token");
router.post("/refresh-token", refreshToken.POST);

const postermywall = require("./postermywall");
router.get("/postermywall", postermywall.GET);

const canva = require("./canva");
router.get("/canva", canva.GET);

module.exports = router;
