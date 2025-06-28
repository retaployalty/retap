import { Controller, Post, Body } from '@nestjs/common';
import { google } from 'googleapis';
import * as jwt from 'jsonwebtoken';

@Controller('google-wallet')
export class GoogleWalletController {
  private readonly issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022918092';
  private readonly serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || 'retap-wallet-212@retap-460215.iam.gserviceaccount.com';
  private readonly privateKey = (process.env.GOOGLE_WALLET_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDekvbfNZt7p4gx
VzrWBHdWFCIk4m0J65M9HzROKRFZTdK9IwCKiQsD4db6vqqHKbMfTvtN1MmAJfUb
e6dsH1Us922PlmMwhBq/nEGWCEcujyq8iujDK8Bprxr01Ye0GoKaSA3t7PBTkha6
5yt7tEb2YVyjosaxYjLQsGwyjQ8aJDTVR8Lh3y/+a4PZ/Wd74WwD+/akuHUgXWFv
6KzDmRe1Kye+sDS3F0KG/nZFHxKhkK9FW4T8ZbiIdxC41jlpxc7z6+UC3l3MVWnn
jaZDTFxeN9VqfL+v2ub0WYvJu6bgRkQmdwDOFfCA0Isug9tcSRYUXwT4MG3mzwlZ
MBB/HslBAgMBAAECggEABOWCPO0ONQZNmjKIW8xKiu43pbSlpARiw3NQ8nvfvt19
9olPQBT5jRfoK6EzgaSJrU1+vMayycT4AV8vItNGA6akOl6bUzZCS4MovBgFtx75
IG+MxSuslJSgouiSTxx+0V2mwQxjiX6hHXKzzal8vsuLuvm8HduWeSnq8PIijhNZ
pZhFejk2lV08nrunhKM2FT9rtjFoHxZmZBML5qDmYPZe6wV6VB483TMYqzm7jYoF
UzR3kJ4pVC4BMDRnWbW17oWUr+9zk3ctN7Ju3P7OJ7AdN7NjYHXkoU+piUlBuhD0
gGuoaJCVhVzpKP+uDc2ML4jgaPc45/tZqNUiBBSRoQKBgQDvQNOLv2IYMckBHAIy
wjHrz55f6+C8ou2DZ4ye21/+huXbQSuNA1PE/T3iWu9DF9xeXvujXbLkZXZ1FPSw
sHQqHJpvJ3Id7CS9Ar6P35x5dgUPfWPDPelpyNzpS3intkd4T0+ZF0aSMdMyno4o
mDtlfd2OvRyMseYNfIhPYaTgYQKBgQDuJ0PBxQrldX8sg+eCBbNj3n5MyagHgR+A
/ypZFUC0TsqqiwrMlX6tvVcFSLQ7EVQ8nkGaqMYMNldldAvIevwzxHS6xkkTB4CM
sH3G/qpWtZzxI5KQ/mkUmKOE8cn3Y3KL614DLqV+bDXHEF+w8BS6QXpDj3SPiFP3
G4f1om4U4QKBgGiKTuUVLuubdVTCxEMhj2aWRYFsM7q5BkcQi+UtvfgdQXpYM4te
FNBSRyQMz9blKikiH5n2ayBZJTVrfq9lqpxr+x7ugXKJqFPeSx3aeyinZPart1es
Sb0rQzu8+m9tujTbktA112Qx2TKZDUy3l9x07sZb44mmgfsKmxT0eXKBAoGBANzv
okVeRniPI3cpu5l9LmpFHAiiv/aOTKrAjgns1IUx34SNz2vyeH43/EYTp9hwgCRo
cNZJIsprk3K0UMYhil2AMQahM2Oq/xAGH/l/golEnR98b9mBm/yWioSoR0Txhm/V
3/a1zKRXQSC2yP9+CsysN//7UxhhUfwaF2zCzrshAoGBAIHlnR0NXNCPZvW17MnF
9ZcKzkjGPT1AsWsrEU0n5+7Eg7WCBkOC4nk7dEIHpgDD1r4F5rLwYimpBGUyrTnx
bgXcMc/NC84FVcIwygUgbdepC9AfFJ998X1CFlhDB5ALszZ9q6Dr4DhWDF3478v9
8xN9xjWMYEUFHCSu0S9lPfA5
-----END PRIVATE KEY-----`).replace(/\\n/g, '\n');
  private readonly privateKeyId = process.env.GOOGLE_WALLET_PRIVATE_KEY_ID || '3be4fed613691c1bfdae290fc499c8b2be84697e';
  private readonly projectId = process.env.GOOGLE_WALLET_PROJECT_ID || 'retap-460215';
  private readonly clientId = process.env.GOOGLE_WALLET_CLIENT_ID || '101881625879357914024';

  @Post('generate')
  async generatePass(@Body() body: { cardId: string; customerName: string; cardUid: string }) {
    try {
      console.log('Generazione pass Google Wallet per carta:', body.cardId);

      // Verifica che le variabili d'ambiente siano configurate
      if (!process.env.GOOGLE_WALLET_PRIVATE_KEY) {
        console.warn('⚠️ GOOGLE_WALLET_PRIVATE_KEY non configurata, usando valore di fallback');
      } else {
        console.log('✅ GOOGLE_WALLET_PRIVATE_KEY configurata dalle variabili d\'ambiente');
        console.log('🔑 Chiave privata (primi 50 caratteri):', this.privateKey.substring(0, 50));
        console.log('🔑 Chiave privata contiene \\n:', this.privateKey.includes('\\n'));
        console.log('🔑 Chiave privata contiene newline reali:', this.privateKey.includes('\n'));
      }

      // Crea il client Google Wallet
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: this.projectId,
          private_key_id: this.privateKeyId,
          private_key: this.privateKey,
          client_email: this.serviceAccountEmail,
          client_id: this.clientId
        },
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
      });

      const walletobjects = google.walletobjects({
        version: 'v1',
        auth
      });

      // Crea o aggiorna la classe del pass
      const classId = `${this.issuerId}.retap_loyalty`;
      const passClass = {
        id: classId,
        issuerName: 'ReTap',
        programName: 'ReTap Loyalty',
        programLogo: {
          sourceUri: {
            uri: 'https://i.ibb.co/mCDvGs8M/160x160.png'
          }
        },
        reviewStatus: 'APPROVED',
        allowMultipleUsersPerObject: false,
        locations: [
          {
            latitude: 45.4642,
            longitude: 9.1900,
            kind: 'walletobjects#latLongPoint'
          }
        ],
        textModulesData: [
          {
            header: 'PROGRAM',
            body: 'ReTap Loyalty Program',
            id: 'program'
          }
        ]
      };

      try {
        await walletobjects.loyaltyclass.get({ resourceId: classId });
        console.log('Classe pass esistente trovata');
      } catch (e) {
        console.log('Creazione nuova classe pass...');
        await walletobjects.loyaltyclass.insert({ requestBody: passClass });
        console.log('Classe pass creata con successo');
      }

      // Crea o aggiorna il pass
      const objectId = `${this.issuerId}.${body.cardId}`;
      const pass = {
        id: objectId,
        classId: classId,
        state: 'ACTIVE',
        heroImage: {
          sourceUri: {
            uri: 'https://i.ibb.co/ycNhdKK1/960x320.png'
          }
        },
        textModulesData: [
          {
            header: 'NOME',
            body: body.customerName,
            id: 'name'
          },
          {
            header: 'ID CARTA',
            body: body.cardId,
            id: 'card_id'
          },
          {
            header: 'UID',
            body: body.cardUid,
            id: 'card_uid'
          }
        ],
        barcode: {
          type: 'QR_CODE',
          value: JSON.stringify({
            type: 'retap_card',
            id: body.cardId,
            uid: body.cardUid
          }),
          alternateText: body.cardUid
        },
        accountId: body.cardId,
        accountName: body.customerName
      };

      try {
        await walletobjects.loyaltyobject.get({ resourceId: objectId });
        console.log('Pass esistente trovato, aggiornamento...');
        await walletobjects.loyaltyobject.update({ resourceId: objectId, requestBody: pass });
        console.log('Pass aggiornato con successo');
      } catch (e) {
        if (e.code === 404) {
          console.log('Pass non trovato, creazione nuovo...');
          await walletobjects.loyaltyobject.insert({ requestBody: pass });
          console.log('Pass creato con successo');
        } else {
          console.error('Errore durante la gestione del pass:', e.message);
          throw e;
        }
      }

      // Genera il JWT con firma RS256
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: this.serviceAccountEmail,
        aud: 'google',
        origins: ['retapcard.com'],
        typ: 'savetowallet',
        payload: {
          loyaltyObjects: [
            {
              id: objectId
            }
          ]
        },
        iat: now,
        exp: now + 3600 // 1 ora di validità
      };

      const jwtString = jwt.sign(jwtPayload, this.privateKey, {
        algorithm: 'RS256',
        header: {
          alg: 'RS256',
          typ: 'JWT',
          kid: this.privateKeyId
        }
      });

      const saveUrl = `https://pay.google.com/gp/v/save/${jwtString}`;

      console.log('URL Google Wallet generato con successo');
      return { saveUrl };
    } catch (error) {
      console.error('Errore nella generazione del pass Google Wallet:', error);
      throw new Error(`Errore nella generazione del pass Google Wallet: ${error.message}`);
    }
  }
} 