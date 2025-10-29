exports.POST = (req, res) => {
  const jsonwebtoken = require("jsonwebtoken");
  const db = require("../../db");
  const refreshToken = req.body.refreshToken || "";

  if (!refreshToken.length)
    return res
      .status(400)
      .send({ msg: "refresh token missing", msgType: "error" });

  jsonwebtoken.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, userdata) => {
      if (err) {
        return res
          .status(403)
          .send({ msg: "invalid refresh token", msgType: "error" });
      }

      const now = Date.now().valueOf() / 1000;
      if (now > userdata.exp) {
        return res
          .status(400)
          .send({ msg: "refresh token expired", msgType: "error" });
      }

      const id = userdata.id;
      const sql = `
        SELECT
          id,
          username,
          status,
          firstname,
          lastname,
          email,
          gender,
          mailingList,
          lang,
          subscribeduntil,
          createdAt
        FROM
          users
        WHERE
          id = ?
        LIMIT 1
        ;
      `;
      db.query(sql, [id], (err, result) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .send({ msg: "unable to query for id", msgType: "error" });
        }

        if (!result.length) {
          return res
            .status(404)
            .send({ msg: "user not found", msgType: "error" });
        }

        const id = result[0].id;
        const username = result[0].username;
        const status = result[0].status;
        const firstname = result[0].firstname;
        const lastname = result[0].lastname;
        const email = result[0].email;
        const gender = result[0].gender;
        const mailingList = result[0].mailingList;
        const lang = result[0].lang;
        const subscribeduntil = result[0].subscribeduntil;
        const createdAt = result[0].createdAt;

        const refreshToken = jsonwebtoken.sign(
          {
            id: id,
            username: username,
            status: status,
            firstname: firstname,
            lastname: lastname,
            email: email,
            gender: gender,
            mailingList: mailingList,
            lang: lang,
            subscribeduntil: subscribeduntil,
            createdAt: createdAt,
          },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "30d" }
        );

        const accessToken = jsonwebtoken.sign(
          {
            id: id,
            username: username,
            status: status,
            firstname: firstname,
            lastname: lastname,
            email: email,
            gender: gender,
            mailingList: mailingList,
            lang: lang,
            subscribeduntil: subscribeduntil,
            createdAt: createdAt,
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "10m" }
        );

        return res.status(200).send({
          msg: "tokens renewed",
          msgType: "success",
          refreshToken: refreshToken,
          accessToken: accessToken,
        });
      });
    }
  );
};
