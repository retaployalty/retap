import { Controller, Post, Body, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';
import { walletConfig, validateAppleWalletCertificates } from './config/wallet.config';
import { PKPass } from 'passkit-generator';

@Controller('apple-wallet')
export class AppleWalletController {
  @Post('generate')
  async generatePass(
    @Body() body: { cardId: string; customerName: string; cardUid: string },
    @Res() res: Response,
  ) {
    try {
      console.log('🚀 Inizio generazione pass Apple Wallet');
      console.log('📋 Card ID:', body.cardId);
      console.log('👤 Customer Name:', body.customerName);
      console.log('🆔 Card UID:', body.cardUid);

      // Configurazione del certificato
      const certificatePath = path.join(__dirname, '../certs/pass.com.retapcard.loyalty.p12');
      const wwdrPath = path.join(__dirname, '../certs/wwdr.pem');
      const certificatePassword = 'Rava06103!';

      console.log('🔐 Percorso certificato:', certificatePath);
      console.log('🔑 Password certificato:', certificatePassword);

      // Verifica che i certificati esistano
      if (!fs.existsSync(certificatePath)) {
        console.log('❌ Certificato .p12 non trovato');
        return res.status(400).json({
          error: 'Certificato Apple Wallet non configurato',
          message: 'Per utilizzare Apple Wallet, è necessario configurare i certificati',
          instructions: [
            '1. Vai su Apple Developer Console (https://developer.apple.com)',
            '2. Crea un Pass Type ID con identifier: pass.com.retapcard.loyalty',
            '3. Scarica il certificato .p12',
            '4. Scarica il certificato WWDR da: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer',
            '5. Converti il certificato WWDR in formato .pem: openssl x509 -inform der -in AppleWWDRCA.cer -out wwdr.pem',
            '6. Inserisci i certificati nella cartella apps/api-bff/certs/',
            '7. Riavvia il server',
          ],
          missingFiles: {
            p12: certificatePath,
            wwdr: wwdrPath,
          },
        });
      }

      if (!fs.existsSync(wwdrPath)) {
        console.log('❌ Certificato WWDR non trovato');
        return res.status(400).json({
          error: 'Certificato WWDR non configurato',
          message: 'Il certificato WWDR è necessario per Apple Wallet',
          instructions: [
            '1. Scarica il certificato WWDR da: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer',
            '2. Converti in formato .pem: openssl x509 -inform der -in AppleWWDRCA.cer -out wwdr.pem',
            '3. Inserisci il file wwdr.pem nella cartella apps/api-bff/certs/',
            '4. Riavvia il server',
          ],
          missingFile: wwdrPath,
        });
      }

      // Estrai certificato e chiave dal file .p12
      const p12Buffer = fs.readFileSync(certificatePath);
      const p12Der = forge.util.decode64(p12Buffer.toString('base64'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      
      let p12;
      try {
        // Prova con la password configurata
        p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificatePassword);
        console.log('✅ Certificato .p12 aperto con password configurata');
      } catch (error) {
        console.log('⚠️ Password configurata non valida, prova con password vuota...');
        try {
          // Prova con password vuota
          p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, '');
          console.log('✅ Certificato .p12 aperto con password vuota');
        } catch (error2) {
          throw new Error(`Impossibile aprire il certificato .p12. Password configurata: "${certificatePassword}", password vuota: fallita. Errore: ${error2.message}`);
        }
      }
      
      // Estrai il certificato
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
      if (!certBags || certBags.length === 0) {
        throw new Error('Nessun certificato trovato nel file .p12');
      }
      const certBag = certBags[0];
      console.log('📋 Tipo di bag certificato:', certBag.type);
      console.log('📋 Proprietà del certificato:', Object.keys(certBag));
      
      // Verifica che sia un certificato valido
      if (!certBag.cert) {
        throw new Error('Il bag non contiene un certificato valido');
      }
      const cert = certBag.cert as forge.pki.Certificate;
      const signerCert = forge.pki.certificateToPem(cert);
      
      // Estrai la chiave privata
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
      if (!keyBags || keyBags.length === 0) {
        throw new Error('Nessuna chiave privata trovata nel file .p12');
      }
      const keyBag = keyBags[0];
      console.log('🔑 Tipo di bag chiave:', keyBag.type);
      console.log('🔑 Proprietà della chiave:', Object.keys(keyBag));
      
      // Verifica che sia una chiave valida
      if (!keyBag.key) {
        throw new Error('Il bag non contiene una chiave privata valida');
      }
      const privateKey = keyBag.key as forge.pki.PrivateKey;
      const signerKey = forge.pki.privateKeyToPem(privateKey);
      
      // Leggi il certificato WWDR
      const wwdr = fs.readFileSync(wwdrPath, 'utf8');

      console.log('📄 Certificati estratti dal .p12');
      console.log('🔐 SignerCert size:', signerCert.length);
      console.log('🔑 SignerKey size:', signerKey.length);
      console.log('🌐 WWDR size:', wwdr.length);

      // Carica il modello pass e tutti i file
      const passModelPath = path.join(__dirname, '../pass-model/pass.json');
      const passModelDir = path.join(__dirname, '../pass-model');
      console.log('📄 Percorso modello pass:', passModelPath);
      
      if (!fs.existsSync(passModelPath)) {
        throw new Error(`Modello pass non trovato: ${passModelPath}`);
      }

      const passModel = JSON.parse(fs.readFileSync(passModelPath, 'utf8'));
      console.log('📋 Modello pass caricato:', JSON.stringify(passModel, null, 2));

      // Leggi tutti i file del modello
      const modelFiles: { [key: string]: Buffer } = {
        'pass.json': Buffer.from(JSON.stringify(passModel))
      };

      // Aggiungi icone e logo se esistono
      const iconFiles = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png'];
      for (const file of iconFiles) {
        const filePath = path.join(passModelDir, file);
        if (fs.existsSync(filePath)) {
          modelFiles[file] = fs.readFileSync(filePath);
          console.log(`📁 Aggiunto file: ${file}`);
        }
      }

      // Crea il pass usando il costruttore (v3.4.0)
      const pass = new PKPass(
        modelFiles,
        {
          wwdr: wwdr,
          signerCert: signerCert,
          signerKey: signerKey,
          signerKeyPassphrase: certificatePassword,
        },
        {
          // Props aggiuntive
          serialNumber: body.cardId,
          description: 'ReTap Loyalty Card',
        }
      );

      console.log('📋 Pass creato con costruttore v3.4.0');

      // Aggiungi i campi dinamicamente usando i metodi corretti
      (pass as any).setBarcodes({
        format: 'PKBarcodeFormatQR',
        message: JSON.stringify({
          type: 'retap_card',
          id: body.cardId,
          uid: body.cardUid,
        }),
        messageEncoding: 'iso-8859-1'
      });

      // Aggiungi i campi generici tramite props
      (pass as any).props.generic = {
        primaryFields: [{
          key: 'balance',
          label: 'PUNTI',
          value: '0'
        }],
        secondaryFields: [{
          key: 'name',
          label: 'NOME',
          value: body.customerName
        }],
        auxiliaryFields: [{
          key: 'card_id',
          label: 'ID CARTA',
          value: body.cardId
        }]
      };

      console.log('🔄 Campi aggiunti dinamicamente');

      // Genera il file .pkpass
      const stream = pass.getAsStream();
      console.log('📦 Stream generato');

      // Restituisci il file
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="retap-card-${body.cardId}.pkpass"`);
      
      stream.pipe(res);
      console.log('✅ File .pkpass inviato con successo');

    } catch (error) {
      console.error('❌ Errore nella generazione del pass Apple Wallet:', error);
      throw new HttpException(
        'Errore nella generazione del pass Apple Wallet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 