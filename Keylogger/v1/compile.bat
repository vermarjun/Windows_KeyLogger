@echo off
echo Compiling keylogger project...
g++ -std=c++17 -I include -o keylogger.exe src/*.cpp -lwininet -luser32 -lkernel32
if %ERRORLEVEL% EQU 0 (
    echo Compilation successful!
    echo You can now run: keylogger.exe
) else (
    echo Compilation failed!
)
pause 