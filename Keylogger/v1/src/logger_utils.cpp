#include <fstream>
#include "logger_utils.hpp"
#include "config.hpp"
#include <iostream>
#include <cstdio>
#include <windows.h>
#include <vector>

std::mutex log_mutex;

bool safeOpenFile(const std::string& filename, std::ifstream& file) {
    file.open(filename);
    if (!file.is_open()) {
        std::cerr << "[ERROR] Failed to open file: " << filename << std::endl;
        return false;
    }
    return true;
}

void backupCorruptedLog(const std::string& filename) {
    std::string backupName = filename + ".bak";
    std::remove(backupName.c_str());
    std::rename(filename.c_str(), backupName.c_str());
    std::cerr << "[WARN] Log file backed up as: " << backupName << std::endl;
}

nlohmann::json getLogsAsJsonArray(const std::string& filename) {
    std::cout << "[DEBUG] getLogsAsJsonArray: Starting to read file: " << filename << std::endl;
    // Remove mutex lock here since it's already locked in sendLogsToBackend()
    // std::lock_guard<std::mutex> lock(log_mutex);
    std::cout << "[DEBUG] getLogsAsJsonArray: Mutex already locked by caller" << std::endl;
    
    std::ifstream logFile;
    if (!safeOpenFile(filename, logFile)) {
        std::cout << "[DEBUG] getLogsAsJsonArray: Failed to open file" << std::endl;
        return nlohmann::json::array();
    }
    std::cout << "[DEBUG] getLogsAsJsonArray: File opened successfully" << std::endl;
    
    // Read all lines from the file
    std::vector<std::string> lines;
    std::string line;
    while (getline(logFile, line)) {
        lines.push_back(line);
    }
    
    std::cout << "[DEBUG] getLogsAsJsonArray: Read " << lines.size() << " lines total" << std::endl;
    
    nlohmann::json logs = nlohmann::json::array();
    int processedLines = 0;
    
    // Process all lines in the file
    for (int i = 0; i < lines.size(); i++) {
        if (!lines[i].empty()) {
            try {
                logs.push_back(nlohmann::json::parse(lines[i]));
                processedLines++;
            } catch (const std::exception& e) {
                std::cerr << "[ERROR] JSON parse error at line " << i + 1 << ": " << e.what() << std::endl;
                // Don't break, continue processing other lines
            }
        }
    }
    
    std::cout << "[DEBUG] getLogsAsJsonArray: Completed. Processed: " << processedLines << " lines" << std::endl;
    return logs;
}

std::string getUserName() {
    char computerName[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = sizeof(computerName);
    if (GetComputerNameA(computerName, &size)) {
        return computerName;
    }
    return "";
} 