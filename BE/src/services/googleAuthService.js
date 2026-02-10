const axios = require("axios");

module.exports.verifyGoogleAccessToken = async (accessToken) => {
  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
    sub: data.sub,
    email_verified: data.email_verified,
  };
};
