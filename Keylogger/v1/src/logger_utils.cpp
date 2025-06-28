#include <fstream>
#include "logger_utils.hpp"
#include "config.hpp"
#include <iostream>
#include <cstdio>
#include <windows.h>

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
    std::lock_guard<std::mutex> lock(log_mutex);
    std::ifstream logFile;
    if (!safeOpenFile(filename, logFile)) return nlohmann::json::array();
    std::string line;
    nlohmann::json logs = nlohmann::json::array();
    int lineNum = 0;
    while (getline(logFile, line)) {
        ++lineNum;
        if (!line.empty()) {
            try {
                logs.push_back(nlohmann::json::parse(line));
            } catch (const std::exception& e) {
                std::cerr << "[ERROR] JSON parse error at line " << lineNum << ": " << e.what() << std::endl;
                backupCorruptedLog(filename);
                break;
            }
        }
    }
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