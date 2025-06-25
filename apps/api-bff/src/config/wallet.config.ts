import * as path from 'path';
import * as fs from 'fs';

export interface WalletConfig {
  apple: {
    certPath: string;
    wwdrPath: string;
    certPassword: string;
    passTypeIdentifier: string;
    teamIdentifier: string;
  };
  google: {
    // Configurazione futura per Google Wallet
  };
}

export const walletConfig: WalletConfig = {
  apple: {
    certPath: path.join(__dirname, '../../certs/pass.com.retapcard.loyalty.p12'),
    wwdrPath: path.join(__dirname, '../../certs/AppleWWDRCAG3.cer'),
    certPassword: process.env.APPLE_WALLET_CERT_PASSWORD || 'Rava06103!',
    passTypeIdentifier: 'pass.com.retapcard.loyalty',
    teamIdentifier: '78S7N29429',
  },
  google: {
    // Configurazione futura per Google Wallet
  },
};

export function validateAppleWalletCertificates(): void {
  const { certPath, wwdrPath } = walletConfig.apple;
  
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificato Pass Type ID non trovato: ${certPath}`);
  }
  
  if (!fs.existsSync(wwdrPath)) {
    throw new Error(`Certificato WWDR non trovato: ${wwdrPath}`);
  }
} 