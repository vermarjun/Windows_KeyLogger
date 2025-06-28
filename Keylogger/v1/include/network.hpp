#pragma once
#include <string>
#include "json.hpp"

void sendLogsToBackend();
void scheduleBackendCalls(int intervalSeconds);
bool sendBatchToBackend(const std::string& hostname, const nlohmann::json& batch); 