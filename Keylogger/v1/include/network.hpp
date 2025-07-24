#pragma once
#include <string>
#include "json.hpp"
#include "config.hpp"

void sendLogsToBackend(const Config& config);
void scheduleBackendCalls(int intervalSeconds, const Config& config);
bool sendBatchToBackend(const std::string& hostname, const nlohmann::json& batch, const Config& config); 