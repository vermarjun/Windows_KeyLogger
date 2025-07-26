import { google } from 'googleapis';
import Drive from '../models/Drive.js';
import { oAUTH_SCOPES, client_id, client_secret, redirect_uris } from '../config.js';

export const getGoogleOAuthUrl = (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: oAUTH_SCOPES,
    prompt: 'consent',
  });
  return res.status(200).json({ url: authUrl });
};

export const handleGoogleOAuthCallback = async (req, res) => {
  const code = req.query.code;
  
  // console.log(code);

  if (!code) return res.status(400).json({ message: 'Missing code in query.' });
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // console.log("OBTAINED TOKEN:", tokens);
    
    // Get user info using OAuth2 API
    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: 'v2',
    });
    const userInfoResponse = await oauth2.userinfo.get();
    const gmail = userInfoResponse.data.email;

    // Save or update the token in the Drive model
    let drive = await Drive.findOne({ Email: gmail });
    if (!drive) {
      drive = new Drive({ Email: gmail, Token: JSON.stringify(tokens) });
    } else {
      drive.Token = JSON.stringify(tokens);
    }
    await drive.save();
    return res.status(200).json({ message: 'Google OAuth token saved to your account.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to exchange code for token', error: err.message });
  }
}; 