#include <fstream>
#include "network.hpp"
#include "logger_utils.hpp"
#include "config.hpp"
#include <windows.h>
#include <wininet.h>
#include <iostream>
#include <thread>
#include <json.hpp>

extern const Config* g_config_ptr;

void sendLogsToBackend(const Config& config) {
    std::cout << "[DEBUG] Entered sendLogsToBackend()" << std::endl;
    std::lock_guard<std::mutex> lock(log_mutex);
    std::cout << "[DEBUG] Acquired log_mutex" << std::endl;
    
    // Get logs as JSON array directly (this function already handles file reading)
    nlohmann::json logsArray = getLogsAsJsonArray(config.log_file_name);
    std::cout << "[DEBUG] Got logs as JSON array, size: " << logsArray.size() << std::endl;
    
    if (logsArray.empty()) {
        std::cout << "[INFO] No logs to upload. Skipping upload.\n";
        return;
    }
    
    std::string hostname = getUserName();
    std::cout << "[DEBUG] Hostname: " << hostname << std::endl;
    
    // Send all logs in one request - server will handle batching
    bool uploadSuccess = sendBatchToBackend(hostname, logsArray, config);
    
    if (uploadSuccess) {
        // Clear the log file after successful upload
        std::ofstream clearFile(config.log_file_name, std::ios::out | std::ios::trunc);
        clearFile.close();
        std::cout << "[INFO] Logs cleared after successful upload.\n";
    } else {
        std::cerr << "[ERROR] Upload failed. Logs not cleared.\n";
    }
    
    std::cout << "[DEBUG] Exiting sendLogsToBackend()" << std::endl;
}

bool sendBatchToBackend(const std::string& hostname, const nlohmann::json& batch, const Config& config) {
    HINTERNET hSession = InternetOpenA("LogUploader", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hSession) {
        std::cerr << "[ERROR] Failed to open Internet session. Error: " << GetLastError() << std::endl;
        return false;
    }
    
    HINTERNET hConnect = InternetConnectA(hSession, config.serverName.c_str(), config.backend_port, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        std::cerr << "[ERROR] Failed to connect to server. Error: " << GetLastError() << std::endl;
        InternetCloseHandle(hSession);
        return false;
    }
    
    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", config.resource.c_str(), NULL, NULL, NULL, 0, 0);
    if (!hRequest) {
        std::cerr << "[ERROR] Failed to open HTTP request. Error: " << GetLastError() << std::endl;
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return false;
    }
    
    // Create request body
    std::string body = "{\"logs\":" + batch.dump() + ",\"hostname\":\"" + hostname + "\"}";
    std::string headers = "Content-Type: application/json\r\n";
    
    BOOL bRequestSent = HttpSendRequestA(
        hRequest,
        headers.c_str(),
        headers.length(),
        (LPVOID)body.c_str(),
        body.size()
    );
    
    bool success = false;
    if (bRequestSent) {
        char responseBuffer[4096] = { 0 };
        DWORD bytesRead = 0;
        BOOL bRead = InternetReadFile(hRequest, responseBuffer, sizeof(responseBuffer) - 1, &bytesRead);
        if (bRead && bytesRead > 0) {
            responseBuffer[bytesRead] = '\0';
            std::string response(responseBuffer);
            response.erase(0, response.find_first_not_of(" \t\n\r"));
            response.erase(response.find_last_not_of(" \t\n\r") + 1);
            std::cout << "[DEBUG] Server response: " << response << std::endl;
            
            // Check for success in the new response format
            if (response.find("\"success\":true") != std::string::npos) {
                success = true;
                // Parse config from response and update
                try {
                    auto jsonResp = nlohmann::json::parse(response);
                    if (jsonResp.contains("config")) {
                        const nlohmann::json& configJson = jsonResp["config"];
                        if (g_config_ptr) {
                            auto* cfg = const_cast<Config*>(g_config_ptr);
                            cfg->updateFromJson(configJson);
                            cfg->saveToFile(Config::getStateFilePath());
                        }
                    }
                } catch (...) {
                    std::cerr << "[WARN] Could not parse config from backend response.\n";
                }
            } else {
                std::cerr << "[ERROR] Upload failed. Server response not successful.\n";
            }
        } else {
            std::cerr << "[ERROR] Failed to read server response. Error: " << GetLastError() << std::endl;
        }
    } else {
        std::cerr << "[ERROR] Failed to send HTTP request. Error: " << GetLastError() << std::endl;
    }
    
    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hSession);
    
    return success;
}

void scheduleBackendCalls(int intervalSeconds, const Config& config) {
    std::cout << "[DEBUG] scheduleBackendCalls started with interval: " << intervalSeconds << std::endl;
    while (true) {
        try {
            sendLogsToBackend(config);
        } catch (const std::exception& e) {
            std::cerr << "[FATAL] Exception in sendLogsToBackend: " << e.what() << std::endl;
        }
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
} 