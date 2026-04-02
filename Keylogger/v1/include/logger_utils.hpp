#pragma once
#include <string>
#include <fstream>
#include <mutex>
#include <json.hpp>

extern std::mutex log_mutex;
bool safeOpenFile(const std::string& filename, std::ifstream& file);
void backupCorruptedLog(const std::string& filename);
nlohmann::json getLogsAsJsonArray(const std::string& filename);
std::string getUserName(); 