const { SendMailClient } = require("zeptomail");

function sendEmail(args) {
  return new Promise((resolve, reject) => {
    const url = "https://api.zeptomail.com/v1.1/email";
    const token = process.env.ZEPTOMAIL_TOKEN_1;
    const fromEmail = process.env.FROM_EMAIL;
    const {
      fromName: fromName,
      toEmail: toEmail,
      toName: toName,
      subject: subject,
      htmlBody: htmlBody,
    } = args;

    let client = new SendMailClient({ url, token });

    client.sendMail({
      "from":
      {
        "address": fromEmail,
        "name": fromName
      },
      "to":
        [
          {
            "email_address":
            {
              "address": toEmail,
              "name": toName
            }
          }
        ],
      "subject": subject,
      "htmlbody": htmlBody,
    }).then((resp) => {
      return resolve(resp);
    }).catch((error) => {
      console.log(error);
      return reject(error);
    });
  });
}

module.exports = sendEmail;