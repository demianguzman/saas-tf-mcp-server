import keytar from 'keytar';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const SERVICE_NAME = 'saastf-mcp';
const ACCOUNT_NAME = 'jwt-token';
const FALLBACK_DIR = join(homedir(), '.saastf-mcp');
const FALLBACK_FILE = join(FALLBACK_DIR, 'credentials.enc');

export class AuthManager {
  private useKeychain = true;

  constructor() {
    this.checkKeychainAvailability();
  }

  private async checkKeychainAvailability(): Promise<void> {
    try {
      // Test keychain access
      await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      this.useKeychain = true;
    } catch (error) {
      console.warn('Keychain not available, using encrypted file fallback');
      this.useKeychain = false;
    }
  }

  async storeToken(token: string): Promise<void> {
    try {
      if (this.useKeychain) {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
      } else {
        await this.storeTokenFallback(token);
      }
    } catch (error) {
      // If keychain fails, try fallback
      if (this.useKeychain) {
        console.warn('Keychain storage failed, using encrypted file fallback');
        this.useKeychain = false;
        await this.storeTokenFallback(token);
      } else {
        throw error;
      }
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (this.useKeychain) {
        return await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      } else {
        return await this.getTokenFallback();
      }
    } catch (error) {
      // If keychain fails, try fallback
      if (this.useKeychain) {
        console.warn('Keychain retrieval failed, trying encrypted file fallback');
        this.useKeychain = false;
        return await this.getTokenFallback();
      }
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      if (this.useKeychain) {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      } else {
        await this.clearTokenFallback();
      }
    } catch (error) {
      // Try both methods to ensure cleanup
      try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      } catch {}
      try {
        await this.clearTokenFallback();
      } catch {}
    }
  }

  // Encrypted file fallback methods
  private async storeTokenFallback(token: string): Promise<void> {
    try {
      await fs.mkdir(FALLBACK_DIR, { recursive: true });

      // Generate encryption key from machine-specific data
      const key = await this.getEncryptionKey();
      const iv = randomBytes(16);

      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Store IV + encrypted data
      const data = {
        iv: iv.toString('hex'),
        encrypted,
      };

      await fs.writeFile(FALLBACK_FILE, JSON.stringify(data), 'utf8');
      await fs.chmod(FALLBACK_FILE, 0o600); // Restrict to user only
    } catch (error) {
      throw new Error(`Failed to store token in fallback: ${error}`);
    }
  }

  private async getTokenFallback(): Promise<string | null> {
    try {
      const fileContent = await fs.readFile(FALLBACK_FILE, 'utf8');
      const data = JSON.parse(fileContent);

      const key = await this.getEncryptionKey();
      const iv = Buffer.from(data.iv, 'hex');

      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to retrieve token from fallback: ${error}`);
    }
  }

  private async clearTokenFallback(): Promise<void> {
    try {
      await fs.unlink(FALLBACK_FILE);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async getEncryptionKey(): Promise<Buffer> {
    // Generate key from machine-specific data
    // This is basic - in production you'd want more robust key derivation
    const machineId = homedir() + process.platform + SERVICE_NAME;
    const key = (await scryptAsync(machineId, 'salt', 32)) as Buffer;
    return key;
  }
}
