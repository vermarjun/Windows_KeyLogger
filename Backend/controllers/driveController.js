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
    // Redirect to frontend with success message
    const frontendUrl = 'http://localhost:5173?driveAdded=true';
    return res.redirect(frontendUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    // Redirect to frontend with error message
    const frontendUrl = 'http://localhost:5173?driveAdded=false&error=' + encodeURIComponent(err.message);
    return res.redirect(frontendUrl);
  }
};

export const getAllDrives = async (req, res) => {
  try {
    const drives = await Drive.find({});
    
    const drivesWithInfo = drives.map(drive => {
      let tokenInfo = null;
      let isExpired = false;
      let expiresAt = null;
      
      try {
        const token = JSON.parse(drive.Token);
        tokenInfo = {
          access_token: token.access_token ? 'Present' : 'Missing',
          refresh_token: token.refresh_token ? 'Present' : 'Missing',
          scope: token.scope || 'Not specified'
        };
        
        // Check if token is expired
        if (token.expiry_date) {
          const expiryDate = new Date(token.expiry_date);
          const now = new Date();
          isExpired = expiryDate < now;
          expiresAt = expiryDate;
        }
      } catch (error) {
        console.error('Error parsing token for drive:', drive.Email, error);
        tokenInfo = { error: 'Invalid token format' };
      }
      
      return {
        _id: drive._id,
        email: drive.Email,
        isFull: drive.Full,
        tokenInfo,
        isExpired,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        status: isExpired ? 'Expired' : (drive.Full ? 'Full' : 'Active')
      };
    });
    
    return res.status(200).json(drivesWithInfo);
  } catch (err) {
    console.error('Error fetching drives:', err);
    return res.status(500).json({ message: 'Failed to fetch drives', error: err.message });
  }
}; 