#pragma once
#include <vector>
#include <string>

std::vector<unsigned char> padToBlock(std::vector<unsigned char>& data);
std::string encryptAES_CBC(const std::string& plaintext);
std::string decryptAES_CBC(const std::string& hexCiphertext);
