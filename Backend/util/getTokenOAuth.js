// getToken.js
import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';

const CREDENTIALS_PATH = '../oAuthCredentials.json';
const TOKEN_PATH = './token.json';

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// oAuth2Client.on('tokens', (tokens) => {
//   if (tokens.refresh_token) {
//     fs.writeFileSync('./token.json', JSON.stringify(oAuth2Client.credentials));
//   }
// });

// Ask user to authorize
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this URL:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nEnter the code from that page here: ', async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('✅ Token saved to', TOKEN_PATH);
  rl.close();
});
