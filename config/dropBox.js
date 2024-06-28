import { Dropbox } from "dropbox";
import axios from "axios";
import fetch from "isomorphic-fetch";

var appKey = "ltqyffujltxm03j";
var appSecret = "080fgizhwloho2a";
var redirectUri = "http://localhost:4000/api/file/dbx/callback";
let refreshToken = "";
let accessToken =
  "sl.B4B25Hyh0hJ7BSmU_sWeDNBYPRsKy4NVXpFgBhoXQ64EnOc7hRX2plrZ8czO1piiCuCSq2FRFcUFY7RN3b0nedqMeHUqa-pW7EDCYcXLM_pvL9GkOLYr1eYPXwpHLUOqBYPlM6NxOvHS";

// Initialize a new Dropbox client with the access token from environment variables
const dbx = new Dropbox({
  accessToken: accessToken,
  fetch,
});

export const loginDBX = (req, res) => {
  var authUrl =
    "https://www.dropbox.com/oauth2/authorize" +
    "?response_type=code" +
    "&client_id=" +
    appKey +
    "&redirect_uri=" +
    redirectUri +
    "&token_access_type=offline";

  res.redirect(authUrl);
};

export const callbackDBX = async (req, res) => {
  var authCode = req.query.code;

  try {
    const response = await axios.post(
      "https://api.dropboxapi.com/oauth2/token",
      null,
      {
        params: {
          code: authCode,
          grant_type: "authorization_code",
          client_id: appKey,
          client_secret: appSecret,
          redirect_uri: redirectUri,
        },
      }
    );

    var data = response.data;
    accessToken = data.access_token;
    refreshToken = data.refresh_token;

    // Now you can use the access token and refresh token
    res.send("Logged in!!" + accessToken);
  } catch (error) {
    res.status(500).send("Error during Dropbox authentication");
  }
};
export const getAccessToken = async () => {
  const response = await axios.post(
    "https://api.dropboxapi.com/oauth2/token",
    null,
    {
      params: {
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        client_id: appKey,
        client_secret: appSecret,
      },
    }
  );
  accessToken = response.data.access_token;
  // console.log(response.data.access_token);
  return response;
};

// export default dbx;
