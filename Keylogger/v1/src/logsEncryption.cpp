#include "logsEncryption.hpp"
#include <vector>
#include "config.hpp"
#include "aes.h" 
#include <sstream>
#include <iomanip>

// 16-byte key (128-bit AES)
const uint8_t AES_KEY[16] = {
    'Y','o','u','r','1','6','B','y','t','e','K','e','y','!','!','!'
};

// 16-byte IV (must be 16 bytes!)
const uint8_t AES_IV[16] = {
    'I','n','i','t','V','e','c','t','o','r','1','6','B','y','t','e'
};

std::vector<unsigned char> padToBlock(std::vector<unsigned char>& data) {
    size_t padLen = 16 - (data.size() % 16);
    data.insert(data.end(), padLen, static_cast<unsigned char>(padLen));
    return data;
}

std::string encryptAES_CBC(const std::string& plaintext) {
    std::vector<uint8_t> data(plaintext.begin(), plaintext.end());
    padToBlock(data); // Apply PKCS#7 padding

    std::vector<uint8_t> ciphertext(data.size());

    struct AES_ctx ctx;
    uint8_t iv[16];
    memcpy(iv, AES_IV, 16); // Must reset IV each time
    AES_init_ctx_iv(&ctx, AES_KEY, iv);
    AES_CBC_encrypt_buffer(&ctx, data.data(), data.size());

    // Convert to base64 (or hex) to store as string
    std::ostringstream oss;
    for (size_t i = 0; i < data.size(); ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << (int)data[i];
    }
    return oss.str();
}

// Helper: Convert hex string to bytes
std::vector<uint8_t> hexToBytes(const std::string& hex) {
    std::vector<uint8_t> bytes;
    for (size_t i = 0; i < hex.length(); i += 2) {
        std::string byteString = hex.substr(i, 2);
        uint8_t byte = (uint8_t) strtol(byteString.c_str(), nullptr, 16);
        bytes.push_back(byte);
    }
    return bytes;
}

// Helper: Remove PKCS#7 padding
void removePadding(std::vector<uint8_t>& data) {
    if (data.empty()) return;
    uint8_t padLen = data.back();
    if (padLen > 0 && padLen <= 16 && padLen <= data.size()) {
        data.resize(data.size() - padLen);
    }
}

std::string decryptAES_CBC(const std::string& hexCiphertext) {
    std::vector<uint8_t> ciphertext = hexToBytes(hexCiphertext);
    if (ciphertext.size() % 16 != 0) return "";

    struct AES_ctx ctx;
    uint8_t iv[16];
    memcpy(iv, AES_IV, 16);
    AES_init_ctx_iv(&ctx, AES_KEY, iv);
    AES_CBC_decrypt_buffer(&ctx, ciphertext.data(), ciphertext.size());

    removePadding(ciphertext);

    return std::string(ciphertext.begin(), ciphertext.end());
}
